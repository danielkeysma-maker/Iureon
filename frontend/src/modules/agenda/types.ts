/**
 * La agenda de términos de la firma, del lado del navegador.
 *
 * Los nombres son los mismos que responde el backend: una traducción a medio
 * camino entre las dos capas es donde se pierde un campo sin que nada falle.
 */

export type OrigenDeLaFecha = 'CALCULADA' | 'MANUAL';
export type TipoDeDias = 'HABILES' | 'CALENDARIO';
export type EstadoDeEntrada = 'PENDIENTE' | 'CUMPLIDA' | 'ARCHIVADA';
export type HitoDeAviso = 5 | 2 | 0;

export interface EntradaDeAgenda {
  id: string;
  firmId: string;
  asunto: string;
  radicado: string | null;
  cliente: string | null;
  actuacionId: string | null;
  actuacionNombre: string;
  rama: string | null;
  fechaNotificacion: string;
  fechaLimite: string;
  diasTermino: number | null;
  tipoDias: TipoDeDias | null;
  /** El plazo lo comprobó el catálogo, no un colega. */
  terminoVerificado: boolean;
  origenFecha: OrigenDeLaFecha;
  terminoEvidencia: string | null;
  responsable: string | null;
  estado: EstadoDeEntrada;
  cumplidaEl: string | null;
  notas: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  avisosEnviados: HitoDeAviso[];
}

/** Lo que el catálogo sabe del plazo de una actuación, y si se deja leer. */
export interface PlazoDeActuacion {
  lectura:
    | { legible: true; plazo: { dias: number; tipo: TipoDeDias; evidencia: string } }
    | { legible: false; motivo: string };
  actuacionNombre: string | null;
  rama: string | null;
  /** El término tal como lo escribe la ficha, para que el abogado lo lea él mismo. */
  terminoLiteral: string | null;
  legalBasis: string | null;
  curadaPorLaFirma: boolean;
}

export interface FuenteDeLaCuenta {
  nombre: string;
  norma: string;
  url: string;
  consultadoEl: string;
}

export interface VencimientoPrevisto {
  fechaLimite: string;
  fuentes: FuenteDeLaCuenta[];
  /** Qué días se descontaron y por qué. Vacío en días de calendario. */
  excluidos: Array<{ fecha: string; motivo: string }>;
}

export interface EntradaNueva {
  asunto: string;
  radicado?: string | null;
  cliente?: string | null;
  actuacionId?: string | null;
  actuacionNombre?: string | null;
  rama?: string | null;
  fechaNotificacion: string;
  diasTermino?: number | null;
  tipoDias?: TipoDeDias | null;
  fechaLimiteManual?: string | null;
  responsable?: string | null;
  notas?: string | null;
}
