/**
 * Ingestion domain types.
 *
 * These live apart from the pipeline so the court scrapers can describe what
 * they produce without importing the service that consumes it. A scraper
 * depends on this contract, never on the pipeline implementation.
 */

export type Corporacion =
  | 'CORTE_CONSTITUCIONAL'
  | 'CORTE_SUPREMA'
  | 'CONSEJO_ESTADO'
  | 'TRIBUNAL_SUPERIOR'
  | 'TRIBUNAL_ADMINISTRATIVO';

export type TipoSentencia = 'T' | 'C' | 'SU' | 'SL' | 'SC' | 'SP' | 'NULIDAD' | 'AUTO';

export type RamaDerecho =
  | 'CONSTITUCIONAL'
  | 'LABORAL'
  | 'CIVIL'
  | 'ADMINISTRATIVO'
  | 'PENAL'
  | 'FAMILIA';

/** Whether the court granted or denied the claim. */
export type ResuelveOutcome = 'CONCEDIDO' | 'NEGADO';

export interface IngestionRulingMetadata {
  corporacion: Corporacion;
  numeroProvidencia: string; // ej: Sentencia T-025 de 2004, SL-4102-2023, CE-SU2-2022
  tipoSentencia: TipoSentencia;
  rama: RamaDerecho;
  magistradoPonente: string;
  ano: number;
  hechosClave: string;
  ratioDecidendi: string;
  resuelveOutcome: ResuelveOutcome;
  pdfUrl?: string;
  fullText: string;
}

export interface IngestionRequest {
  firmId: string;
  title: string;
  b2FileUrl: string;
  rawText?: string;
  metadata?: Record<string, any>;
}

export interface IngestionResult {
  documentId: string;
  firmId: string;
  title: string;
  b2FileUrl: string;
  totalChunksCreated: number;
  totalFoliosIndexed: number;
  status: 'COMPLETED' | 'FAILED';
  ingestedAt: string;
}
