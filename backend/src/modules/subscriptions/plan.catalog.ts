/**
 * The plan catalogue and the arithmetic of a subscription, with no I/O.
 *
 * Kept free of imports on purpose: `plan.check.ts` proves these rules without a
 * database, and `billing.service` reads them on every paid operation. Anything
 * that talks to Supabase lives in `plan.service.ts`.
 *
 * PRICES INCLUDE IVA AND THE UI NEVER SHOWS THE TAX SEPARATELY — the number a
 * partner reads is the number the card is charged.
 */

export type Plan = 'ESENCIAL' | 'PREMIUM' | 'FIRMA';

/**
 * MENSUAL and ANUAL are bought. PRUEBA is what a firm the operator onboards
 * starts with (14 days). CORTESIA has no expiry and no module restriction: it
 * is the state every firm that existed before the migration is in, so nobody
 * lost service the morning it ran.
 */
export type PlanPeriod = 'MENSUAL' | 'ANUAL' | 'PRUEBA' | 'CORTESIA';

/** The periods a firm can actually pay for. */
export type PaidPeriod = 'MENSUAL' | 'ANUAL';

export type Modulo =
  | 'REDACCION'
  | 'BORRADORES'
  | 'REVISIONES'
  | 'BUSCADOR'
  | 'CATALOGO'
  | 'HERRAMIENTAS'
  | 'MANUAL'
  | 'SOPORTE'
  | 'MEMBRETE'
  | 'AUDIENCIAS'
  | 'ENTREVISTAS'
  | 'ORIENTACION';

export interface PlanDefinition {
  plan: Plan;
  nombre: string;
  precioMensualCop: number;
  precioAnualCop: number;
  maxUsuarios: number;
  modulos: readonly Modulo[];
}

const MODULOS_ESENCIAL: readonly Modulo[] = [
  'REDACCION',
  'BORRADORES',
  'REVISIONES',
  'BUSCADOR',
  'CATALOGO',
  'HERRAMIENTAS',
  'MANUAL',
  'SOPORTE',
  'MEMBRETE'
];

export const TODOS_LOS_MODULOS: readonly Modulo[] = [
  ...MODULOS_ESENCIAL,
  'AUDIENCIAS',
  'ENTREVISTAS',
  'ORIENTACION'
];

/**
 * The annual price is TEN months, not twelve: that is the whole incentive, and
 * it is stated here as a number rather than derived, so a price change is one
 * edit and the check catches a ratio that drifts.
 */
export const PLANES: Record<Plan, PlanDefinition> = {
  ESENCIAL: {
    plan: 'ESENCIAL',
    nombre: 'Esencial',
    precioMensualCop: 85_000,
    precioAnualCop: 850_000,
    maxUsuarios: 1,
    modulos: MODULOS_ESENCIAL
  },
  PREMIUM: {
    plan: 'PREMIUM',
    nombre: 'Premium',
    precioMensualCop: 120_000,
    precioAnualCop: 1_200_000,
    maxUsuarios: 5,
    modulos: TODOS_LOS_MODULOS
  },
  // FIRMA opens nothing PREMIUM does not: it is Premium with three times the
  // seats, for the office that outgrew five accounts. Same 12-for-10 rule.
  FIRMA: {
    plan: 'FIRMA',
    nombre: 'Firma',
    precioMensualCop: 250_000,
    precioAnualCop: 2_500_000,
    maxUsuarios: 15,
    modulos: TODOS_LOS_MODULOS
  }
};

export const esPlan = (valor: unknown): valor is Plan =>
  valor === 'ESENCIAL' || valor === 'PREMIUM' || valor === 'FIRMA';

export const esPeriodoPagable = (valor: unknown): valor is PaidPeriod =>
  valor === 'MENSUAL' || valor === 'ANUAL';

export const esPeriodo = (valor: unknown): valor is PlanPeriod =>
  esPeriodoPagable(valor) || valor === 'PRUEBA' || valor === 'CORTESIA';

export const precioDe = (plan: Plan, period: PaidPeriod): number =>
  period === 'ANUAL' ? PLANES[plan].precioAnualCop : PLANES[plan].precioMensualCop;

/** Days a new firm gets before it has to pay. */
export const DIAS_DE_PRUEBA = 14;

/** Days before expiry at which the app starts warning the partners. */
export const DIAS_DE_AVISO = 7;

/**
 * A NULL plan means "no restriction", never "no modules": a firm from before
 * the migration, or one the operator left as CORTESIA, sees everything.
 */
export const modulosPermitidos = (plan: Plan | null): readonly Modulo[] =>
  plan ? PLANES[plan].modulos : TODOS_LOS_MODULOS;

