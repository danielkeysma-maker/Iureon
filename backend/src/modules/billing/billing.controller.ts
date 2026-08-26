import { Request, Response } from 'express';
import { BillingError, PRICE_COP, movements, usageSummary } from './billing.service';

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
      prices: PRICE_COP
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
