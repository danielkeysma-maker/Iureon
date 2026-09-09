import { Request, Response } from 'express';
import { auditService } from '../audit/audit.service';
import { randomUUID } from 'node:crypto';
import { OpenRouterMultiEngineService, AgentExecutionStep } from './openrouter.service';
import { mensajeInicioLectura, renderBloqueAdjuntos, resumenDeLectura, validarAdjuntos } from './adjuntos/adjuntos';
import { leerAdjuntos } from './adjuntos/leerAdjuntos';
import { exigirFuncion, responderPlanError } from '../subscriptions/plan.service';
import {
  BillingError,
  balanceOf,
  maxOutputTokensFor,
  refundReservation,
  reserveForOperation,
  settleOperation
} from '../billing/billing.service';
import { PLAZO_REDACCION_MS, TiempoDeRedaccionAgotado, TOPE_DE_FUNCION_MS } from './presupuestoDeTiempo';

const aiService = new OpenRouterMultiEngineService();

/**
 * Qué se hace con la reserva y qué se le dice al abogado cuando la redacción
 * falla.
 *
 * ─── POR QUÉ ES UNA FUNCIÓN Y NO DOS LÍNEAS DENTRO DEL `catch` ─────────────
 *
 * Porque es la regla que el saldo de una firma depende de, y una regla que solo
 * existe dentro de un `catch` de un controlador con flujo SSE no se puede
 * comprobar sin montar la aplicación entera. Aquí sí: `plazos.check.ts` la
 * interroga directamente y sostiene lo único que no puede fallar — que agotar
 * el plazo DEVUELVE la reserva.
 *
 * Y devuelve la reserva SIEMPRE, cualquiera que sea la causa: si no hubo
 * escrito, no hay nada que cobrar. Lo que cambia con la causa es el mensaje,
 * porque «se acabó el tiempo que permite el plan» y «el motor no respondió» le
 * piden cosas distintas al abogado.
 */
export const desenlaceDeFallo = (
  error: unknown
): { devuelveReserva: true; razon: string; mensaje: string } => {
  if (error instanceof TiempoDeRedaccionAgotado) {
    return {
      devuelveReserva: true,
      razon: `Devolución: se agotó el plazo en «${error.etapa}»`,
      /*
       * NO SE LE PROPONE AL ABOGADO NADA QUE NO SE HAYA MEDIDO.
       *
       * La primera versión de este mensaje le decía «un escrito más corto sí
       * alcanza». Se midió antes de dejarlo escrito, y es falso: un recurso de
       * reposición con UN SOLO hecho, 227 caracteres de indicación, también
       * agotó los 33 s. El motor escribe a unos 75 tokens por segundo y el
       * escrito más breve pasa de los 2.500. Sugerirle que recorte el caso lo
       * mandaría a intentarlo una y otra vez contra un muro que no depende de
       * él — la peor clase de mensaje de error, el que culpa al usuario de un
       * límite de la casa.
       */
      mensaje:
        `La redacción no alcanzó a terminar dentro del tiempo que la plataforma nos permite ` +
        `por solicitud (${Math.round(TOPE_DE_FUNCION_MS / 1000)} segundos, de los cuales ` +
        `${Math.round(PLAZO_REDACCION_MS / 1000)} son para escribir). No se descontó saldo: ` +
        `su reserva ya volvió a la cuenta. Esto no depende de la extensión de su caso ni de ` +
        `nada que usted pueda cambiar. Vuelva a intentarlo: si vuelve a ocurrir, ` +
        `avísenos, porque con el plan actual un escrito corriente cabe de sobra y ` +
        `que no quepa significa que algo va mal de nuestro lado.`
    };
  }

  return {
    devuelveReserva: true,
    razon: 'Devolución: el borrador no se pudo generar',
    mensaje:
      (error instanceof Error && error.message) || 'Error durante la orquestación del agente RAG'
  };
};

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
   * SIN ACTUACIÓN NO SE REDACTA. NO SE ELIGE UNA POR EL ABOGADO.
   *
   * El tipo se rellenaba aquí con un valor por defecto al llamar al pipeline:
   * una petición sin tipo se convertía, en silencio, en una contestación de
   * demanda — y el nombre viajaba a las tres etapas, al título
   * del archivo y a la procedencia del borrador como si el abogado la hubiera
   * pedido. Es exactamente el síntoma reportado («el escrito no es del tipo que
   * pedí»), producido por la aplicación y no por el modelo.
   *
   * El taller ya no deja generar sin elegir (el botón se deshabilita), así que
   * una petición sin tipo viene de fuera de esa pantalla y merece un error, no
   * una suplencia.
   */
  const tipoElegido = typeof documentType === 'string' ? documentType.trim() : '';
  if (!tipoElegido) {
    res.status(400).json({
      error: 'MISSING_DOCUMENT_TYPE',
      message: 'Elija la actuación antes de generar: la aplicación no escoge una por usted.'
    });
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
   * Attachments are a sub-service the operator can switch off for one firm.
   * Refused before the stream opens and before any reservation: the screen
   * hides the button, so a request carrying files came from outside it.
   */
  if (adjuntos.length > 0) {
    try {
      await exigirFuncion(firmId as string, 'REDACCION.ADJUNTOS');
    } catch (err) {
      if (responderPlanError(res, err)) return;
      throw err;
    }
  }

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
  // document cost across both engines rather than only what one stage did.
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
        documentType: tipoElegido,
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
     * Si el pipeline no entrega escrito —porque el motor calló o porque se agotó
     * el presupuesto de tiempo—, esto no se ejecuta: lanza, y el `catch`
     * devuelve la reserva. Las etapas registraron su costo de todas formas.
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
     *
     * Y el mensaje sale de `desenlaceDeFallo`, que distingue el plazo agotado
     * de cualquier otro fallo: el primero le dice al abogado que el escrito no
     * cupo en el tiempo de la plataforma, con los segundos escritos, en vez de
     * dejarle una consola muda. Antes de que existiera el presupuesto por
     * etapa, este `catch` NO CORRÍA en producción cuando el reloj se agotaba:
     * la plataforma mataba la función y con ella la devolución de la reserva.
     */
    const desenlace = desenlaceDeFallo(error);

    if (desenlace.devuelveReserva) {
      await refundReservation({
        firmId: firmId as string,
        userEmail: req.user?.email ?? 'desconocido',
        operation: 'BORRADOR',
        reason: desenlace.razon
      });
    }

    sendEvent('ERROR', { message: desenlace.mensaje });
    res.end();
  }
};
