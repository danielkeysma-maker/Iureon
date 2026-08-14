/**
 * Embeddings domain types.
 *
 * The catalogue module refuses to state a term it has not verified. This module
 * exists so the RAG index obeys the same rule: a vector that does not come from
 * a real embedding model is not a weak signal, it is a fabricated one. It looks
 * exactly like a real vector, indexes exactly like a real vector, and returns
 * confident nearest neighbours that are unrelated to the query.
 */

/**
 * Dimension of the pgvector column in supabase/schema.sql. Not negotiable.
 *
 * 1024, the native width of bge-m3, so the default provider can run locally at
 * no cost. OpenAI stays usable because text-embedding-3-* accepts a
 * `dimensions` parameter and returns a correctly normalised 1024-wide vector.
 *
 * Changing this number invalidates every stored vector: two vectors of
 * different width are not comparable, and a column change silently drops the
 * old index. It was moved from 1536 while the table held zero rows, which is
 * the only cheap moment such a change ever has.
 */
export const EMBEDDING_DIMENSIONS = 1024;

/** Longest input a single chunk may carry before the provider truncates it. */
export const MAX_CHUNK_CHARS = 8000;

export class EmbeddingsUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EmbeddingsUnavailableError';
  }
}

export class EmbeddingsProviderError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = 'EmbeddingsProviderError';
  }
}

/**
 * Port. Swapping vendor means writing a new adapter, not touching callers.
 *
 * `embed` takes a batch because every provider charges and rate-limits per
 * request, and a document is many chunks.
 */
export interface EmbeddingsProvider {
  /** Human-readable identity, for logs and provenance. */
  readonly name: string;
  /**
   * Largest batch this provider accepts in one call. It belongs to the adapter
   * because the limit is a property of the vendor, not of the caller: a hosted
   * API caps it by request size, a local model caps it by available RAM.
   */
  readonly maxBatch: number;
  /** False when the integration is not configured; callers must not proceed. */
  isAvailable(): boolean;
  /** Returns one vector per input, in the same order. */
  embed(texts: string[]): Promise<number[][]>;
}
