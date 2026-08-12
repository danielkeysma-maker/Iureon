import { OpenAIEmbeddingsProvider, MAX_BATCH } from './providers/openai.provider';
import type { EmbeddingsProvider } from './types';

/**
 * The single way anything in this codebase turns text into a vector.
 *
 * There is no fallback and there is no mock. Until this replaced them, two
 * services wrote fabricated vectors — one from `Math.sin()`, one from
 * `Math.random()` — straight into the pgvector index. Those vectors are
 * indistinguishable from real ones at rest, so every similarity search over
 * them returned confident, meaningless neighbours, and nothing in the system
 * could tell the difference afterwards.
 *
 * When the provider is unavailable this throws. An index with no rows is
 * honest; an index full of noise is not.
 */
export class EmbeddingsService {
  constructor(private readonly provider: EmbeddingsProvider = new OpenAIEmbeddingsProvider()) {}

  get providerName(): string {
    return this.provider.name;
  }

  isAvailable(): boolean {
    return this.provider.isAvailable();
  }

  /** One vector for a search query. */
  async embedQuery(text: string): Promise<number[]> {
    const [vector] = await this.provider.embed([text]);
    return vector;
  }

  /** Vectors for a whole document, batched to the provider's request limit. */
  async embedAll(texts: string[]): Promise<number[][]> {
    const vectors: number[][] = [];

    for (let i = 0; i < texts.length; i += MAX_BATCH) {
      const batch = texts.slice(i, i + MAX_BATCH);
      vectors.push(...(await this.provider.embed(batch)));
    }

    return vectors;
  }
}

export const embeddingsService = new EmbeddingsService();
