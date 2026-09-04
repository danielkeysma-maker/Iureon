import { supabase } from '../../config/supabase.config';
import { crearIntencion, type CheckoutIntent } from '../billing/wompi/wompi.service';
import { esPeriodoPagable, esPlan, precioDe, type PaidPeriod, type Plan } from './plan.catalog';
import { PlanError } from './plan.service';

/**
 * Paying for a plan through the same Wompi checkout that recharges balance.
 *
 * Separate from `plan.service` so the import graph stays a line and not a
 * loop: billing → plan.service (guards), and this file → wompi → billing.
 * Merged into one module, `billing.service` would load `wompi.service` while
 * its own exports were still empty.
 *
 * The price is decided HERE from the catalogue and never read from the body:
 * a browser that names its own price is not a payment system. The intent is
 * written with purpose SUSCRIPCION so the webhook knows to extend the plan
 * instead of crediting balance.
 */
export const crearCheckoutDePlan = async (input: {
  firmId: string;
  userEmail: string;
  plan: unknown;
  period: unknown;
}): Promise<CheckoutIntent & { plan: Plan; period: PaidPeriod; amountCop: number }> => {
  if (!esPlan(input.plan)) {
    throw new PlanError('PLAN_UNAVAILABLE', 'Ese plan no existe.', 400);
  }
  if (!esPeriodoPagable(input.period)) {
    throw new PlanError('PLAN_UNAVAILABLE', 'El periodo debe ser MENSUAL o ANUAL.', 400);
  }

  const amountCop = precioDe(input.plan, input.period);

  const intent = await crearIntencion({
    firmId: input.firmId,
    userEmail: input.userEmail,
    amountCop,
    purpose: 'SUSCRIPCION',
    plan: input.plan,
    period: input.period
  });

  return { ...intent, plan: input.plan, period: input.period, amountCop };
};

export interface PagoDePlan {
  id: string;
  reference: string;
  plan: Plan;
  period: PaidPeriod;
  amountCop: number;
  validFrom: string;
  validUntil: string;
  userEmail: string;
  createdAt: string;
}

/** What the firm has paid for its plan, newest first. Never mixed with balance. */
export const historialDePagos = async (firmId: string, limit = 24): Promise<PagoDePlan[]> => {
  if (!supabase) {
    throw new PlanError('PLAN_UNAVAILABLE', 'La base de datos no está configurada.', 503);
  }

  const { data, error } = await supabase
    .from('subscription_payments')
    .select('id, reference, plan, plan_period, amount_cop, valid_from, valid_until, user_email, created_at')
    .eq('firm_id', firmId)
    .order('created_at', { ascending: false })
    .limit(limit);

  // Before the migration the table does not exist. An empty history is the
  // truth in that case — nothing has been paid — and the log names the cause.
  if (error) {
    console.error('[PLAN] No se pudo leer el historial de pagos:', error.message);
    return [];
  }

  return ((data ?? []) as Array<Record<string, unknown>>).map((fila) => ({
    id: String(fila.id),
    reference: String(fila.reference),
    plan: fila.plan as Plan,
    period: fila.plan_period as PaidPeriod,
    amountCop: Number(fila.amount_cop),
    validFrom: String(fila.valid_from),
    validUntil: String(fila.valid_until),
    userEmail: String(fila.user_email),
    createdAt: String(fila.created_at)
  }));
};
