import { Request, Response } from 'express';
import { auditService } from '../audit/audit.service';
import { randomUUID } from 'node:crypto';
import { OpenRouterMultiEngineService, AgentExecutionStep } from './openrouter.service';
import { mensajeInicioLectura, renderBloqueAdjuntos, resumenDeLectura, validarAdjuntos } from './adjuntos/adjuntos';
import { leerAdjuntos } from './adjuntos/leerAdjuntos';
import {
  BillingError,
  balanceOf,
  maxOutputTokensFor,
  refundReservation,
  reserveForOperation,
  settleOperation
} from '../billing/billing.service';

const aiService = new OpenRouterMultiEngineService();

export const streamAgentDraftController = async (req: Request, res: Response): Promise<void> => {
  const firmId = req.firmId;
  /*
   * LA RAMA VIAJA HASTA EL CATALOGO, y antes se caia aqui.
   *
   * El taller la enviaba desde el primer dia y este destructuring no la leia,
   * asi que `buildCatalogGuidanceForFirm` resolvia contra las 651 fichas sin
   * rama. La guarda de ambiguedad hace entonces lo que debe — se niega — y
   * "Solicitud de medidas cautelares", "Recurso de suplica" o "Recurso
   * extraordinario de revision", que existen en ADMINISTRATIVO y en CIVIL con
   * plazos distintos, resolvian a null: sin articulo, sin autoridad y sin
   * termino verificado, el modelo escribia la norma DE MEMORIA.
   *
   * Es el defecto mas caro posible porque es invisible: la pantalla muestra la
   * ficha correcta (los selectores SI mandan la rama a /catalog) mientras el
   * escrito se redacta sin ella.
   */
  const {
    documentType,
    legalBranch,
    legalPrompt,
    expedienteId,
    existingDraft,
    customFormatInstruction
  } = req.body;

  if (!legalPrompt) {
    res.status(400).json({ error: 'MISSING_PROMPT', message: 'Se requiere la instrucción jurídica en legalPrompt' });
    return;
  }

  /*
   * Validated BEFORE the reservation: a malformed attachment list is a client
   * bug, and a client bug must not cost a reservation-and-refund round trip.
   * The files themselves are read after the stream opens, so the lawyer sees
   * «Leyendo 2 adjuntos…» instead of a mute button while a PDF is decoded.
   */
  const adjuntosValidados = validarAdjuntos(req.body.adjuntos);
  if (!adjuntosValidados.ok) {
    res.status(400).json({ error: 'INVALID_ATTACHMENTS', message: adjuntosValidados.motivo });
    return;
  }
  const adjuntos = adjuntosValidados.adjuntos;

  /*
   * The balance is checked BEFORE the stream opens, and before a peso is spent
   * upstream.
   *
   * Two reasons it cannot wait until the end. The platform pays OpenRouter per
   * call whether or not the firm can be charged, so a late check means Iureon
   * funds work it cannot bill. And telling a lawyer their draft is finished but
   * unaffordable is worse than telling them at the start that it is — one is a
   * decision they can still make, the other is a document they cannot have.
   *
   * A plain JSON error, not an SSE event: the stream has not started, so the
   * client can read this as an ordinary failure.
   */
  let reserved = 0;

  try {
    ({ reserved } = await reserveForOperation({
      firmId: firmId as string,
      userEmail: req.user?.email ?? 'desconocido',
      operation: 'BORRADOR'
    }));
  } catch (err) {
    if (err instanceof BillingError) {
      res.status(err.status).json({ error: err.code, message: err.message, balance: err.balance });
      return;
    }
    throw err;
  }

  // Shared by every model call of this draft, so the ledger can total what ONE
  // document cost across three engines rather than only what one stage did.
  const operationId = randomUUID();

  /*
   * The balance decides how long the document may be.
   *
   * Without this the model writes whatever it likes, and the charge either has
   * to truncate a filing mid-sentence by a rule nobody was told, or land above
   * what the firm can pay — work already done and unbillable. Capping at what
   * the balance affords means a short draft always has a reason the lawyer can
   * see: they ran out of credit, and they can recharge.
   */
  const maxDraftTokens = maxOutputTokensFor(await balanceOf(firmId as string));

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sendEvent = (event: string, data: any) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    sendEvent('CONNECTED', { firmId, status: 'STARTING_MULTI_ENGINE_PIPELINE' });

    /*
     * Stage 0 — the attached files, before any engine runs.
     *
     * Read here and not inside the pipeline because this is where the B2
     * objects are deleted (before responding, as always) and where the ledger
     * context lives: an image costs a Gemini call, charged as part of BORRADOR
     * under the same operationId. Both lines reach the «Ejecución» console
     * through the same AGENT_LOG event the stages use.
     */
    let bloqueAdjuntos: string | undefined;
    if (adjuntos.length > 0) {
      sendEvent('AGENT_LOG', {
        stage: 'STAGE_0_ADJUNTOS',
        engine: 'GEMINI',
        message: mensajeInicioLectura(adjuntos.length),
        timestamp: new Date().toISOString()
      } satisfies AgentExecutionStep);

      const leidos = await leerAdjuntos(
        { firmId: firmId as string, userEmail: req.user?.email ?? 'desconocido', operationId },
        adjuntos
      );
      bloqueAdjuntos = renderBloqueAdjuntos(leidos) || undefined;

      sendEvent('AGENT_LOG', {
        stage: 'STAGE_0_ADJUNTOS',
        engine: 'GEMINI',
        message: resumenDeLectura(leidos),
        timestamp: new Date().toISOString(),
        data: { adjuntos: leidos.map(({ nombre, ok, caracteres, motivo }) => ({ nombre, ok, caracteres, motivo })) }
      } satisfies AgentExecutionStep);
    }

    const result = await aiService.executeMultiEnginePipeline(
      {
        firmId: firmId || 'unknown-firm',
        userEmail: req.user?.email ?? 'desconocido',
        operationId,
        maxDraftTokens,
        documentType: documentType || 'Contestación de Demanda',
        legalBranch,
        legalPrompt,
        expedienteId,
        existingDraft,
        /*
         * El formato de la firma (numeracion de hechos, titulos, bloque de
         * firma) viaja hasta el prompt del modelo que escribe. El pipeline lo
         * aceptaba desde el principio — customFormat en buildClaudeDraftPrompt —
         * y nadie se lo enviaba: era un ajuste que se guardaba y no hacia nada.
         */
        customFormatInstruction,
        bloqueAdjuntos
      },
      (step: AgentExecutionStep) => {
        sendEvent('AGENT_LOG', step);
      }
    );

    /*
     * Charged once the document exists, not when the request arrived.
     *
     * The pipeline degrades to a static template when the engines fail, and
     * charging for that would be selling a form letter at the price of a
     * drafted document. The stages recorded what they cost either way.
     */
    const cobro = await settleOperation({
      firmId: firmId as string,
      userEmail: req.user?.email ?? 'desconocido',
      operation: 'BORRADOR',
      operationId,
      description: `Borrador: ${result.title}`,
      reserved
    });

    /*
     * A la auditoria ANTES de responder: una funcion serverless se congela al
     * responder, y un registro dejado "para despues" no se escribe nunca.
     */
    await auditService.record({
      firmId: firmId as string,
      userEmail: req.user?.email ?? 'desconocido',
      action: 'DRAFT_GENERATED',
      resource: `Generó escrito · ${result.title}`
    });

    sendEvent('COMPLETED', {
      ...result,
      charged: cobro.charged,
      balance: cobro.balance,
      // Sent so the screen can explain a charge above the ordinary price
      // instead of leaving the lawyer to discover it in their movements.
      costUsd: cobro.costUsd
    });
    res.end();
  } catch (error: any) {
    console.error('[AGENT-CONTROLLER-ERROR]', error);

    /*
     * The reservation goes back when nothing was produced.
     *
     * A firm must not pay for a draft that failed — and the credit was taken
     * before the work precisely so nobody could start one they could not pay
     * for, which only holds up if a failure returns it.
     */
    await refundReservation({
      firmId: firmId as string,
      userEmail: req.user?.email ?? 'desconocido',
      operation: 'BORRADOR',
      reason: 'Devolución: el borrador no se pudo generar'
    });

    sendEvent('ERROR', { message: error.message || 'Error durante la orquestación del agente RAG' });
    res.end();
  }
};
