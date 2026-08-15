/**
 * Guards that the corpus can still be FOUND, not merely that it was written.
 *
 * Run with: npm run check:retrieval
 *
 * WHY THIS EXISTS. Every other check in this repo is static: they prove no
 * source file fabricates a citation or a vector. None of them ask the corpus a
 * question. So on 2026-08-14 the chunk size changed from 1000 to 2500 with
 * overlap and 62 providencias were ingested, and nothing in the suite could
 * have told us whether retrieval got better, worse, or stopped working — the
 * one property the whole pipeline exists for.
 *
 * A retrieval regression is silent by nature. The search keeps returning
 * results; they are just the wrong ones. The lawyer notices, not the build.
 *
 * These cases ask questions whose correct providencia is known, and assert it
 * comes back near the top.
 *
 * ON SKIPPING. This check needs a live embeddings provider, a live Supabase and
 * a seeded corpus. When any is missing it reports SKIPPED and exits 0 on
 * purpose: a gate that fails on every machine without credentials is a gate
 * everyone learns to ignore, and an ignored gate protects nothing.
 */
import { embeddingsService } from '../../embeddings/embeddings.service';
import { vectorSearchService } from '../vectorSearch.service';

let failures = 0;
const fail = (message: string): void => {
  console.error(`FAIL ${message}`);
  failures++;
};
const pass = (message: string): void => console.log(`ok   ${message}`);
const skip = (message: string): void => console.log(`--   SKIPPED: ${message}`);

interface RetrievalCase {
  query: string;
  /** Regex over `file_name`, which the pipeline writes as `<providencia>.pdf`. */
  expect: RegExp;
  /** How deep the expected ruling may sit and still count. */
  within: number;
  why: string;
}

const CASES: RetrievalCase[] = [
  {
    query: 'estado de cosas inconstitucional por hacinamiento carcelario',
    expect: /T-153 de 1998|T-388 de 2013/,
    within: 3,
    why: 'the two rulings that declared the ECI in prisons'
  },
  {
    query: 'derecho fundamental a la salud y fallas del sistema',
    expect: /T-760 de 2008/,
    within: 3,
    why: 'the structural ruling on the health system'
  },
  {
    query: 'desplazamiento forzado y estado de cosas inconstitucional',
    expect: /T-025 de 2004/,
    within: 3,
    why: 'the ECI on forced displacement'
  },
  {
    query: 'despenalización del aborto en tres causales',
    expect: /C-355 de 2006/,
    within: 3,
    why: 'the three-grounds ruling'
  },
  {
    // Guards the Word 97 branch specifically. This providencia is only reachable
    // because ingestCorpus reads the OLE stream; if that branch breaks, the
    // ruling silently leaves the corpus and only this case would notice.
    query: 'concurrencia de culpas en actividad peligrosa por accidente de tránsito',
    expect: /SC2107-2018/,
    within: 3,
    why: 'recovered from a Word 97 binary, so it also guards that reader'
  },
  {
    // KNOWN GAP, asserted at the level it actually performs so that further
    // decay is visible. C-590 de 2005 ESTABLISHED these requisitos, but rulings
    // that merely apply them (T-384 de 2018, SU-087 de 2022) outrank it: they
    // restate the doctrine in language closer to the query. Vector similarity
    // does not distinguish a doctrine's source from those who cite it. The fix
    // is re-ranking or metadata weighting, not a chunking change.
    query: 'requisitos de procedibilidad de la tutela contra providencia judicial',
    expect: /C-590 de 2005/,
    within: 12,
    why: 'known gap: the founding ruling is outranked by those applying it'
  }
];

/** A query with no bearing on the corpus must not score like a real one. */
const NONSENSE = 'qwertyuiop asdfghjkl zxcvbnm';

/**
 * Real queries above score 0.60–0.78. The bar sits well below that band: this
 * catches a corpus answering everything with the same lukewarm neighbour, not
 * small drifts in the model.
 */
const NONSENSE_CEILING = 0.55;

(async () => {
  if (!embeddingsService.isAvailable()) {
    skip('no hay proveedor de embeddings configurado');
    process.exit(0);
  }

  const probe = await vectorSearchService.search('SYSTEM_CORPUS', CASES[0].query, 1);

  if (probe.status !== 'OK') {
    skip(`la búsqueda respondió ${probe.status}: ${probe.reason ?? 'sin detalle'}`);
    process.exit(0);
  }

  if (probe.matches.length === 0) {
    skip('SYSTEM_CORPUS está vacío; sembrarlo es una operación aparte (npm run ingest:corpus)');
    process.exit(0);
  }

  for (const testCase of CASES) {
    const result = await vectorSearchService.search('SYSTEM_CORPUS', testCase.query, testCase.within);

    if (result.status !== 'OK') {
      fail(`"${testCase.query}" respondió ${result.status}: ${result.reason ?? 'sin detalle'}`);
      continue;
    }

    const names = result.matches.map((match) => match.fileName ?? '');
    const rank = names.findIndex((name) => testCase.expect.test(name));

    if (rank === -1) {
      fail(
        `"${testCase.query}" no recuperó ${testCase.expect.source} en los primeros ${testCase.within} ` +
          `(devolvió: ${names.slice(0, 3).join(', ') || 'nada'}) — ${testCase.why}`
      );
    } else {
      pass(`"${testCase.query}" -> puesto ${rank + 1}`);
    }
  }

  const noise = await vectorSearchService.search('SYSTEM_CORPUS', NONSENSE, 1);
  const topSimilarity = noise.matches[0]?.similarity ?? 0;

  if (topSimilarity < NONSENSE_CEILING) {
    pass(`una consulta sin sentido no puntúa como jurisprudencia (${topSimilarity.toFixed(3)})`);
  } else {
    fail(
      `una consulta sin sentido puntuó ${topSimilarity.toFixed(3)}, por encima de ${NONSENSE_CEILING}: ` +
        'el corpus estaría devolviendo el mismo vecino tibio para cualquier cosa'
    );
  }

  console.log(failures === 0 ? '\nALL CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`);
  process.exit(failures === 0 ? 0 : 1);
})();