export const permiteModulo = (plan: Plan | null, modulo: Modulo): boolean =>
  modulosPermitidos(plan).includes(modulo);

export const esModulo = (valor: unknown): valor is Modulo =>
  typeof valor === 'string' && (TODOS_LOS_MODULOS as readonly string[]).includes(valor);

/**
 * SUB-SERVICES THE OPERATOR CAN SWITCH OFF INSIDE A MODULE THAT STAYS ON.
 *
 * Ids are `<MODULO>.<FUNCION>`, and only what exists today is listed: every
 * entry names a real endpoint or a real screen action, and the same id gates
 * both — the controller refuses with FUNCION_DESHABILITADA and the screen
 * hides the entry point. A function whose parent module is off is off too;
 * nothing needs storing twice.
 */
export type Funcion =
  | 'REDACCION.ADJUNTOS'
  | 'REDACCION.TALLER_BORRADOR'
  | 'REVISIONES.CHAT_GUIA'
  | 'REVISIONES.REREVISAR'
  | 'REVISIONES.PREGUNTAS_AUDIENCIA'
  | 'AUDIENCIAS.RESUMEN'
  | 'ENTREVISTAS.RESUMEN'
  | 'ENTREVISTAS.GUION';

export interface FuncionDefinition {
  id: Funcion;
  modulo: Modulo;
  /** As the screen names it: the audit line and the refusal use this word. */
  nombre: string;
  descripcion: string;
}

export const FUNCIONES: ReadonlyArray<FuncionDefinition> = [
  {
    id: 'REDACCION.ADJUNTOS',
    modulo: 'REDACCION',
    nombre: 'Adjuntos en Redacción',
    descripcion: 'Adjuntar sentencias, pruebas o fotos para que el escrito los lea.'
  },
  {
    id: 'REDACCION.TALLER_BORRADOR',
    modulo: 'REDACCION',
    nombre: 'Taller del borrador',
    descripcion: 'Resaltar, comentar y conversar con la guía sobre un borrador generado.'
  },
  {
    id: 'REVISIONES.CHAT_GUIA',
    modulo: 'REVISIONES',
    nombre: 'Conversación con la guía',
    descripcion: 'Preguntar y pedir cambios a la guía dentro del taller de una revisión.'
  },
  {
    id: 'REVISIONES.REREVISAR',
    modulo: 'REVISIONES',
    nombre: 'Volver a revisar',
    descripcion: 'Pedir un informe nuevo sobre el texto corregido en el taller.'
  },
  {
    id: 'REVISIONES.PREGUNTAS_AUDIENCIA',
    modulo: 'REVISIONES',
    nombre: 'Preguntas para la audiencia',
    descripcion: 'Tres listas de preguntas a partir del escrito revisado.'
  },
  {
    id: 'AUDIENCIAS.RESUMEN',
    modulo: 'AUDIENCIAS',
    nombre: 'Resumen y hechos relevantes de la audiencia',
    descripcion: 'El resumen con hechos anclados al minuto, generado desde el transcrito.'
  },
  {
    id: 'ENTREVISTAS.RESUMEN',
    modulo: 'ENTREVISTAS',
    nombre: 'Resumen y hechos relevantes de la entrevista',
    descripcion: 'El resumen con hechos anclados al minuto, generado desde el transcrito.'
  },
  {
    id: 'ENTREVISTAS.GUION',
    modulo: 'ENTREVISTAS',
    nombre: 'Lo que no puede quedarse sin preguntar',
    descripcion: 'La lista de comprobación que marca qué quedó dicho en la entrevista.'
  }
];

export const TODAS_LAS_FUNCIONES: readonly Funcion[] = FUNCIONES.map((f) => f.id);

export const esFuncion = (valor: unknown): valor is Funcion =>
  typeof valor === 'string' && (TODAS_LAS_FUNCIONES as readonly string[]).includes(valor);

export const definicionDeFuncion = (funcion: Funcion): FuncionDefinition =>
  FUNCIONES.find((f) => f.id === funcion) as FuncionDefinition;

export const moduloDeFuncion = (funcion: Funcion): Modulo => definicionDeFuncion(funcion).modulo;

export const funcionesDeModulo = (modulo: Modulo): readonly FuncionDefinition[] =>
  FUNCIONES.filter((f) => f.modulo === modulo);

/** What `firms.modulos_desactivados` may hold: a module id or a function id. */
export type Desactivable = Modulo | Funcion;

/** Catalogue order: modules first, then functions — the order the audit line reads in. */
export const TODO_LO_DESACTIVABLE: readonly Desactivable[] = [...TODOS_LOS_MODULOS, ...TODAS_LAS_FUNCIONES];

export const esDesactivable = (valor: unknown): valor is Desactivable => esModulo(valor) || esFuncion(valor);

