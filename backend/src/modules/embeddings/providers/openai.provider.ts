import { config } from '../../../config/env.config';
import {
  EMBEDDING_DIMENSIONS,
  EmbeddingsProvider,
  EmbeddingsProviderError,
  EmbeddingsUnavailableError,
  MAX_CHUNK_CHARS
} from '../types';

/**
 * OpenAI embeddings adapter. Optional: the default provider is local and free.
 *
 * `text-embedding-3-small` returns 1536 dimensions natively, but the family
 * accepts a `dimensions` parameter and returns a correctly renormalised vector
 * at the requested width. That is what lets a paid and a local provider share
 * one pgvector column instead of forcing a schema per vendor.
 *
 * Vectors from the two providers are still NOT interchangeable: same width does
 * not mean same vector space. Switching provider means reindexing the corpus.
 */
const MODEL = 'text-embedding-3-small';
const ENDPOINT = 'https://api.openai.com/v1/embeddings';

/** Provider limit per request; batches larger than this are split by the caller. */
export const MAX_BATCH = 96;

const TIMEOUT_MS = 30_000;

interface EmbeddingResponse {
  data?: { embedding: number[]; index: number }[];
  error?: { message?: string };
}

export class OpenAIEmbeddingsProvider implements EmbeddingsProvider {
  readonly name = `openai:${MODEL}`;
  readonly maxBatch = MAX_BATCH;

  isAvailable(): boolean {
    return Boolean(config.openAI.enabled && config.openAI.apiKey);
  }

  async embed(texts: string[]): Promise<number[][]> {
    if (!this.isAvailable()) {
      throw new EmbeddingsUnavailableError(
        'OPENAI_API_KEY no está configurada. La indexación se detiene: escribir vectores falsos haría que la búsqueda devolviera resultados seguros y equivocados.'
      );
    }

    if (texts.length === 0) return [];
    if (texts.length > MAX_BATCH) {
      throw new EmbeddingsProviderError(
        `Lote de ${texts.length} excede el máximo de ${MAX_BATCH}; divídelo antes de llamar.`
      );
    }

    // Truncation is explicit rather than left to the provider, so the caller
    // can see in the code what part of a long chunk is actually indexed.
    const input = texts.map((t) => t.slice(0, MAX_CHUNK_CHARS));

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let payload: EmbeddingResponse;

    try {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.openAI.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ model: MODEL, input, dimensions: EMBEDDING_DIMENSIONS }),
        signal: controller.signal
      });

      payload = (await response.json()) as EmbeddingResponse;

      if (!response.ok) {
        throw new EmbeddingsProviderError(
          payload.error?.message ?? `El proveedor de embeddings respondió ${response.status}.`
        );
      }
    } catch (error) {
      if (error instanceof EmbeddingsProviderError) throw error;
      throw new EmbeddingsProviderError(
        error instanceof Error ? error.message : 'Fallo al llamar al proveedor de embeddings.',
        error
      );
    } finally {
      clearTimeout(timeout);
    }

    const rows = payload.data ?? [];

    if (rows.length !== texts.length) {
      throw new EmbeddingsProviderError(
        `Se pidieron ${texts.length} vectores y llegaron ${rows.length}.`
      );
    }

    // Order is asserted, not assumed: the API returns an index per row and a
    // silently reordered batch would attach every vector to the wrong chunk.
    const ordered = [...rows].sort((a, b) => a.index - b.index).map((r) => r.embedding);

    for (const vector of ordered) {
      if (!Array.isArray(vector) || vector.length !== EMBEDDING_DIMENSIONS) {
        throw new EmbeddingsProviderError(
          `El vector tiene ${vector?.length ?? 0} dimensiones y la columna exige ${EMBEDDING_DIMENSIONS}.`
        );
      }
    }

    return ordered;
  }
}
