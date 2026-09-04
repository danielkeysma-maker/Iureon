import { supabase } from '../../config/supabase.config';
import {
  cabeOtroUsuario,
  diasRestantes,
  estadoDelPlan,
  esPeriodo,
  esPlan,
  modulosPermitidos,
  permiteModulo,
  planBloquea,
  type EstadoDelPlan,
  type Modulo,
  type Plan,
  type PlanPeriod,
  type PlanRow
} from './plan.catalog';

/**
 * The firm's plan, read from the database, and the three guards built on it.
 *
 * WHAT THIS REPLACES. The old `subscription.service.ts` returned a hardcoded
 * "Torres & Asociados" with invented token quotas and four invented lawyers to
 * every firm that asked. That was the same defect as the fabricated audit
 * trail: a screen that tells a story instead of reporting a record.
 *
 * WHY THE GUARDS FAIL OPEN BEFORE THE MIGRATION. `firms.plan` and its siblings
 * arrive with `migration-suscripciones.sql`. Until it runs, the select below
 * errors with "column does not exist"; treating that as VENCIDO would lock
 * every firm out of every paid operation the moment the backend deploys. So an
 * unreadable plan is read as legacy CORTESÍA — exactly what every firm is
 * after the migration anyway — and the log says which migration is missing.
 *
 * WHY EXPIRY IS COMPUTED AND NEVER STORED. There is no `activo` column and no
 * scheduled job flipping it: `plan_valid_until` is compared with the clock on
 * every read. A cron that marks plans expired fails toward the dangerous side
 * — if it does not run, expired firms keep working and nobody notices.
 */

export class PlanError extends Error {
  readonly code: 'PLAN_VENCIDO' | 'PLAN_INSUFICIENTE' | 'LIMITE_DE_USUARIOS' | 'PLAN_UNAVAILABLE';
  readonly status: number;

  constructor(code: PlanError['code'], message: string, status: number) {
    super(message);
    this.name = 'PlanError';
    this.code = code;
    this.status = status;
  }
}

export interface PlanDeFirma {
  plan: Plan | null;
  period: PlanPeriod | null;
  validUntil: string | null;
  maxUsers: number | null;
  estado: EstadoDelPlan;
  /** Negative once expired; null when there is no expiry. */
  diasRestantes: number | null;
  /** Accounts the firm has today. */
  usuarios: number;
  modulosPermitidos: readonly Modulo[];
}

const requireDb = () => {
  if (!supabase) {
    throw new PlanError('PLAN_UNAVAILABLE', 'La base de datos no está configurada.', 503);
  }
  return supabase;
};

const CORTESIA_LEGACY: PlanRow = { plan: null, period: null, validUntil: null, maxUsers: null };

let migracionAvisada = false;

const avisarMigracion = (detalle: string): void => {
  if (migracionAvisada) return;
  migracionAvisada = true;
  console.error(
    '[PLAN] No se pudo leer el plan de la firma; se trata como CORTESÍA. ' +
      `Falta correr supabase/migration-suscripciones.sql. Detalle: ${detalle}`
  );
};

/**
 * The plan row, cheap enough to read on every paid operation.
 *
 * Exported for `firmProfile` and the guards. Does not count users: that is a
 * listing of every account on the platform and belongs only where the number
 * is shown.
 */
export const leerPlan = async (firmId: string): Promise<PlanRow> => {
  const db = requireDb();

  const { data, error } = await db
    .from('firms')
    .select('plan, plan_period, plan_valid_until, plan_max_users')
    .eq('firm_id', firmId)
    .maybeSingle();

  if (error) {
    avisarMigracion(error.message);
    return CORTESIA_LEGACY;
  }

  if (!data) return CORTESIA_LEGACY;

  const fila = data as Record<string, unknown>;

  return {
    plan: esPlan(fila.plan) ? fila.plan : null,
    period: esPeriodo(fila.plan_period) ? fila.plan_period : null,
    validUntil: typeof fila.plan_valid_until === 'string' ? new Date(fila.plan_valid_until) : null,
    maxUsers: typeof fila.plan_max_users === 'number' ? fila.plan_max_users : null
  };
};

/**
 * How many accounts belong to the firm. GoTrue has no server-side filter on
 * app_metadata, so the accounts are read whole and narrowed here — the same
 * way `listFirmUsers` does it.
 */
export const contarUsuarios = async (firmId: string): Promise<number> => {
  const db = requireDb();
  const { data, error } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw new PlanError('PLAN_UNAVAILABLE', 'No se pudieron contar los usuarios.', 502);

  return (data?.users ?? []).filter(
    (u) => (u.app_metadata as Record<string, unknown>)?.firm_id === firmId
  ).length;
};

