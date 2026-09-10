import { supabase } from '../../config/supabase.config';
import {
  cabeOtroUsuario,
  cierreDeFuncion,
  diasRestantes,
  estadoDelPlan,
  esPeriodo,
  esDesactivable,
  esPlan,
  mensajeDeFuncionDeshabilitada,
  moduloDeFuncion,
  moduloDisponible,
  modulosDisponibles,
  permiteModulo,
  PLANES,
  planBloquea,
  soloFunciones,
  soloModulos,
  type Desactivable,
  type EstadoDelPlan,
  type Funcion,
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
  readonly code:
    | 'PLAN_VENCIDO'
    | 'PLAN_INSUFICIENTE'
    | 'FUNCION_DESHABILITADA'
    | 'LIMITE_DE_USUARIOS'
    | 'PLAN_UNAVAILABLE';
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
  /** In the plan AND not subtracted by the operator: what this firm can use. */
  modulosPermitidos: readonly Modulo[];
  /**
   * What the operator subtracted from this firm. Sent apart from the list
   * above so a screen can say «desactivado para su firma» instead of «no
   * incluido en el plan» — the second would be false, and would send the
   * partner to buy a plan that changes nothing.
   */
  modulosDesactivados: readonly Modulo[];
  /**
   * The sub-services the operator switched off inside modules that stay on.
   * Only the ids stored: a function whose module is off is not repeated here,
   * the screen derives that from `modulosPermitidos`.
   */
  funcionesDesactivadas: readonly Funcion[];
}

const requireDb = () => {
  if (!supabase) {
    throw new PlanError('PLAN_UNAVAILABLE', 'La base de datos no está configurada.', 503);
  }
  return supabase;
};

const CORTESIA_LEGACY: PlanRow = {
  plan: null,
  period: null,
  validUntil: null,
  maxUsers: null,
  modulosDesactivados: []
};

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
 * `modulos_desactivados` arrives with `migration-modulos-por-firma.sql`, later
 * than the plan columns. Until it runs the select with it fails; retrying
 * without it keeps the plan readable and treats the subtraction as empty —
 * nothing was ever subtracted on a database that cannot hold it. Said once.
 */
export const MIGRACION_MODULOS = 'supabase/migration-modulos-por-firma.sql';
let columnaDeModulosAvisada = false;

const avisarColumnaDeModulos = (detalle: string): void => {
  if (columnaDeModulosAvisada) return;
  columnaDeModulosAvisada = true;
  console.error(
    '[PLAN] La columna firms.modulos_desactivados no existe; se lee como vacía. ' +
      `Falta correr ${MIGRACION_MODULOS}. Detalle: ${detalle}`
  );
};

const COLUMNAS_DE_PLAN = 'plan, plan_period, plan_valid_until, plan_max_users';

/** Only catalogue ids survive: a stale id left in the column cannot hide a module or function that no longer exists. */
const leerModulosDesactivados = (valor: unknown): Desactivable[] =>
  Array.isArray(valor) ? valor.filter(esDesactivable) : [];

/**
 * The plan row, cheap enough to read on every paid operation.
 *
 * Exported for `firmProfile` and the guards. Does not count users: that is a
 * listing of every account on the platform and belongs only where the number
 * is shown.
 */
export const leerPlan = async (firmId: string): Promise<PlanRow> => {
  const db = requireDb();

  const leer = (columnas: string) =>
    db.from('firms').select(columnas).eq('firm_id', firmId).maybeSingle();

  let { data, error } = await leer(`${COLUMNAS_DE_PLAN}, modulos_desactivados`);

  if (error) {
    avisarColumnaDeModulos(error.message);
    ({ data, error } = await leer(COLUMNAS_DE_PLAN));
  }

  if (error) {
    avisarMigracion(error.message);
    return CORTESIA_LEGACY;
  }

  if (!data) return CORTESIA_LEGACY;

  const fila = data as unknown as Record<string, unknown>;

  return {
    plan: esPlan(fila.plan) ? fila.plan : null,
    period: esPeriodo(fila.plan_period) ? fila.plan_period : null,
    validUntil: typeof fila.plan_valid_until === 'string' ? new Date(fila.plan_valid_until) : null,
    maxUsers: typeof fila.plan_max_users === 'number' ? fila.plan_max_users : null,
    modulosDesactivados: leerModulosDesactivados(fila.modulos_desactivados)
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
  modulosPermitidos: modulosDisponibles(row.plan, row.modulosDesactivados),
  modulosDesactivados: soloModulos(row.modulosDesactivados),
  funcionesDesactivadas: soloFunciones(row.modulosDesactivados)
});

/** The plan as the firm's own screen and the operator's ficha show it. */
export const planDeFirma = async (firmId: string): Promise<PlanDeFirma> => {
  const [row, usuarios] = await Promise.all([leerPlan(firmId), contarUsuarios(firmId)]);
  return describirPlan(row, usuarios);
};

const fechaLarga = (fecha: Date): string =>
  fecha.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });

