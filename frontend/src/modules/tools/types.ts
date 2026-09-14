/**
 * Contract with POST/GET /api/tools/*. The server owns every constant (SMLMV,
 * rates, holidays) and every source; the screen renders what it receives and
 * never carries a figure of its own.
 */

export interface Fuente {
  nombre: string;
  norma: string;
  url: string;
  consultadoEl: string;
}

export interface SmlmvAnual {
  anio: number;
  smlmv: number;
  auxilioTransporte: number;
  decretoSmlmv: string;
  decretoAuxilio: string;
  fuentes: Fuente[];
}

export interface IbcVerificado {
  /** Efectivo anual, in percent (e.g. 18.7). */
  tasaEA: number;
  modalidad: string;
  /** Calendar month it certifies, YYYY-MM. */
  mes: string;
  resolucion: string;
  fuente: Fuente;
}

/** The range of certified periods the server has loaded, and when they were read. */
export interface CertificacionesCargadas {
  modalidad: string;
  desde: string;
  hasta: string;
  consultadoEl: string;
}

export interface ParametrosHerramientas {
  smlmv: SmlmvAnual[];
  /** The latest certification loaded; null when none could be verified on the official page. */
  ibc: IbcVerificado | null;
  /** Absent on a server older than the liquidation by tranches. */
  certificaciones?: CertificacionesCargadas;
  enlaces: { ibc: Fuente; ipc: Fuente };
}

export interface IndexacionRequest {
  valor: number;
  ipcInicial: number;
  ipcFinal: number;
  etiquetaInicial?: string;
  etiquetaFinal?: string;
}

export interface IndexacionResult {
  valor: number;
  ipcInicial: number;
  ipcFinal: number;
  factor: number;
  valorIndexado: number;
  formula: string;
  advertencias: string[];
  fuentes: Fuente[];
}

export type ModoInteres = 'COMERCIAL' | 'CIVIL' | 'PACTADA';

export interface InteresesRequest {
  capital: number;
  /** Exigibility date; it does not count as a day of default. */
  desde: string;
  /** Cut-off date; it counts. */
  hasta: string;
  modo: ModoInteres;
  /** % E.A. Required for PACTADA. The certified rate of each period comes from the server. */
  tasaPactadaEA?: number;
}

export interface TramoDeInteres {
  desde: string;
  hasta: string;
  dias: number;
  diasDelAnio: number;
  /** % E.A. applied to the tranche. */
  tasaEA: number;
  interesBancarioCorrienteEA: number | null;
  usuraEA: number | null;
  excedeUsura: boolean;
  interes: number;
  resolucion: string | null;
  url: string | null;
  nota?: string;
}

export interface InteresesResult {
  capital: number;
  desde: string;
  hasta: string;
  /** Last day liquidated: `hasta`, or the last loaded certification when it ends earlier. */
  corte: string;
  dias: number;
  modo: ModoInteres;
  tasaPactadaEA: number | null;
  tramos: TramoDeInteres[];
  interes: number;
  total: number;
  excedeUsura: boolean;
  formula: string;
  supuestos: string[];
  advertencias: string[];
  fuentes: Fuente[];
  certificadas: CertificacionesCargadas;
}

export type Jurisdiccion = 'CIVIL' | 'LABORAL';

export interface CuantiaRequest {
  pretension: number;
  anio: number;
  jurisdiccion: Jurisdiccion;
}

export interface CuantiaResult {
  pretension: number;
  anio: number;
  jurisdiccion: Jurisdiccion;
  smlmv: number;
  decreto: string;
  enSmlmv: number;
  categoria: string;
  juez: string;
  instancia: string;
  regla: string;
  limites: Array<{ categoria: string; hasta: number | null; hastaPesos: number | null }>;
  advertencias: string[];
  fuentes: Fuente[];
}

export interface Festivo {
  fecha: string;
  nombre: string;
  regla: 'FIJO' | 'TRASLADO_LUNES' | 'PASCUA';
  fechaOriginal?: string;
}

export interface CalendarioAnual {
  anio: number;
  festivos: Festivo[];
  vacancia: { desde: string; hasta: string; descripcion: string };
  semanaSanta: { jueves: string; viernes: string; lunesAMiercoles: string[]; nota: string };
  diasHabilesPorMes: Array<{ mes: number; habiles: number; noHabiles: number }>;
  fuentes: Fuente[];
}
