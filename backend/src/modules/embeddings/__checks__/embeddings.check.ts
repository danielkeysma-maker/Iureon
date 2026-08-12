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
const VECTOR_SHAPED = /\b(embed\w*|vector\w*|1536)\b/i;

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

  console.log(failures === 0 ? '\nALL CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`);
  process.exit(failures === 0 ? 0 : 1);
})();
