import { config } from '../../../config/env.config';
import {
  EMBEDDING_DIMENSIONS,
  EmbeddingsProviderError,
  MAX_CHUNK_CHARS,
  type EmbeddingsProvider
} from '../types';

/**
 * Cloudflare Workers AI adapter, serving the SAME model that indexed the corpus.
 *
 * WHY THIS EXISTS. The local provider loads bge-m3 — 600 MB of ONNX weights —
 * into the process. That works on a laptop and nowhere this deploys: a Vercel
 * serverless function cannot hold it, and neither free tier evaluated as an
 * alternative (Render and Koyeb, 512 MB of RAM each) has the memory. The
 * jurisprudence search answered `FAILED` in production for exactly that reason
 * while passing every check locally.
 *
 * WHY NOT A DIFFERENT HOSTED MODEL. `@cf/baai/bge-m3` is the same model as
 * `Xenova/bge-m3`, so the vectors live in the same space and the 5,854 chunks
 * already in SYSTEM_CORPUS stay valid. Any other embedding model — cheaper,
 * faster, better on paper — would produce vectors that are not comparable to
 * what is stored, and the search would return confident nonsense rather than
 * failing. Same width is not the same space.
 *
 * ONE CAVEAT, MEASURED RATHER THAN ASSUMED. The corpus was indexed with the
 * 8-bit quantised build running locally; Cloudflare serves its own precision.
 * Same model means the same geometry, but quantisation shifts values slightly.
 * `npm run check:embeddings-parity` embeds identical text through both paths and
 * compares them, so this is a number rather than a hope.
 */
const MODEL = '@cf/baai/bge-m3';

/**
 * Cloudflare bills per million input tokens, not per request, so the batch size
 * is bounded by payload sanity rather than by cost.
 */
const MAX_BATCH = 100;

interface CloudflareEmbeddingResponse {
  success?: boolean;
  errors?: { code?: number; message?: string }[];
  result?: {
    /** Present on bge models; one vector per input, in order. */
    data?: number[][];
    shape?: number[];
  };
}

export class CloudflareEmbeddingsProvider implements EmbeddingsProvider {
  readonly name = `cloudflare:${MODEL}`;
  readonly maxBatch = MAX_BATCH;

  isAvailable(): boolean {
    return Boolean(config.cloudflare?.accountId && config.cloudflare?.apiToken);
  }

  async embed(texts: string[]): Promise<number[][]> {
    if (!this.isAvailable()) {
      throw new EmbeddingsProviderError(
        'Cloudflare Workers AI no está configurado. Faltan CLOUDFLARE_ACCOUNT_ID o CLOUDFLARE_API_TOKEN.'
      );
    }

    // Truncated here rather than by the vendor, so the cut is ours and the same
    // one the local provider applies. A silently shortened chunk embeds fine and
    // loses the end of a holding.
    const input = texts.map((text) => text.slice(0, MAX_CHUNK_CHARS));

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${config.cloudflare.accountId}/ai/run/${MODEL}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.cloudflare.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: input })
      }
    );

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new EmbeddingsProviderError(
        `Cloudflare Workers AI respondió ${response.status}: ${detail.slice(0, 300)}`
      );
    }

    const payload = (await response.json()) as CloudflareEmbeddingResponse;

    if (payload.success === false) {
      const message = payload.errors?.map((e) => e.message).join('; ') || 'sin detalle';
      throw new EmbeddingsProviderError(`Cloudflare Workers AI rechazó la petición: ${message}`);
    }

    const vectors = payload.result?.data;

    if (!Array.isArray(vectors) || vectors.length !== input.length) {
      throw new EmbeddingsProviderError(
        `Cloudflare devolvió ${vectors?.length ?? 0} vectores para ${input.length} textos.`
      );
    }

    // Width is checked here, not downstream. A vector of the wrong size inserts
    // happily into a mismatched column in some drivers and then never matches
    // anything, which reads as "the corpus has nothing on that" rather than as a
    // bug.
    for (const vector of vectors) {
      if (!Array.isArray(vector) || vector.length !== EMBEDDING_DIMENSIONS) {
        throw new EmbeddingsProviderError(
          `Cloudflare devolvió un vector de ${vector?.length ?? 0} dimensiones; la columna exige ${EMBEDDING_DIMENSIONS}.`
        );
      }
    }

    return vectors;
  }
}
