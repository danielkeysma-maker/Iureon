import { Request, Response } from 'express';
import { BillingError } from '../billing/billing.service';
import { AuthError, listFirmUsers } from '../auth/auth.service';
import { PLANES } from './plan.catalog';
import { planDeFirma, responderPlanError } from './plan.service';
import { crearCheckoutDePlan, historialDePagos } from './planCheckout.service';

/**
 * The firm's plan: what it has, what it can buy, what it has paid.
 *
 * Every handler reads the firm from the verified token. There is no firm id in
 * any body or query: a lawyer cannot read, pay for or extend another firm's
 * plan by naming it.
 */

const fail = (res: Response, err: unknown, fallback: string): void => {
  if (responderPlanError(res, err)) return;

  if (err instanceof BillingError || err instanceof AuthError) {
    res.status(err.status).json({ success: false, error: err.code, message: err.message });
    return;
  }

  console.error('[PLAN] Error inesperado:', err);
  res.status(500).json({ success: false, error: 'PLAN_FAILED', message: fallback });
};

/** Paying binds the firm for a period; only its administrators do that. */
const soloAdmin = (req: Request, res: Response): boolean => {
  if (req.user?.role !== 'FIRM_ADMIN' && req.user?.role !== 'SUPER_ADMIN') {
    res.status(403).json({
      success: false,
      error: 'FORBIDDEN',
      message: 'Solo un administrador de la firma puede gestionar el plan.'
    });
    return false;
  }
  return true;
};

/** GET /api/subscription/plan — the firm's plan and the catalogue to choose from. */
export const planController = async (req: Request, res: Response): Promise<void> => {
  try {
    res.json({
      success: true,
      plan: await planDeFirma(req.firmId as string),
      planes: PLANES
    });
  } catch (err) {
    fail(res, err, 'No se pudo leer el plan de la firma.');
  }
};

/** POST /api/subscription/checkout { plan, period } — what the Wompi checkout needs. */
export const checkoutController = async (req: Request, res: Response): Promise<void> => {
  if (!soloAdmin(req, res)) return;

  try {
    const intent = await crearCheckoutDePlan({
      firmId: req.firmId as string,
      userEmail: req.user!.email,
      plan: req.body?.plan,
      period: req.body?.period
    });

    res.json({ success: true, intent });
  } catch (err) {
    fail(res, err, 'No se pudo iniciar el pago del plan.');
  }
};

/** GET /api/subscription/payments — what the firm has paid for its plan. */
export const paymentsController = async (req: Request, res: Response): Promise<void> => {
  try {
    res.json({ success: true, payments: await historialDePagos(req.firmId as string) });
  } catch (err) {
    fail(res, err, 'No se pudo leer el historial de pagos.');
  }
};

/**
 * GET /api/subscription/firm-users — the firm's real accounts.
 *
 * Kept because the route existed; it now answers with the same listing as
 * /api/auth/users, for the same audience. Creating accounts lives ONLY at
 * POST /api/auth/users, where the plan's user cap is enforced — the old mock
 * invite that fabricated an account without writing it is gone.
 */
export const firmUsersController = async (req: Request, res: Response): Promise<void> => {
  if (!soloAdmin(req, res)) return;

  try {
    res.json({ success: true, users: await listFirmUsers(req.firmId as string) });
  } catch (err) {
    fail(res, err, 'No se pudieron listar los usuarios.');
  }
};