/**
 * THE PLAN IS THE BASELINE; THE OPERATOR SUBTRACTS FROM IT PER FIRM.
 *
 * `firms.modulos_desactivados` holds what operation took away from one firm
 * — «Audiencias off until they pay» — without touching the plan. Only a
 * subtraction is stored, never the full list: a plan change (a payment, a
 * courtesy) must keep ruling what is included, and the override must survive
 * it. Re-enabling is removing the id from the list, which restores exactly
 * what the plan gives.
 */
export const modulosDisponibles = (
  plan: Plan | null,
  desactivados: readonly Desactivable[]
): readonly Modulo[] => modulosPermitidos(plan).filter((m) => !desactivados.includes(m));

/**
 * Validates the operator's list: module ids and function ids alike. Returns
 * the bad id so the 400 can name it: «INVALID_MODULE» without the offending
 * value sends the operator guessing. Duplicates collapse; order follows the
 * catalogue so the audit line reads the same whatever order the screen sent.
 */
export const validarModulosDesactivados = (
  valores: unknown
): { ok: true; modulos: Desactivable[] } | { ok: false; invalido: string } => {
  if (!Array.isArray(valores)) return { ok: false, invalido: String(valores) };
  for (const v of valores) {
    if (!esDesactivable(v)) return { ok: false, invalido: String(v) };
  }
  const pedidos = new Set(valores as Desactivable[]);
  return { ok: true, modulos: TODO_LO_DESACTIVABLE.filter((m) => pedidos.has(m)) };
};

/** The module ids of a mixed list, in catalogue order. */
export const soloModulos = (desactivados: readonly Desactivable[]): Modulo[] =>
  TODOS_LOS_MODULOS.filter((m) => desactivados.includes(m));

/** The function ids of a mixed list, in catalogue order. */
export const soloFunciones = (desactivados: readonly Desactivable[]): Funcion[] =>
  TODAS_LAS_FUNCIONES.filter((f) => desactivados.includes(f));

/** What the firms table holds, as read. */
export interface PlanRow {
  plan: Plan | null;
  period: PlanPeriod | null;
  validUntil: Date | null;
  maxUsers: number | null;
  /**
   * The operator's per-firm subtraction: module ids and function ids in one
   * list, as the column holds them. Empty when the column is missing.
   */
  modulosDesactivados: readonly Desactivable[];
}

/** Whether THIS firm may use the module: in the plan and not subtracted. */
export const moduloDisponible = (row: PlanRow, modulo: Modulo): boolean =>
  modulosDisponibles(row.plan, row.modulosDesactivados).includes(modulo);

/**
 * Whether THIS firm may use the function: its module is available AND the
 * function itself was not subtracted. A module switched off takes every
 * function with it, whether or not the function id is also in the list.
 */
export const funcionDisponible = (row: PlanRow, funcion: Funcion): boolean =>
  moduloDisponible(row, moduloDeFuncion(funcion)) && !row.modulosDesactivados.includes(funcion);

/**
 * Why a function is closed to this firm, or null when it is open. The pure
 * half of `exigirFuncion`: the guard maps each reason to its status and
 * message, and the check proves the reasons without a database.
 *
 * Order matters: an expired plan is said first (nothing works), then the
 * module (the remedy is the plan or Soporte for the whole module), and only
 * then the function itself.
 */
export type CierreDeFuncion = 'PLAN_VENCIDO' | 'MODULO_NO_EN_PLAN' | 'MODULO_DESACTIVADO' | 'FUNCION_DESACTIVADA';

export const cierreDeFuncion = (row: PlanRow, funcion: Funcion, ahora: Date): CierreDeFuncion | null => {
  if (planBloquea(row, ahora)) return 'PLAN_VENCIDO';
  const modulo = moduloDeFuncion(funcion);
  if (!permiteModulo(row.plan, modulo)) return 'MODULO_NO_EN_PLAN';
  if (!moduloDisponible(row, modulo)) return 'MODULO_DESACTIVADO';
  if (row.modulosDesactivados.includes(funcion)) return 'FUNCION_DESACTIVADA';
  return null;
};

/** The refusal for a function the operator switched off for this firm. */
export const mensajeDeFuncionDeshabilitada = (funcion: Funcion): string =>
  `${definicionDeFuncion(funcion).nombre} no está habilitada para su firma. Escríbanos por Soporte para activarla.`;

export type EstadoDelPlan = 'ACTIVO' | 'POR_VENCER' | 'VENCIDO' | 'CORTESIA' | 'PRUEBA';

const MS_POR_DIA = 24 * 60 * 60 * 1000;

