/**
 * Precedent analytics types.
 *
 * Describe the outcome forecast shown for a case: how comparable claims were
 * decided, what drove denials, and which rulings support each side.
 */

export interface FactoresRiesgo {
  riesgo: string;
  explicacion: string;
  impacto: 'ALTO' | 'MEDIO' | 'BAJO';
}

export interface RequisitosConcesion {
  requisito: string;
  cumplidoEnExpediente: boolean;
  recomendacion: string;
}

export interface PrecedenteJudicial {
  sentencia: string;
  ponente: string;
  ano: number;
  fundamentoClave?: string;
  causalDenegacion?: string;
}

export type PronosticoFallo =
  | 'ALTA_PROBABILIDAD_CONCESION'
  | 'RIESGO_MEDIO_DENEGACION'
  | 'ALTO_RIESGO_DENEGACION';

export interface CaseProvidenciaEvaluationData {
  expedienteId: string;
  documentType: string;
  circunstanciaEstudio: string;
  pronosticoFallo: PronosticoFallo;
  tasaConcedidosPct: number;
  tasaNegadosPct: number;
  corporacionPrincipal: string;
  factoresRiesgoDenegacion: FactoresRiesgo[];
  requisitosClaveParaConcesion: RequisitosConcesion[];
  topPrecedentesConcedidos: PrecedenteJudicial[];
  topPrecedentesNegados: PrecedenteJudicial[];
}