export const describirPlan = (row: PlanRow, usuarios: number, ahora = new Date()): PlanDeFirma => ({
  plan: row.plan,
  period: row.period,
  validUntil: row.validUntil ? row.validUntil.toISOString() : null,
  maxUsers: row.maxUsers,
  estado: estadoDelPlan(row, ahora),
  diasRestantes: diasRestantes(row.validUntil, ahora),
  usuarios,
  modulosPermitidos: modulosPermitidos(row.plan)
});

/** The plan as the firm's own screen and the operator's ficha show it. */
export const planDeFirma = async (firmId: string): Promise<PlanDeFirma> => {
  const [row, usuarios] = await Promise.all([leerPlan(firmId), contarUsuarios(firmId)]);
  return describirPlan(row, usuarios);
};

const fechaLarga = (fecha: Date): string =>
  fecha.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });

const mensajeVencido = (row: PlanRow): string =>
  `El plan de la firma venció${row.validUntil ? ` el ${fechaLarga(row.validUntil)}` : ''}. ` +
  'Puede seguir leyendo y exportando; para volver a generar, revisar o transcribir, ' +
  'un administrador debe pagar el plan desde «Plan de la firma».';

/**
 * Refuses when the plan has expired. Reading and exporting never pass through
 * here — only what costs the platform money or creates new work.
 */
export const exigirPlanVigente = async (firmId: string): Promise<void> => {
  const row = await leerPlan(firmId);
  if (planBloquea(row, new Date())) {
    throw new PlanError('PLAN_VENCIDO', mensajeVencido(row), 402);
  }
};

const NOMBRE_DE_MODULO: Record<Modulo, string> = {
  REDACCION: 'Redacción',
  BORRADORES: 'Borradores',
  REVISIONES: 'Revisiones',
  BUSCADOR: 'Buscador',
  CATALOGO: 'Catálogo',
  HERRAMIENTAS: 'Herramientas',
  MANUAL: 'Manual',
  SOPORTE: 'Soporte',
  MEMBRETE: 'Membrete',
  AUDIENCIAS: 'Audiencias',
  ENTREVISTAS: 'Entrevistas',
  ORIENTACION: 'Orientación'
};

/**
 * Refuses when the module is not in the plan, or the plan has expired.
 *
 * Both answer 403 and not 402: the screen hides the module for ESENCIAL, so a
 * request that reaches here came from outside the page, and the honest answer
 * is "not allowed", with the upgrade path in the message.
 */
export const exigirModulo = async (firmId: string, modulo: Modulo): Promise<void> => {
  const row = await leerPlan(firmId);
  const ahora = new Date();

  if (planBloquea(row, ahora)) {
    throw new PlanError('PLAN_VENCIDO', mensajeVencido(row), 403);
  }

  if (!permiteModulo(row.plan, modulo)) {
    throw new PlanError(
      'PLAN_INSUFICIENTE',
      `${NOMBRE_DE_MODULO[modulo]} no está incluido en el plan Esencial. ` +
        'Para usarlo, pase la firma a Premium desde «Plan de la firma».',
      403
    );
  }
};

/**
 * Refuses one more account when the plan's cap is full.
 *
 * Counts the firm's accounts at the moment of asking: an ESENCIAL firm with
 * its one user gets 409 and the message says what to do. The platform's own
 * firm is exempt — the caller knows the actor's role and skips this.
 */
export const exigirCupoDeUsuario = async (firmId: string): Promise<void> => {
  const [row, usuarios] = await Promise.all([leerPlan(firmId), contarUsuarios(firmId)]);

  if (!cabeOtroUsuario(row.maxUsers, usuarios)) {
    throw new PlanError(
      'LIMITE_DE_USUARIOS',
      `El plan ${row.plan === 'PREMIUM' ? 'Premium' : 'Esencial'} admite hasta ${row.maxUsers} ` +
        `${row.maxUsers === 1 ? 'usuario' : 'usuarios'} y la firma ya tiene ${usuarios}. ` +
        (row.plan === 'PREMIUM'
          ? 'Escríbanos a soporte si necesita más cuentas.'
          : 'Pase a Premium para tener hasta 5 cuentas.'),
      409
    );
  }
};

/**
 * Writes a PlanError to the response. Returns false for anything else so the
 * caller's own error handling continues.
 */
export const responderPlanError = (
  res: { status: (code: number) => { json: (body: unknown) => unknown } },
  err: unknown
): boolean => {
  if (!(err instanceof PlanError)) return false;
  res.status(err.status).json({ success: false, error: err.code, message: err.message });
  return true;
};
