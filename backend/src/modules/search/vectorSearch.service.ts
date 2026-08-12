import { supabase } from '../../config/supabase.config';
import { embeddingsService } from '../embeddings/embeddings.service';

/**
 * Semantic search over the firm's documents and the shared law corpus.
 *
 * The RPC this calls — `match_document_chunks_multi_tenant` — has existed in
 * the schema since the beginning and nothing invoked it: the search screens
 * filtered three hardcoded arrays with `String.includes`. This is the first
 * caller, and it only became worth writing once the vectors stopped being
 * fabricated.
 */

export interface VectorMatch {
  documentId: string;
  firmId: string;
  contentChunk: string;
  /** 1 - cosine distance. Higher is closer. */
  similarity: number;
}

export type VectorSearchStatus =
  | 'OK'
  /** No embeddings provider: a query cannot be turned into a vector. */
  | 'NO_PROVIDER'
  /** Supabase not configured. */
  | 'NO_INDEX'
  | 'FAILED';

export interface VectorSearchResult {
  status: VectorSearchStatus;
  matches: VectorMatch[];
  /** Present when status is not OK, so the UI can say what is missing. */
  reason?: string;
}

const DEFAULT_MATCH_COUNT = 8;

export class VectorSearchService {
  async search(
    firmId: string,
    query: string,
    matchCount: number = DEFAULT_MATCH_COUNT
  ): Promise<VectorSearchResult> {
    if (!query.trim()) {
      return { status: 'OK', matches: [] };
    }

    if (!embeddingsService.isAvailable()) {
      return {
        status: 'NO_PROVIDER',
        matches: [],
        reason:
          'La búsqueda semántica requiere un proveedor de embeddings configurado (OPENAI_API_KEY). Sin él no se puede convertir la consulta en vector.'
      };
    }

    if (!supabase) {
      return {
        status: 'NO_INDEX',
        matches: [],
        reason: 'Supabase no está configurado, así que no hay índice sobre el cual buscar.'
      };
    }

    try {
      const queryEmbedding = await embeddingsService.embedQuery(query);

      const { data, error } = await supabase.rpc('match_document_chunks_multi_tenant', {
        query_embedding: queryEmbedding,
        match_count: matchCount,
        filter_firm_id: firmId
      });

      if (error) {
        console.error('[VECTOR-SEARCH]', error.message);
        return { status: 'FAILED', matches: [], reason: 'La búsqueda no pudo completarse.' };
      }

      const matches: VectorMatch[] = (data ?? []).map((row: any) => ({
        documentId: row.document_id,
        firmId: row.firm_id,
        contentChunk: row.content_chunk,
        similarity: row.similarity
      }));

      return { status: 'OK', matches };
    } catch (err) {
      console.error('[VECTOR-SEARCH]', err instanceof Error ? err.message : err);
      return { status: 'FAILED', matches: [], reason: 'La búsqueda no pudo completarse.' };
    }
  }
}

export const vectorSearchService = new VectorSearchService();
