/**
 * Whether a firm that already exists may open the 7-day trial of Esencial,
 * with no I/O.
 *
 * WHY THIS DOOR EXISTS. The public «Contratar» creates a firm born expired:
 * the plan chosen, `plan_valid_until = now`, the application in read only
 * with the plan screen in front. That firm never saw the trial the landing
 * offers next to it, and the only way to try the product was to pay. This
 * rule lets exactly that firm — new, unpaid, one seat — take the same trial
 * the landing gives, and nobody else.
 *
 * Kept free of imports that reach the database so `plan.check.ts` can prove
 * the decision without credentials — the same split `trial.rules.ts` /
 * `trial.service.ts` uses.
 */

/** What the service reads before deciding. Every flag is "true = a reason to refuse". */
export interface SenalesDePrueba {
  /** A `trial_signups` row with this firm in PRUEBA mode, or the firm's period is already PRUEBA. */
  firmaYaProbo: boolean;
  /** At least one row in `subscription_payments` for the firm. */
  firmaYaPago: boolean;
  /** The requesting e-mail or address already has a trial anywhere (`pruebaYaUsada`). */
  personaYaProbo: boolean;
  /** Accounts the firm has today. */
  usuarios: number;
}

export type CodigoDeRechazo = 'TRIAL_ALREADY_USED' | 'TRIAL_NOT_AVAILABLE';

export type DecisionDePrueba =
  | { disponible: true }
  | { disponible: false; codigo: CodigoDeRechazo; motivo: string };

/** The trial is one seat; a firm that already has two people is not the firm it is for. */
export const MAX_USUARIOS_PARA_PRUEBA = 1;

/**
 * The firm's own reasons come before the person's: «la firma ya pagó» tells
 * an administrator more than «ya usó su prueba» when both are true. The
 * person's reason is last and carries the exact sentence the public form
 * uses, so a second attempt from any door reads the same.
 */
export const decidirPrueba = (s: SenalesDePrueba, mensajePersonaYaProbo: string): DecisionDePrueba => {
  if (s.firmaYaPago) {
    return {
      disponible: false,
      codigo: 'TRIAL_NOT_AVAILABLE',
      motivo: 'La firma ya pagó un plan; la prueba gratuita es solo para firmas que todavía no han contratado.'
    };
  }
  if (s.firmaYaProbo) {
    return {
      disponible: false,
      codigo: 'TRIAL_NOT_AVAILABLE',
      motivo: 'Esta firma ya tuvo su prueba gratuita. Puede contratar un plan.'
    };
  }
  if (s.usuarios > MAX_USUARIOS_PARA_PRUEBA) {
    return {
      disponible: false,
      codigo: 'TRIAL_NOT_AVAILABLE',
      motivo: `La prueba gratuita es de un solo usuario y la firma ya tiene ${s.usuarios}. Puede contratar un plan.`
    };
  }
  if (s.personaYaProbo) {
    return { disponible: false, codigo: 'TRIAL_ALREADY_USED', motivo: mensajePersonaYaProbo };
  }
  return { disponible: true };
};
