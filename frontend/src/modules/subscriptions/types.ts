/**
 * The firm's plan, as the server describes it.
 *
 * Mirrors `backend/src/modules/subscriptions/plan.catalog.ts`. Nothing here is
 * computed in the browser: prices, states and days come from the API, and the
 * screen only lays them out.
 */

export type Plan = 'ESENCIAL' | 'PREMIUM';

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
  modulosPermitidos: readonly Modulo[];
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
