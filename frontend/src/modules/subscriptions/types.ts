/**
 * The firm's plan, as the server describes it.
 *
 * Mirrors `backend/src/modules/subscriptions/plan.catalog.ts`. Nothing here is
 * computed in the browser: prices, states and days come from the API, and the
 * screen only lays them out.
 */

export type Plan = 'ESENCIAL' | 'PREMIUM' | 'FIRMA';

/** MENSUAL and ANUAL are bought; PRUEBA and CORTESIA are granted by the operator. */
export type PlanPeriod = 'MENSUAL' | 'ANUAL' | 'PRUEBA' | 'CORTESIA';

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

/**
 * The sub-services the operator can switch off inside a module that stays on.
 * Ids mirror `FUNCIONES` in `backend/src/modules/subscriptions/plan.catalog.ts`;
 * the names and descriptions stay on the server (the operator console reads
 * them from the firm's ficha) — the screen only needs the id to hide a door.
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

/** The one sentence every closed function shows; the server's 403 says the same, naming the function. */
export const AVISO_FUNCION_DESHABILITADA = 'Esta función no está habilitada para su firma. Escríbanos por Soporte para activarla.';

export type EstadoDelPlan = 'ACTIVO' | 'POR_VENCER' | 'VENCIDO' | 'CORTESIA' | 'PRUEBA';

export interface PlanDeFirma {
  /** `null` = cortesía legacy: no plan assigned, no restriction. */
  plan: Plan | null;
  period: PlanPeriod | null;
  validUntil: string | null;
  maxUsers: number | null;
  estado: EstadoDelPlan;
  /** Negative once expired; null when there is no expiry. */
  diasRestantes: number | null;
  usuarios: number;
  /** In the plan AND not switched off for this firm by the operator. */
  modulosPermitidos: readonly Modulo[];
  /**
   * What the operator switched off for THIS firm above its plan. Kept apart
   * so a closed door can say «no disponible para su firma» instead of «no
   * incluido en su plan»: buying a bigger plan would not reopen it.
   */
  modulosDesactivados: readonly Modulo[];
  /**
   * The sub-services the operator switched off inside modules that stay on.
   * Only what was stored: a function whose module is off is not repeated here,
   * the screen derives it from `modulosPermitidos`.
   */
  funcionesDesactivadas: readonly Funcion[];
  /**
   * Whether THIS session may open the 7-day trial of Esencial from the plan
   * screen: the firm never paid nor tried, has one seat, and the person has
   * not used a trial anywhere. Decided by the server on every read.
   */
  pruebaDisponible: boolean;
}

export interface PlanDefinition {
  plan: Plan;
  nombre: string;
  precioMensualCop: number;
  precioAnualCop: number;
  maxUsuarios: number;
  modulos: readonly Modulo[];
}

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

/** The Spanish name of each module, for the plan cards. */
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
  AUDIENCIAS: 'Audiencias',
  ENTREVISTAS: 'Entrevistas',
  ORIENTACION: 'Orientación'
};

/** El nombre que ve el usuario. Un mapa y no un ternario: al llegar un plan nuevo, se añade una línea. */
export const NOMBRE_DE_PLAN: Record<Plan, string> = { ESENCIAL: 'Esencial', PREMIUM: 'Premium', FIRMA: 'Firma' };

export const ETIQUETA_DE_PERIODO: Record<PlanPeriod, string> = {
  MENSUAL: 'Mensual',
  ANUAL: 'Anual',
  PRUEBA: 'Prueba',
  CORTESIA: 'Cortesía'
};

export const ETIQUETA_DE_ESTADO: Record<EstadoDelPlan, string> = {
  ACTIVO: 'Activo',
  POR_VENCER: 'Por vencer',
  VENCIDO: 'Vencido',
  CORTESIA: 'Cortesía',
  PRUEBA: 'Prueba'
};
