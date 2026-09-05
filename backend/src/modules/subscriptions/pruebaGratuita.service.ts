import { supabase } from '../../config/supabase.config';
import { AuthError } from '../auth/auth.service';
import { auditService } from '../audit/audit.service';
import { DIAS_DE_PRUEBA_GRATUITA, PLAN_DE_PRUEBA, USUARIOS_DE_PRUEBA, vencimientoDePrueba } from '../trial/trial.rules';
import { MENSAJE_PRUEBA_USADA, pruebaYaUsada } from '../trial/trial.service';
import { PLANES } from './plan.catalog';
import { contarUsuarios, leerPlan, planDeFirma, type PlanDeFirma } from './plan.service';
import { decidirPrueba, type DecisionDePrueba } from './pruebaGratuita.rules';

/**
 * The 7-day trial of Esencial, asked for from INSIDE an existing firm.
 *
 * Same trial as the landing's (`trial.service.ts`), same table, same
 * one-per-person rule: the row in `trial_signups` is written with the same
 * shape, so a person who tried from here cannot try again from the landing,
 * and the other way round. What differs is that the firm already exists —
 * born expired through «Contratar» — so instead of creating it, its plan row
 * is rewritten to PRUEBA for seven days.
 *
 * FAILS CLOSED. If `trial_signups` or `subscription_payments` cannot be read,
 * the trial is reported as not available and refused: the rows ARE the rule,
 * and a rule that disappears with a pending migration is a free plan for
 * whoever notices first.
 */

const MENSAJE_NO_DISPONIBLE = 'La prueba gratuita no está disponible por ahora.';

const requireClient = () => {
  if (!supabase) throw new AuthError('TRIAL_UNAVAILABLE', MENSAJE_NO_DISPONIBLE, 503);
  return supabase;
};

const firmaTienePruebaAnotada = async (firmId: string): Promise<boolean> => {
  const { count, error } = await requireClient()
    .from('trial_signups')
    .select('id', { count: 'exact', head: true })
    .eq('firm_id', firmId)
    .eq('modo', 'PRUEBA');
  if (error) {
    console.error(
      '[TRIAL] No se pudo comprobar si la firma ya probó; la prueba se rechaza. ' +
        `Falta correr supabase/migration-prueba-gratuita.sql. Detalle: ${error.message}`
    );
    throw new AuthError('TRIAL_UNAVAILABLE', MENSAJE_NO_DISPONIBLE, 503);
  }
  return (count ?? 0) > 0;
};

const firmaYaPago = async (firmId: string): Promise<boolean> => {
  const { count, error } = await requireClient()
    .from('subscription_payments')
    .select('id', { count: 'exact', head: true })
    .eq('firm_id', firmId);
  if (error) {
    console.error('[TRIAL] No se pudo comprobar los pagos de la firma; la prueba se rechaza. Detalle:', error.message);
    throw new AuthError('TRIAL_UNAVAILABLE', MENSAJE_NO_DISPONIBLE, 503);
  }
  return (count ?? 0) > 0;
};

/** What `planDeFirma` already read, so GET /subscription/plan does not read it twice. */
export interface ContextoDePlan {
  period: PlanDeFirma['period'];
  usuarios: number;
}

/**
 * Whether this firm, asked by this person from this address, may open the
 * trial. Never throws: an unreadable rule is «no disponible».
 */
export const pruebaDisponibleParaFirma = async (
  firmId: string,
  correo: string,
  ip: string | null,
  contexto?: ContextoDePlan
): Promise<DecisionDePrueba> => {
  try {
    const [period, usuarios, anotada, pago, persona] = await Promise.all([
      contexto ? Promise.resolve(contexto.period) : leerPlan(firmId).then((r) => r.period),
      contexto ? Promise.resolve(contexto.usuarios) : contarUsuarios(firmId),
      firmaTienePruebaAnotada(firmId),
      firmaYaPago(firmId),
      pruebaYaUsada(correo, ip)
    ]);
    return decidirPrueba(
      { firmaYaProbo: anotada || period === 'PRUEBA', firmaYaPago: pago, personaYaProbo: persona, usuarios },
      MENSAJE_PRUEBA_USADA
    );
  } catch (err) {
    console.error('[TRIAL] No se pudo decidir la prueba de la firma:', err instanceof Error ? err.message : err);
    return { disponible: false, codigo: 'TRIAL_NOT_AVAILABLE', motivo: MENSAJE_NO_DISPONIBLE };
  }
};

/**
 * Opens the trial for the firm. The `trial_signups` row goes FIRST — it is
 * the one-per-person rule — and is removed if the plan cannot be written, so
 * a failed attempt does not spend the person's only trial.
 */
export const activarPruebaGratuita = async (input: {
  firmId: string;
  correo: string;
  ip: string | null;
}): Promise<PlanDeFirma> => {
  const decision = await pruebaDisponibleParaFirma(input.firmId, input.correo, input.ip);
  if (!decision.disponible) {
    throw new AuthError(decision.codigo, decision.motivo, 409);
  }

  const client = requireClient();
  const { data: rastro, error: rastroError } = await client
    .from('trial_signups')
    .insert({ email: input.correo, ip: input.ip, firm_id: input.firmId, modo: 'PRUEBA' })
    .select('id')
    .single();
  if (rastroError || !rastro) {
    console.error('[TRIAL] No se pudo anotar la prueba de la firma:', rastroError?.message);
    throw new AuthError('TRIAL_UNAVAILABLE', MENSAJE_NO_DISPONIBLE, 503);
  }

  const ahora = new Date();
  const venceEl = vencimientoDePrueba(ahora).toISOString();
  const { error: planError } = await client
    .from('firms')
    .update({
      plan: PLAN_DE_PRUEBA,
      plan_period: 'PRUEBA',
      plan_valid_until: venceEl,
      plan_max_users: Math.min(USUARIOS_DE_PRUEBA, PLANES[PLAN_DE_PRUEBA].maxUsuarios),
      updated_at: ahora.toISOString()
    })
    .eq('firm_id', input.firmId);

  if (planError) {
    console.error('[TRIAL] No se pudo poner la firma en prueba:', planError.message);
    const { error: borrado } = await client.from('trial_signups').delete().eq('id', (rastro as { id: string }).id);
    if (borrado) console.error('[TRIAL] Y el rastro de la prueba fallida no se pudo borrar:', borrado.message);
    throw new AuthError('TRIAL_FAILED', 'No se pudo activar la prueba gratuita. Intente de nuevo.', 500);
  }

  await auditService.record({
    firmId: input.firmId,
    userEmail: input.correo,
    action: 'TRIAL_STARTED',
    resource: `Prueba gratuita de ${PLANES[PLAN_DE_PRUEBA].nombre} · ${DIAS_DE_PRUEBA_GRATUITA} días · vence ${venceEl} · desde «Plan de la firma»`,
    ipAddress: input.ip
  });

  return planDeFirma(input.firmId);
};
