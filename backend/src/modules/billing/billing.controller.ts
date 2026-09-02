import { Request, Response } from 'express';
import {
  BillingError,
  MIN_RECHARGE_COP,
  PRICE_COP,
  movements,
  usageSummary
} from './billing.service';
import { limitesDelPeriodo, resumirPeriodo } from './extracto';

/**
 * What the firm has, what it spent, and why.
 *
 * Read-only. Credit only ever enters through the operator console and only ever
 * leaves through a completed operation: an endpoint a firm could call to change
 * its own balance is not a balance.
 */
const fail = (res: Response, err: unknown): void => {
  if (err instanceof BillingError) {
    res.status(err.status).json({ success: false, error: err.code, message: err.message });
    return;
  }

  console.error('[BILLING] Error inesperado:', err);
  res.status(500).json({ success: false, error: 'BILLING_FAILED', message: 'No se pudo leer el saldo.' });
};

/** GET /api/billing/summary */
export const billingSummaryController = async (req: Request, res: Response): Promise<void> => {
  try {
    res.json({
      success: true,
      summary: await usageSummary(req.firmId as string),
      // Sent so the screen states the price from the same source that charges
      // it, rather than repeating a number that can drift out of step.
      prices: PRICE_COP,
      // Same reason: the screen tells a firm the smallest recharge it can buy,
      // and the rule that will reject a smaller one is this same constant.
      minRecharge: MIN_RECHARGE_COP
    });
  } catch (err) {
    fail(res, err);
  }
};

/**
 * GET /api/billing/statement?periodo=YYYY-MM
 *
 * The month's ledger and its arithmetic, for the comprobante the firm prints.
 * The period defaults to the current month in Bogotá. It is a statement, not
 * an invoice — see `extracto.ts` for why that word matters here.
 */
const MAXIMO_MOVIMIENTOS_DEL_PERIODO = 2000;

const periodoActualEnBogota = (): string => {
  const bogota = new Date(Date.now() - 5 * 60 * 60 * 1000);
  return `${bogota.getUTCFullYear()}-${String(bogota.getUTCMonth() + 1).padStart(2, '0')}`;
};

export const billingStatementController = async (req: Request, res: Response): Promise<void> => {
  try {
    const periodo = typeof req.query.periodo === 'string' ? req.query.periodo : periodoActualEnBogota();
    const limites = limitesDelPeriodo(periodo);
    if (!limites) {
      res.status(400).json({
        success: false,
        error: 'INVALID_PERIOD',
        message: 'El período debe tener la forma AAAA-MM, por ejemplo 2026-09.'
      });
      return;
    }

    const movimientos = await movements(req.firmId as string, MAXIMO_MOVIMIENTOS_DEL_PERIODO, limites);
    res.json({
      success: true,
      periodo,
      desde: limites.desde,
      hasta: limites.hasta,
      truncado: movimientos.length >= MAXIMO_MOVIMIENTOS_DEL_PERIODO,
      movimientos,
      resumen: resumirPeriodo(movimientos)
    });
  } catch (err) {
    fail(res, err);
  }
};

/** GET /api/billing/movements */
export const billingMovementsController = async (req: Request, res: Response): Promise<void> => {
  try {
    res.json({ success: true, movements: await movements(req.firmId as string) });
  } catch (err) {
    fail(res, err);
  }
};