/**
 * Days left, rounded UP: a plan that expires in 30 hours has "2 días" left,
 * because telling a partner "1 día" when they still have tomorrow whole is the
 * kind of false alarm that teaches people to ignore the banner. Negative once
 * expired. `null` when there is no expiry.
 */
export const diasRestantes = (validUntil: Date | null, ahora: Date): number | null => {
  if (!validUntil) return null;
  return Math.ceil((validUntil.getTime() - ahora.getTime()) / MS_POR_DIA);
};

/**
 * The state the firm is in, derived at read time and never stored.
 *
 * CORTESIA wins whenever there is no expiry date: a legacy row (plan NULL,
 * validUntil NULL) and an explicit CORTESIA period read the same, and neither
 * ever expires. After that only the date matters — PRUEBA is a label on a
 * period that expires like any other, so a trial in its last week is
 * POR_VENCER, which is exactly when the partner needs to be told.
 */
export const estadoDelPlan = (row: PlanRow, ahora: Date): EstadoDelPlan => {
  if (!row.validUntil) return 'CORTESIA';

  const dias = diasRestantes(row.validUntil, ahora) as number;
  if (dias <= 0) return 'VENCIDO';
  if (dias <= DIAS_DE_AVISO) return 'POR_VENCER';
  if (row.period === 'PRUEBA') return 'PRUEBA';
  return 'ACTIVO';
};

/**
 * Adds calendar months the way Postgres does: the day is clamped to the last
 * day of the target month (31 Jan + 1 month = 28/29 Feb), never rolled over
 * into the month after. The database function is the one that writes the
 * date; this mirrors it so the screen and the check can predict it.
 */
export const sumarMeses = (desde: Date, meses: number): Date => {
  const resultado = new Date(desde.getTime());
  const diaOriginal = resultado.getUTCDate();
  resultado.setUTCDate(1);
  resultado.setUTCMonth(resultado.getUTCMonth() + meses);
  const ultimoDia = new Date(
    Date.UTC(resultado.getUTCFullYear(), resultado.getUTCMonth() + 1, 0)
  ).getUTCDate();
  resultado.setUTCDate(Math.min(diaOriginal, ultimoDia));
  return resultado;
};

/**
 * The period a payment buys.
 *
 * PAYING EARLY EXTENDS, IT NEVER RESTARTS. The new period begins where the
 * current one ends if that is still in the future, and now otherwise — so a
 * firm that renews a week early keeps the week, and a firm that comes back a
 * month after expiring does not pay for the month it did not use.
 *
 * THIS IS THE RENEWAL ARITHMETIC AND IT KNOWS NOTHING ABOUT PLANS. Changing to
 * a DIFFERENT plan does not extend: it is paid in full and its cycle starts on
 * the day of the payment. That decision lives in `cambioDePlan.rules.ts`, which
 * takes both plans and calls this same arithmetic from the date it chooses;
 * callers that must handle a plan change go there, not here.
 */
export const periodoQueCompra = (input: {
  ahora: Date;
  vigenteHasta: Date | null;
  period: PaidPeriod;
}): { validFrom: Date; validUntil: Date } => {
  const validFrom =
    input.vigenteHasta && input.vigenteHasta.getTime() > input.ahora.getTime()
      ? new Date(input.vigenteHasta.getTime())
      : new Date(input.ahora.getTime());

  return {
    validFrom,
    validUntil: sumarMeses(validFrom, input.period === 'ANUAL' ? 12 : 1)
  };
};

/**
 * Whether a firm in this state may still WRITE: create or edit its work.
 *
 * Only VENCIDO is read-only. ACTIVO and POR_VENCER are paid time; PRUEBA is
 * granted time; CORTESIA has no clock at all. A function of the state and not
 * of the row, so the middleware, the checks and the billing reserve apply one
 * rule — a second `=== 'VENCIDO'` elsewhere would drift.
 */
export const esVigente = (estado: EstadoDelPlan): boolean => estado !== 'VENCIDO';

/** Whether paid operations must be refused. Only an expired dated plan blocks. */
export const planBloquea = (row: PlanRow, ahora: Date): boolean =>
  !esVigente(estadoDelPlan(row, ahora));

/**
 * Whether one more account fits. A NULL cap (cortesía) never refuses; the
 * caller decides whether the actor is exempt (the platform's own firm).
 */
export const cabeOtroUsuario = (maxUsers: number | null, usuariosActuales: number): boolean =>
  maxUsers === null || usuariosActuales < maxUsers;

/** The Spanish label a screen or an audit line uses for a period. */
export const etiquetaDePeriodo = (period: PlanPeriod | null): string => {
  switch (period) {
    case 'MENSUAL':
      return 'Mensual';
    case 'ANUAL':
      return 'Anual';
    case 'PRUEBA':
      return 'Prueba';
    default:
      return 'Cortesía';
  }
};
