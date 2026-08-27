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
  branch: string | null;
  fileName: string | null;
  /**
   * Provenance carried by the row: providencia, corporación, ponente, sourceUrl.
   * A match without it is an untraceable paragraph, which is not usable as
   * precedent no matter how relevant it looks.
   */
  metadata: Record<string, unknown> | null;
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

/**
 * How many chunks to pull before collapsing them to one per document.
 *
 * WHY THIS EXISTS. Measured against the live corpus: every one of the three top
 * results for "plazo para responder el requerimiento especial aduanero" was a
 * different chunk of the SAME DIAN concepto. A lawyer asking for precedent got
 * one source shown three times and two sources they never saw.
 *
 * It is not a tie-breaking nicety. A long document has hundreds of chunks — the
 * largest concepto here has 363 — so the more thoroughly a document covers a
 * question, the more completely it crowds out everything else that answers it.
 * Relevance and repetition become the same signal.
 *
 * FIVE, AND MEASURED RATHER THAN GUESSED. Raising it does not help the case
 * that motivates it. For "plazo para responder el requerimiento especial
 * aduanero" the DIAN's 363-chunk concepto owns the top 40, 80, 150 AND 250
 * chunks — no second document appears at any depth, because that concepto
 * genuinely is the corpus's answer and nothing else is close. Overfetching
 * further reads more rows to find the same thing.
 *
 * So five buys the diversity that exists and refuses to invent the diversity
 * that does not. One honest result beats padding it with the 251st chunk of the
 * same document, which is what a bigger number would deliver.
 *
 * It costs one larger read and no extra embedding call: the query is vectorised
 * once either way.
 */
const OVERFETCH = 5;

/** Ceiling on the raw read, so a large matchCount cannot ask for a table scan. */
const MAX_RAW_MATCHES = 200;

/**
 * Best chunk per document, in the order the similarity gave them.
 *
 * `fileName` is the document key in both corpora — a providencia and a concepto
 * each carry one. A row without it falls back to its own id, which keeps it as
 * its own document rather than silently merging every unnamed row into one.
 */
const bestPerDocument = (matches: VectorMatch[], limit: number): VectorMatch[] => {
  const seen = new Set<string>();
  const kept: VectorMatch[] = [];

  for (const match of matches) {
    const key = match.fileName ?? match.documentId ?? `${kept.length}`;
    if (seen.has(key)) continue;

    seen.add(key);
    kept.push(match);

    if (kept.length === limit) break;
  }

  return kept;
};

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
          'La búsqueda semántica requiere un proveedor de embeddings. Sin él no se puede convertir la consulta en vector.'
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
        match_count: Math.min(matchCount * OVERFETCH, MAX_RAW_MATCHES),
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
        similarity: row.similarity,
        branch: row.branch ?? null,
        fileName: row.file_name ?? null,
        metadata: row.metadata ?? null
      }));

      return { status: 'OK', matches: bestPerDocument(matches, matchCount) };
    } catch (err) {
      console.error('[VECTOR-SEARCH]', err instanceof Error ? err.message : err);
      return { status: 'FAILED', matches: [], reason: 'La búsqueda no pudo completarse.' };
    }
  }
}

export const vectorSearchService = new VectorSearchService();
