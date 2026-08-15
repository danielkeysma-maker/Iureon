/**
 * Ingestion domain types.
 *
 * These live apart from the pipeline so a corpus source can describe what it
 * produces without importing the service that consumes it. The four "court
 * scrapers" that used to depend on this contract were deleted on 2026-08-14:
 * they regex-scraped ruling numbers out of relatoría HTML and attached
 * invented hechos, an invented ratio and an outcome hardcoded to CONCEDIDO.
 * The corpus is now seeded from `research/jurisprudencia.json`, whose entries
 * were each opened and read before being written down.
 */

export type Corporacion =
  | 'CORTE_CONSTITUCIONAL'
  | 'CORTE_SUPREMA'
  | 'CONSEJO_ESTADO'
  | 'TRIBUNAL_SUPERIOR'
  | 'TRIBUNAL_ADMINISTRATIVO';

export type TipoSentencia =
  // Corte Constitucional
  | 'T' | 'C' | 'SU'
  // Corte Suprema — casación por sala
  | 'SL' | 'SC' | 'SP'
  // Consejo de Estado — the medio de control decides the rules that apply, so
  // it is not one type. Calling a reparación directa "NULIDAD" would misfile
  // the caducidad that governs it.
  | 'NULIDAD' | 'REPARACION_DIRECTA' | 'CONTRACTUAL' | 'NULIDAD_ELECTORAL'
  | 'PERDIDA_INVESTIDURA' | 'UNIFICACION'
  | 'AUTO';

export type RamaDerecho =
  | 'CONSTITUCIONAL'
  | 'LABORAL'
  | 'CIVIL'
  | 'ADMINISTRATIVO'
  | 'PENAL'
  | 'FAMILIA'
  | 'TRIBUTARIO'
  | 'SOCIETARIO';

/**
 * What the court actually did.
 *
 * `PARCIAL` is not a convenience: "casa parcialmente" is the most common
 * outcome in casación, and forcing it into CONCEDIDO or NEGADO would tell the
 * lawyer the opposite of what happened in roughly a third of the corpus. The
 * type carried only two values until 2026-08-14, which is why the deleted
 * scrapers could hardcode CONCEDIDO and still typecheck.
 */
export type ResuelveOutcome = 'CONCEDIDO' | 'NEGADO' | 'PARCIAL';

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
  /**
   * NOT_INDEXED is distinct from FAILED on purpose: the document was stored but
   * is NOT searchable, either because no embeddings provider is configured or
   * because indexing failed. Reporting it as COMPLETED would promise a search
   * that cannot find it.
   */
  status: 'COMPLETED' | 'NOT_INDEXED' | 'FAILED';
  ingestedAt: string;
}
