import { Request, Response } from 'express';
import { auditService } from '../audit/audit.service';
import { randomUUID } from 'node:crypto';
import { OpenRouterMultiEngineService, AgentExecutionStep } from './openrouter.service';
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
  const { documentType, legalPrompt, expedienteId, existingDraft } = req.body;

  if (!legalPrompt) {
    res.status(400).json({ error: 'MISSING_PROMPT', message: 'Se requiere la instrucción jurídica en legalPrompt' });
    return;
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

    const result = await aiService.executeMultiEnginePipeline(
      {
        firmId: firmId || 'unknown-firm',
        userEmail: req.user?.email ?? 'desconocido',
        operationId,
        maxDraftTokens,
        documentType: documentType || 'Contestación de Demanda',
        legalPrompt,
        expedienteId,
        existingDraft
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
