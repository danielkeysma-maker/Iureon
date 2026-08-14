import { config } from '../../config/env.config';
import { LocalEmbeddingsProvider } from './providers/local.provider';
import { OpenAIEmbeddingsProvider } from './providers/openai.provider';
import type { EmbeddingsProvider } from './types';

/**
 * Which adapter backs the index.
 *
 * Local by default, deliberately: it costs nothing and needs no account, so a
 * fresh clone can build the corpus without a billing decision standing in the
 * way. `EMBEDDINGS_PROVIDER=openai` opts into the hosted one.
 *
 * This is a one-way door per corpus. The two providers produce vectors of the
 * same width in different spaces, so changing it without reindexing leaves the
 * old rows sitting there, comparable in arithmetic and meaningless in fact.
 */
const resolveProvider = (): EmbeddingsProvider =>
  config.embeddings.provider === 'openai'
    ? new OpenAIEmbeddingsProvider()
    : new LocalEmbeddingsProvider();

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
  constructor(private readonly provider: EmbeddingsProvider = resolveProvider()) {}

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

    // The limit comes from the adapter: a hosted API caps a batch by request
    // size, a local model caps it by RAM. Hardcoding one vendor's number here
    // would either waste requests or exhaust memory on the other.
    const size = this.provider.maxBatch;

    for (let i = 0; i < texts.length; i += size) {
      const batch = texts.slice(i, i + size);
      vectors.push(...(await this.provider.embed(batch)));
    }

    return vectors;
  }
}

export const embeddingsService = new EmbeddingsService();
