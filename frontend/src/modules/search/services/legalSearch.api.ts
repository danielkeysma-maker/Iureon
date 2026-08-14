import { httpClient } from '../../../config/httpClient';

/**
 * Search module HTTP layer.
 *
 * It exists because `SearchView` used to carry seventeen rulings written by
 * hand — with ponente, a citation ready to paste into a brief, and invented
 * `fullText`. One cited "SU-049 de 2022", a providencia that does not exist.
 * The screen now asks the server, and the server only answers with what it can
 * source.
 */

export type CorpusStatus =
  | 'OK'
  | 'EMPTY'
  | 'NOT_SEEDED'
  | 'NO_PROVIDER'
  | 'NO_INDEX'
  | 'FAILED';

export interface CorpusPrecedent {
  id: string;
  contentChunk: string;
  similarity: number;
  branch: string | null;
  providencia: string | null;
  corporacion: string | null;
  magistradoPonente: string | null;
  outcome: string | null;
  sourceUrl: string | null;
  isSharedCorpus: boolean;
}

export interface GlossaryTerm {
  id: string;
  term: string;
  category: string;
  definition: string;
  colombianNormativeRef: string;
  sourceUrl: string;
}

export interface SearchResponse<T> {
  success: boolean;
  status: CorpusStatus;
  items: T[];
  reason?: string;
}

export const searchPrecedents = (
  firmId: string,
  query: string,
  limit = 8,
  signal?: AbortSignal
): Promise<SearchResponse<CorpusPrecedent>> =>
  httpClient.get<SearchResponse<CorpusPrecedent>>(
    `/api/legal/precedents?query=${encodeURIComponent(query)}&limit=${limit}`,
    { firmId, signal }
  );

export const searchGlossary = (
  firmId: string,
  query: string,
  category = 'TODAS',
  signal?: AbortSignal
): Promise<SearchResponse<GlossaryTerm>> =>
  httpClient.get<SearchResponse<GlossaryTerm>>(
    `/api/legal/glossary?query=${encodeURIComponent(query)}&category=${encodeURIComponent(category)}`,
    { firmId, signal }
  );
