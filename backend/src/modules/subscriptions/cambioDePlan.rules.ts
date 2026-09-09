/**
 * WHEN THE PERIOD A PAYMENT BUYS STARTS TO RUN.
 *
 * The mirror, with no I/O, of the decision `apply_subscription_payment` makes
 * inside Postgres (`supabase/migration-cambio-de-plan.sql`). The database is
 * the one that writes the date; this states the rule so the screen can warn
 * the partner BEFORE they pay and so `check:cambio-plan` can prove it without
 * a database, a gateway or a network.
 *
 * THE RULE, AND WHY IT IS TWO RULES AND NOT ONE:
 *
 *   * RENEWING the same plan EXTENDS from the current expiry. Paying on the
 *     10th a plan that expires on the 20th runs to the 20th of next month:
 *     the ten remaining days are not lost. That is the promise the plan screen
 *     has always made and it does not change.
 *
 *   * CHANGING plan STARTS TODAY. The new plan is paid in full and its cycle
 *     begins on the day of the payment; whatever was left of the previous plan
 *     is neither credited nor refunded. Proration was considered and dropped on
 *     purpose: refunding a difference through the gateway costs a second Wompi
 *     transaction whose fixed fee eats a small amount, so the house loses money
 *     doing the favour. The firm that wants to keep its expiry date writes to
 *     Soporte, sends the difference outside the gateway, and operation moves the
 *     plan by hand keeping the date. Two ways, both honest, and the screen says
 *     which is which before the payment, never after.
 *
 * A PERIOD CHANGE ON THE SAME PLAN IS A RENEWAL. Premium monthly to Premium
 * annual extends from the expiry: the same service bought for longer. The
 * comparison is on the PLAN, never on the period — charging the annual upgrade
 * as a plan change would punish exactly the purchase the house wants.
 *
 * A FIRM WITH NO PLAN (courtesy, legacy or a fresh registration, `null`) is not
 * changing plan: there is no previous plan to lose, so it follows the renewal
 * branch, which with no expiry date resolves to now anyway.
 */
import type { PaidPeriod, Plan } from './plan.catalog';
import { sumarMeses } from './plan.catalog';

/**
 * Where the paid period starts.
 *
 * `AHORA` — the day of the payment, because the plan changed.
 * `DESDE_EL_VENCIMIENTO` — the expiry still in the future, because this is a
 * renewal and the remaining days are kept.
 *
 * The two names say WHY, not just what: the screen chooses its warning from
 * this value, and a boolean would have made the caller re-derive the reason.
 */
export type InicioDelPeriodo = 'AHORA' | 'DESDE_EL_VENCIMIENTO';

export interface DecisionDeInicio {
  inicio: InicioDelPeriodo;
  /** True only when a real, different previous plan is being replaced. */
  esCambioDePlan: boolean;
  validFrom: Date;
}

/**
 * Whether this payment replaces a DIFFERENT plan the firm already holds.
 *
 * `null` is not a change: nothing is being replaced. The expiry plays no part
 * here — a firm whose plan expired last month is still on that plan, and
 * moving it to another one is a change like any other.
 */
export const esCambioDePlan = (planActual: Plan | null, planPagado: Plan): boolean =>
  planActual !== null && planActual !== planPagado;

/**
 * From when the paid period runs, given the plan the firm holds, the plan it
 * just paid for and its current expiry.
 */
export const decidirInicio = (input: {
  planActual: Plan | null;
  planPagado: Plan;
  vigenteHasta: Date | null;
  ahora: Date;
}): DecisionDeInicio => {
  const cambio = esCambioDePlan(input.planActual, input.planPagado);

  const extiende =
    !cambio && input.vigenteHasta !== null && input.vigenteHasta.getTime() > input.ahora.getTime();

  return {
    inicio: extiende ? 'DESDE_EL_VENCIMIENTO' : 'AHORA',
    esCambioDePlan: cambio,
    validFrom: new Date((extiende ? (input.vigenteHasta as Date) : input.ahora).getTime())
  };
};

/**
 * The whole period a payment buys, start and end, under the same rule. The end
 * is `sumarMeses` — the calendar arithmetic Postgres does — so the screen can
 * predict the date the database will write.
 */
export const periodoDelPago = (input: {
  planActual: Plan | null;
  planPagado: Plan;
  vigenteHasta: Date | null;
  ahora: Date;
  period: PaidPeriod;
}): { validFrom: Date; validUntil: Date; inicio: InicioDelPeriodo; esCambioDePlan: boolean } => {
  const decision = decidirInicio(input);
  return {
    ...decision,
    validUntil: sumarMeses(decision.validFrom, input.period === 'ANUAL' ? 12 : 1)
  };
};

/**
 * Whether the plan screen must warn before this payment: the firm is moving to
 * a different plan AND it still has paid time left, which is exactly the time
 * it is about to give up. A firm whose plan already expired loses nothing, so
 * warning it would be a false alarm about a cost it is not paying.
 */
export const debeAdvertirCambio = (input: {
  planActual: Plan | null;
  planPagado: Plan;
  vigenteHasta: Date | null;
  ahora: Date;
}): boolean =>
  esCambioDePlan(input.planActual, input.planPagado) &&
  input.vigenteHasta !== null &&
  input.vigenteHasta.getTime() > input.ahora.getTime();
