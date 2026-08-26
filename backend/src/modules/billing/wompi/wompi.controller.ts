import { Request, Response } from 'express';
import { config } from '../../../config/env.config';
import { BillingError } from '../billing.service';
import { aplicarEvento, crearIntencion, eventoEsAutentico, intencionesDe } from './wompi.service';
import type { WompiEvent } from './wompi.service';

const fail = (res: Response, err: unknown, fallback: string): void => {
  if (err instanceof BillingError) {
    res.status(err.status).json({ success: false, error: err.code, message: err.message });
    return;
  }

  console.error('[WOMPI] Error inesperado:', err);
  res.status(500).json({ success: false, error: 'WOMPI_FAILED', message: fallback });
};

/**
 * POST /api/billing/recharge — starts a recharge and returns what the checkout needs.
 *
 * The amount is taken from the body and immediately bounded by the same
 * minimum the panel states; the firm is taken from the verified token and never
 * from the body, so a lawyer cannot start a recharge onto another firm's
 * balance by naming it.
 */
export const startRechargeController = async (req: Request, res: Response): Promise<void> => {
  try {
    const intent = await crearIntencion({
      firmId: req.firmId as string,
      userEmail: req.user!.email,
      amountCop: Number(req.body.amount)
    });

    res.json({ success: true, intent });
  } catch (err) {
    fail(res, err, 'No se pudo iniciar la recarga.');
  }
};

/** GET /api/billing/recharges — the firm's own recharge attempts. */
export const rechargesController = async (req: Request, res: Response): Promise<void> => {
  try {
    res.json({ success: true, recharges: await intencionesDe(req.firmId as string) });
  } catch (err) {
    fail(res, err, 'No se pudieron leer las recargas.');
  }
};

/**
 * POST /api/billing/wompi/events — what Wompi says happened.
 *
 * PUBLIC BY NECESSITY, SAFE BY SIGNATURE. Wompi holds no session and cannot
 * present a token, so this endpoint is mounted before the tenant middleware and
 * is reachable by anyone who learns the URL. The only thing standing between
 * that and an attacker crediting themselves for ever is the checksum, so it is
 * verified before the body is read for anything else.
 *
 * IT ANSWERS 200 TO ALMOST EVERYTHING, and that is deliberate. Wompi retries
 * any event that does not get a 2xx, so returning an error for a payment that
 * was already credited, or for an event about a reference we do not recognise,
 * buys an endless retry loop and no fix. The two cases that DO return an error
 * are a bad signature — which must never look accepted — and a database failure,
 * which is the one case where retrying is exactly what should happen.
 */
export const wompiEventsController = async (req: Request, res: Response): Promise<void> => {
  if (!config.wompi.enabled) {
    res.status(503).json({ success: false, error: 'GATEWAY_UNAVAILABLE' });
    return;
  }

  const evento = req.body as WompiEvent;

  if (!eventoEsAutentico(evento, config.wompi.eventsSecret)) {
    // Logged without the body: an unverified payload is attacker-controlled and
    // does not belong in the logs an operator reads.
    console.warn('[WOMPI] Evento rechazado: firma inválida.');
    res.status(401).json({ success: false, error: 'INVALID_SIGNATURE' });
    return;
  }

  try {
    const resultado = await aplicarEvento(evento);

    if (resultado.handled === 'CREDITED') {
      console.log('[WOMPI] Recarga acreditada. Saldo resultante:', resultado.balance);
    }

    res.json({ success: true, handled: resultado.handled });
  } catch (err) {
    fail(res, err, 'No se pudo procesar el evento.');
  }
};
