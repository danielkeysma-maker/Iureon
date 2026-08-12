/**
 * Embeddings domain types.
 *
 * The catalogue module refuses to state a term it has not verified. This module
 * exists so the RAG index obeys the same rule: a vector that does not come from
 * a real embedding model is not a weak signal, it is a fabricated one. It looks
 * exactly like a real vector, indexes exactly like a real vector, and returns
 * confident nearest neighbours that are unrelated to the query.
 */

/** Dimension of the pgvector column in supabase/schema.sql. Not negotiable. */
export const EMBEDDING_DIMENSIONS = 1536;

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
  /** False when the integration is not configured; callers must not proceed. */
  isAvailable(): boolean;
  /** Returns one vector per input, in the same order. */
  embed(texts: string[]): Promise<number[][]>;
}
