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

/** What the firms table holds, as read. */
export interface PlanRow {
  plan: Plan | null;
  period: PlanPeriod | null;
  validUntil: Date | null;
  maxUsers: number | null;
}

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
 * month after expiring does not pay for the month it did not use. Changing
 * plan on the same payment follows the same rule: no proration, the new plan
 * simply applies from the payment onward.
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

/** Whether paid operations must be refused. Only an expired dated plan blocks. */
export const planBloquea = (row: PlanRow, ahora: Date): boolean =>
  estadoDelPlan(row, ahora) === 'VENCIDO';

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