/**
 * The one sentence every refused write carries. Exported so the route guard
 * and the billing reserve say the same thing: two wordings for one state read
 * as two different problems.
 */
export const mensajeDePlanVencido = (validUntil: Date | null): string =>
  `El plan de la firma venció${validUntil ? ` el ${fechaLarga(validUntil)}` : ''}. ` +
  'Puede leer y descargar lo que ya tiene; para seguir trabajando, renueve el plan en «Plan».';

const mensajeVencido = (row: PlanRow): string => mensajeDePlanVencido(row.validUntil);

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

export const NOMBRE_DE_MODULO: Record<Modulo, string> = {
  REDACCION: 'Redacción',
  BORRADORES: 'Borradores',
  REVISIONES: 'Revisiones',
  BUSCADOR: 'Buscador',
  CATALOGO: 'Catálogo',
  HERRAMIENTAS: 'Herramientas',
  MANUAL: 'Manual',
  SOPORTE: 'Soporte',
  MEMBRETE: 'Membrete',
  EXPEDIENTES: 'Expedientes',
  AUDIENCIAS: 'Audiencias',
  ENTREVISTAS: 'Entrevistas',
  ORIENTACION: 'Orientación'
};

/** The refusal for a module the operator switched off for this firm. */
export const mensajeDeModuloDesactivado = (modulo: Modulo): string =>
  `${NOMBRE_DE_MODULO[modulo]} no está habilitado para su firma. Escríbanos por Soporte para activarlo.`;

/**
 * Refuses when the module is not in the plan, was switched off for this firm
 * by the operator, or the plan has expired.
 *
 * All answer 403 and not 402: the screen hides the module, so a request that
 * reaches here came from outside the page, and the honest answer is "not
 * allowed" — with the upgrade path when the plan is the reason, and with
 * Soporte when the operator is: buying Premium would not reopen a module the
 * operator closed, and the message must not suggest it would.
 */
export const exigirModulo = async (firmId: string, modulo: Modulo): Promise<void> => {
  const row = await leerPlan(firmId);
  const ahora = new Date();

  if (planBloquea(row, ahora)) {
    throw new PlanError('PLAN_VENCIDO', mensajeVencido(row), 403);
  }

  if (permiteModulo(row.plan, modulo) && !moduloDisponible(row, modulo)) {
    throw new PlanError('PLAN_INSUFICIENTE', mensajeDeModuloDesactivado(modulo), 403);
  }

  if (!permiteModulo(row.plan, modulo)) {
    throw new PlanError('PLAN_INSUFICIENTE', mensajeDeModuloNoIncluido(modulo), 403);
  }
};

const mensajeDeModuloNoIncluido = (modulo: Modulo): string =>
  `${NOMBRE_DE_MODULO[modulo]} no está incluido en el plan Esencial. ` +
  'Para usarlo, pase la firma a Premium o a Firma desde «Plan de la firma».';

/**
 * Refuses when the sub-service is not available to this firm: the plan
 * expired, its module is not in the plan or was switched off, or the function
 * itself was switched off by the operator. Called at the top of the
 * controller, after auth and before any reservation — nothing to refund.
 *
 * Same 403 logic as `exigirModulo` for the first three reasons, so a function
 * inside a closed module answers exactly what the module would; only the last
 * reason is new, and its message names the function as the screen does.
 */
export const exigirFuncion = async (firmId: string, funcion: Funcion): Promise<void> => {
  const row = await leerPlan(firmId);
  const cierre = cierreDeFuncion(row, funcion, new Date());
  if (!cierre) return;

  switch (cierre) {
    case 'PLAN_VENCIDO':
      throw new PlanError('PLAN_VENCIDO', mensajeVencido(row), 403);
    case 'MODULO_DESACTIVADO':
      throw new PlanError('PLAN_INSUFICIENTE', mensajeDeModuloDesactivado(moduloDeFuncion(funcion)), 403);
    case 'MODULO_NO_EN_PLAN':
      throw new PlanError('PLAN_INSUFICIENTE', mensajeDeModuloNoIncluido(moduloDeFuncion(funcion)), 403);
    case 'FUNCION_DESACTIVADA':
      throw new PlanError('FUNCION_DESHABILITADA', mensajeDeFuncionDeshabilitada(funcion), 403);
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
      `El plan ${row.plan ? PLANES[row.plan].nombre : 'actual'} admite hasta ${row.maxUsers} ` +
        `${row.maxUsers === 1 ? 'usuario' : 'usuarios'} y la firma ya tiene ${usuarios}. ` +
        // The message names the next plan up, not a fixed one: Esencial is sent
        // to Premium, Premium to Firma, and Firma to support.
        (row.plan === 'FIRMA'
          ? 'Escríbanos a soporte si necesita más cuentas.'
          : row.plan === 'PREMIUM'
            ? `Pase a Firma para tener hasta ${PLANES.FIRMA.maxUsuarios} cuentas.`
            : `Pase a Premium para tener hasta ${PLANES.PREMIUM.maxUsuarios} cuentas.`),
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
