import type { NextFunction, Request, Response } from 'express';
import { esVigente, estadoDelPlan } from './plan.catalog';
import { leerPlan, mensajeDePlanVencido } from './plan.service';

/**
 * Read-only enforcement for an expired plan, one route at a time.
 *
 * WHY PER ROUTE AND NOT `app.use`. The list of what stays open when a plan
 * expires is the product's promise to a firm that has not paid yet: it can log
 * in, read and export everything it already has, read the manual, talk to
 * support, and — above all — open «Plan» and pay. A global guard with an
 * exception list inverts that: every new route is closed by default and the
 * next endpoint someone adds for payments or support silently locks the firm
 * out. Naming the guard on each write keeps the allow-list visible in the
 * router where the route is declared.
 *
 * WHY IT FAILS OPEN. `leerPlan` already reads an unreadable row as legacy
 * CORTESÍA (missing migration). Anything else that throws here — no database
 * client, a timeout — lets the request through too: an outage must never
 * become a lockout for a firm that is paying, and every write this guards is
 * behind a verified session anyway. The paid operations keep their own
 * reserve-time check in billing, so failing open here costs nothing they do
 * not already control.
 *
 * WHY 402 AND NOT 403. The firm is not forbidden; it owes a payment, and the
 * screen turns `PLAN_VENCIDO` into the button that pays it.
 */
export const bloquearSiPlanVencido = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const firmId = req.firmId;
  if (!firmId) {
    next();
    return;
  }

  try {
    const row = await leerPlan(firmId);
    if (!esVigente(estadoDelPlan(row, new Date()))) {
      res.status(402).json({ success: false, error: 'PLAN_VENCIDO', message: mensajeDePlanVencido(row.validUntil) });
      return;
    }
  } catch (err) {
    console.error('[PLAN] No se pudo comprobar la vigencia; la escritura sigue:', err instanceof Error ? err.message : err);
  }

  next();
};
