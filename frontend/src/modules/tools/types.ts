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

export interface ParametrosHerramientas {
  smlmv: SmlmvAnual[];
  /** null when no monthly certification could be verified on the official page. */
  ibc: IbcVerificado | null;
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
  desde: string;
  hasta: string;
  modo: ModoInteres;
  /** IBC certified for the period, % E.A. Required for COMERCIAL and to check usury in PACTADA. */
  ibcEA?: number;
  /** % E.A. Required for PACTADA. */
  tasaPactadaEA?: number;
}

export interface InteresesResult {
  capital: number;
  desde: string;
  hasta: string;
  dias: number;
  modo: ModoInteres;
  tasaAnualEA: number;
  tasaDiaria: number;
  interes: number;
  total: number;
  topeUsuraEA: number | null;
  excedeUsura: boolean;
  formula: string;
  supuestos: string[];
  advertencias: string[];
  fuentes: Fuente[];
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
