import { config } from '../../../config/env.config';
import {
  EMBEDDING_DIMENSIONS,
  EmbeddingsProvider,
  EmbeddingsProviderError,
  MAX_CHUNK_CHARS
} from '../types';

/**
 * Local embeddings adapter. No API key, no per-token cost, no network call
 * after the first run.
 *
 * The model is bge-m3 (XLM-RoBERTa, 1024 dimensions) executed through ONNX
 * Runtime inside this process. It was chosen over multilingual-e5-large for two
 * reasons that matter for legal text:
 *
 *   1. It accepts ~8000 tokens per input against e5's 512, so a long article or
 *      a whole ruling survives as one chunk instead of being cut mid-argument.
 *   2. It needs no `query:` / `passage:` prefix. The e5 family silently loses
 *      retrieval quality when that prefix is missing — a defect that produces
 *      plausible results and no error, which is the worst kind here.
 *
 * This is a REAL model, so it satisfies the rule this module exists for: the
 * vectors are earned, not synthesised.
 */
const DEFAULT_MODEL = 'Xenova/bge-m3';

/**
 * Quantised weights (~600 MB) instead of full precision (~2.2 GB). Retrieval
 * quality loss at q8 is marginal; the memory difference decides whether this
 * runs on an ordinary laptop at all.
 */
const DTYPE = 'q8';

/**
 * Small on purpose. Each item in a batch holds its own activation tensors in
 * RAM, and this model's context is long. A hosted API is limited by request
 * size; this one is limited by the machine.
 */
const LOCAL_MAX_BATCH = 8;

/** Loose shape of the pieces of transformers.js this adapter touches. */
type FeatureExtractor = (
  texts: string[],
  options: { pooling: 'cls' | 'mean'; normalize: boolean }
) => Promise<{ tolist: () => number[][] }>;

export class LocalEmbeddingsProvider implements EmbeddingsProvider {
  readonly name = `local:${config.embeddings.model}`;
  readonly maxBatch = LOCAL_MAX_BATCH;

  /** Single-flight: many concurrent chunks must not load the model many times. */
  private extractor?: Promise<FeatureExtractor>;

  /**
   * Always true. Unlike a hosted provider there is nothing to configure — no
   * key, no account, no billing. A missing dependency surfaces as a loud error
   * on first use rather than as a silent "unavailable", because "not installed"
   * is a broken deployment, not a deliberate opt-out.
   */
  isAvailable(): boolean {
    return true;
  }

  private load(): Promise<FeatureExtractor> {
    if (!this.extractor) {
      console.log(
        `[EMBEDDINGS] Cargando ${config.embeddings.model} (${DTYPE}). La primera vez descarga los pesos; después queda en caché local.`
      );

      // Imported here, not at the top of the file, and on purpose.
      // @huggingface/transformers is ESM-only while this backend compiles to
      // CommonJS. Under `module: NodeNext` a dynamic import survives as a real
      // import in the emitted CJS, whereas a static one would not resolve.
      // Keeping it inside the method also means `check:embeddings`, which
      // transpiles with `module: commonjs`, never touches it.
      this.extractor = import('@huggingface/transformers')
        .then(({ pipeline }) =>
          pipeline('feature-extraction', config.embeddings.model, { dtype: DTYPE })
        )
        .then((p) => p as unknown as FeatureExtractor)
        .catch((error) => {
          // Reset so a transient failure (a half-finished download) can be
          // retried instead of poisoning every later call with a settled
          // rejected promise.
          this.extractor = undefined;
          throw new EmbeddingsProviderError(
            `No se pudo cargar el modelo local ${config.embeddings.model}. Verifica que @huggingface/transformers esté instalado y que haya espacio en disco.`,
            error
          );
        });
    }

    return this.extractor;
  }

  async embed(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];

    if (texts.length > LOCAL_MAX_BATCH) {
      throw new EmbeddingsProviderError(
        `Lote de ${texts.length} excede el máximo de ${LOCAL_MAX_BATCH}; divídelo antes de llamar.`
      );
    }

    // Truncation is explicit rather than left to the tokenizer, matching the
    // OpenAI adapter, so both providers index the same slice of a long chunk.
    const input = texts.map((t) => t.slice(0, MAX_CHUNK_CHARS));

    const extractor = await this.load();

    let vectors: number[][];

    try {
      // CLS pooling with L2 normalisation is what bge-m3 defines as its dense
      // vector. Mean pooling here would produce vectors that are internally
      // consistent but not the ones the model was trained to compare, and the
      // damage would only show as mediocre search results.
      const output = await extractor(input, { pooling: 'cls', normalize: true });
      vectors = output.tolist();
    } catch (error) {
      throw new EmbeddingsProviderError(
        error instanceof Error ? error.message : 'Fallo al ejecutar el modelo local de embeddings.',
        error
      );
    }

    if (vectors.length !== texts.length) {
      throw new EmbeddingsProviderError(
        `Se pidieron ${texts.length} vectores y llegaron ${vectors.length}.`
      );
    }

    for (const vector of vectors) {
      if (!Array.isArray(vector) || vector.length !== EMBEDDING_DIMENSIONS) {
        throw new EmbeddingsProviderError(
          `El vector tiene ${vector?.length ?? 0} dimensiones y la columna exige ${EMBEDDING_DIMENSIONS}.`
        );
      }
    }

    return vectors;
  }
}
