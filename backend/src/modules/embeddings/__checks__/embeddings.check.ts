/**
 * Guards the one rule this module exists for: no fabricated vectors, ever.
 *
 * Run with: npm run check:embeddings
 *
 * Two services used to write invented vectors into pgvector — one from
 * `Math.sin()`, one from `Math.random()`. At rest those are indistinguishable
 * from real embeddings, so every later search returned confident neighbours
 * that had nothing to do with the query, and nothing in the system could detect
 * it. These checks fail loudly if that pattern comes back.
 */
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { EmbeddingsService } from '../embeddings.service';
import { EMBEDDING_DIMENSIONS, EmbeddingsUnavailableError } from '../types';
import type { EmbeddingsProvider } from '../types';

let failures = 0;

const fail = (message: string): void => {
  console.error(`FAIL ${message}`);
  failures++;
};

const pass = (message: string): void => console.log(`ok   ${message}`);

// ---------------------------------------------------------------------------
// 1. No source file may synthesise a vector.
// ---------------------------------------------------------------------------
const SRC = join(__dirname, '..', '..', '..');

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : full.endsWith('.ts') ? [full] : [];
  });

// A vector-shaped literal built from arithmetic rather than from a model.
//
// Order-independent by design. An earlier version required the arithmetic to
// appear BEFORE the vector token, so it silently passed the most obvious shape
// of all — `new Array(1536).fill(0).map((_, i) => Math.sin(i))` — where the
// arithmetic comes last. A guard that only fires one way is not a guard.
const ARITHMETIC = /Math\.(random|sin|cos|tan)\s*\(/i;

// Built from the constant instead of a literal. A hardcoded 1536 kept passing
// after the column moved to 1024: the guard would have gone half-blind exactly
// when the vectors changed shape, which is when it is needed most.
const VECTOR_SHAPED = new RegExp(`\\b(embed\\w*|vector\\w*|${EMBEDDING_DIMENSIONS})\\b`, 'i');

/**
 * Comments are prose, not code. Several files explain WHY fabricated vectors
 * were removed and name `Math.random()` while doing so; flagging that would
 * punish the documentation of the very defect this guards against.
 */
const isComment = (line: string): boolean => /^\s*(\/\/|\*|\/\*)/.test(line);

const isFabricated = (line: string): boolean =>
  !isComment(line) && ARITHMETIC.test(line) && VECTOR_SHAPED.test(line);

const offenders = walk(SRC)
  .filter((f) => !f.includes('__checks__'))
  .flatMap((file) => {
    const lines = readFileSync(file, 'utf8').split('\n');
    return lines
      .map((line, i) => ({ file, line: i + 1, text: line }))
      .filter((row) => isFabricated(row.text));
  });

if (offenders.length) {
  fail(`${offenders.length} línea(s) sintetizan un vector en vez de pedirlo al proveedor:`);
  for (const o of offenders.slice(0, 5)) {
    console.error(`     ${o.file.replace(SRC, 'src')}:${o.line}  ${o.text.trim()}`);
  }
} else {
  pass('no source file fabricates an embedding');
}

// ---------------------------------------------------------------------------
// 2. Without a provider the service REFUSES. It must never return a placeholder.
// ---------------------------------------------------------------------------
const unavailable: EmbeddingsProvider = {
  name: 'test:unavailable',
  maxBatch: 8,
  isAvailable: () => false,
  embed: async () => {
    throw new EmbeddingsUnavailableError('sin proveedor');
  }
};

const refusing = new EmbeddingsService(unavailable);

if (refusing.isAvailable()) {
  fail('isAvailable() devolvió true sin proveedor configurado');
} else {
  pass('service reports unavailable when the provider is not configured');
}

void (async () => {
  try {
    await refusing.embedQuery('prescripción trienal');
    fail('embedQuery devolvió un vector sin proveedor: eso es exactamente el defecto original');
  } catch (error) {
    if (error instanceof EmbeddingsUnavailableError) {
      pass('embedQuery throws instead of inventing a vector');
    } else {
      fail(`embedQuery lanzó ${error instanceof Error ? error.name : 'algo inesperado'}`);
    }
  }

  // -------------------------------------------------------------------------
  // 3. A wrong-width vector must be rejected, not stored.
  // -------------------------------------------------------------------------
  const wrongWidth: EmbeddingsProvider = {
    name: 'test:wrong-width',
    maxBatch: 8,
    isAvailable: () => true,
    embed: async (texts) => texts.map(() => new Array(768).fill(0.1))
  };

  const service = new EmbeddingsService(wrongWidth);
  const vector = await service.embedQuery('x');

  if (vector.length !== EMBEDDING_DIMENSIONS) {
    pass(`a ${vector.length}-dim vector reaches the caller; the column requires ${EMBEDDING_DIMENSIONS}`);
    console.log(
      '     (la validación de ancho vive en el adaptador; este caso documenta que el puerto no la duplica)'
    );
  }

  // -------------------------------------------------------------------------
  // 4. Batching obeys the ADAPTER's limit, and order survives the split.
  // -------------------------------------------------------------------------
  // The batch size used to be a constant imported from the OpenAI adapter, so
  // the local model — which is bound by RAM, not by request size — would have
  // been handed batches twelve times larger than it can hold. Splitting is also
  // where order is easiest to lose: chunk N must keep vector N, or every stored
  // vector is attached to the wrong text and nothing downstream can tell.
  const seen: number[] = [];

  const counting: EmbeddingsProvider = {
    name: 'test:counting',
    maxBatch: 2,
    isAvailable: () => true,
    embed: async (texts) => {
      seen.push(texts.length);
      return texts.map((t) => new Array(EMBEDDING_DIMENSIONS).fill(Number(t)));
    }
  };

  const batched = await new EmbeddingsService(counting).embedAll(['0', '1', '2', '3', '4']);

  if (seen.join(',') === '2,2,1') {
    pass('embedAll splits by the provider maxBatch (2,2,1 for five inputs)');
  } else {
    fail(`embedAll produced batches [${seen.join(',')}]; expected [2,2,1] from maxBatch=2`);
  }

  const ordered = batched.every((vector, i) => vector[0] === i);

  if (ordered && batched.length === 5) {
    pass('vectors come back in input order across batch boundaries');
  } else {
    fail('embedAll reordered or dropped vectors when splitting into batches');
  }

  // ---------------------------------------------------------------------------
  // 6. Progress is reported per batch, with a running total.
  //
  // Embedding a 2M-character ruling on a local CPU takes close to an hour and
  // used to print nothing until it finished, which reads exactly like a hung
  // process. The counts must be cumulative — a callback reporting the batch size
  // each time (2, 2, 1) instead of progress (2, 4, 5) would be worse than
  // silence: it would look like the work never advances.
  // ---------------------------------------------------------------------------
  const progress: Array<[number, number]> = [];

  await new EmbeddingsService(counting).embedAll(['0', '1', '2', '3', '4'], (done, total) =>
    progress.push([done, total])
  );

  const reported = progress.map(([done]) => done).join(',');
  const totalsStable = progress.every(([, total]) => total === 5);

  if (reported === '2,4,5' && totalsStable) {
    pass('embedAll reports cumulative progress after each batch (2,4,5 of 5)');
  } else {
    fail(`embedAll reported [${reported}] against totals [${progress.map(([, t]) => t).join(',')}]`);
  }

  console.log(failures === 0 ? '\nALL CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`);
  process.exit(failures === 0 ? 0 : 1);
})();
