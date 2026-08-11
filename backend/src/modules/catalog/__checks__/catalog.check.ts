/**
 * Correctness checks for actuación matching. Run with: npm run check:catalog
 *
 * The failure this guards against is a confident WRONG match. Attaching the
 * four-month caducidad of nulidad y restablecimiento to nulidad simple, which
 * never expires, would advise a lawyer into losing a case. Each case therefore
 * asserts the exact actuación, not a substring — an earlier, weaker version of
 * this check passed while silently matching the wrong filing.
 *
 * Plain script rather than a test-runner suite so it runs in CI today; it moves
 * to Vitest unchanged when a runner is added.
 */
import { catalogService } from '../catalog.service';
import { buildCatalogGuidance } from '../../agent/catalogGuidance';

interface Case {
  label: string;
  expect: 'MATCH' | 'NO_MATCH';
  mustContain?: string;
  exactMatch?: string;
}

// The dangerous failure is a confident wrong match: attaching the 4-month
// caducidad of nulidad y restablecimiento to nulidad simple, which never
// expires, or vice versa.
const CASES: Case[] = [
  { label: 'Demanda de nulidad simple', expect: 'MATCH', exactMatch: 'Demanda de nulidad simple (medio de control de nulidad)', mustContain: 'No opera caducidad' },
  { label: 'Demanda de nulidad y restablecimiento del derecho', expect: 'MATCH', exactMatch: 'Demanda de nulidad y restablecimiento del derecho' },
  { label: 'Nulidad y restablecimiento del derecho (Art. 138 CPACA)', expect: 'MATCH', exactMatch: 'Demanda de nulidad y restablecimiento del derecho' },
  { label: 'Redacción de la Demanda de Reparación Directa', expect: 'MATCH', exactMatch: 'Demanda de reparación directa' },
  { label: 'Solicitud de pérdida de investidura', expect: 'MATCH', exactMatch: 'Solicitud de pérdida de investidura' },
  // Not catalogued: must fall back rather than guess.
  { label: 'Redacción de Acción de Tutela', expect: 'NO_MATCH' },
  { label: 'Demanda laboral ordinaria', expect: 'NO_MATCH' },
  { label: 'zzz documento inexistente', expect: 'NO_MATCH' },
  { label: 'de la', expect: 'NO_MATCH' }
];

let failures = 0;

for (const testCase of CASES) {
  const found = catalogService.findByDocumentType(testCase.label);
  const got = found ? 'MATCH' : 'NO_MATCH';

  if (got !== testCase.expect) {
    console.error(`FAIL "${testCase.label}": expected ${testCase.expect}, got ${got}${found ? ` (${found.exactName})` : ''}`);
    failures++;
    continue;
  }

  if (found && testCase.exactMatch && found.exactName !== testCase.exactMatch) {
    console.error(`FAIL "${testCase.label}": matched WRONG actuación
     got:      ${found.exactName}
     expected: ${testCase.exactMatch}`);
    failures++;
    continue;
  }

  if (found && testCase.mustContain) {
    const guidance = buildCatalogGuidance(testCase.label) ?? '';
    if (!guidance.includes(testCase.mustContain)) {
      console.error(`FAIL "${testCase.label}": guidance missing "${testCase.mustContain}" (matched ${found.exactName})`);
      failures++;
      continue;
    }
  }

  console.log(`ok   "${testCase.label}" -> ${found ? found.exactName : 'sin catálogo'}`);
}

// Unverified terms must never be presented as an absence of deadline.
const unverified = catalogService.list().filter((a) => a.term.status === 'NO_VERIFICADO');
const sample = unverified[0];

if (sample) {
  const guidance = buildCatalogGuidance(sample.exactName) ?? '';
  if (!guidance.includes('no verificado') || !guidance.includes('NO afirmes')) {
    console.error(`FAIL unverified-term guidance for "${sample.exactName}" does not instruct the model to refrain`);
    failures++;
  } else {
    console.log(`ok   unverified term guarded ("${sample.exactName}")`);
  }
}

// Every catalogued entry must carry a legal basis; that is the whole point.
const missingBasis = catalogService.list().filter((a) => !a.legalBasis?.trim());
if (missingBasis.length) {
  console.error(`FAIL ${missingBasis.length} actuaciones without legalBasis`);
  failures++;
} else {
  console.log(`ok   all ${catalogService.list().length} actuaciones carry a legal basis`);
}

// Ids must be unique or lookups silently return the wrong filing.
const ids = catalogService.list().map((a) => a.id);
if (new Set(ids).size !== ids.length) {
  console.error('FAIL duplicate actuación ids');
  failures++;
} else {
  console.log('ok   ids unique');
}

console.log(failures === 0 ? '\nALL CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
