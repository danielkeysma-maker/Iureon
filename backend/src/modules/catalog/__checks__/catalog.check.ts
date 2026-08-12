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
import { buildCatalogGuidance, renderCatalogGuidance } from '../../agent/catalogGuidance';
import { validateVerificationInput } from '../verification.validate';
import { applyVerification } from '../verification.merge';
import type { CatalogVerification } from '../types';

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
  // Constitucional. These three are distinct actions and the codebase has
  // already confused two of them once: a derecho de petición template was
  // derived from an acción de cumplimiento template with a string replace.
  { label: 'Redacción de Acción de Tutela', expect: 'MATCH', exactMatch: 'Acción de tutela' },
  { label: 'Acción de cumplimiento', expect: 'MATCH', exactMatch: 'Acción de cumplimiento' },
  { label: 'Incidente de desacato', expect: 'MATCH', exactMatch: 'Solicitud de apertura de incidente de desacato' },
  { label: 'Impugnación del fallo de tutela', expect: 'MATCH' },

  // Still not catalogued: must fall back rather than guess.
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

// ---------------------------------------------------------------------------
// Curation. The firm can correct the catalogue from inside the product, which
// means the write path is now the place an unverified deadline could enter. It
// is checked at least as hard as the matcher.
// ---------------------------------------------------------------------------

const expectRejected = (label: string, body: Record<string, unknown>, expectedCode: string): void => {
  const result = validateVerificationInput(body, String(body.actuacionId ?? ''));

  if (result.ok) {
    console.error(`FAIL curation "${label}": expected rejection ${expectedCode}, but it was accepted`);
    failures++;
    return;
  }
  if (result.error.code !== expectedCode) {
    console.error(
      `FAIL curation "${label}": expected ${expectedCode}, got ${result.error.code}`
    );
    failures++;
    return;
  }

  console.log(`ok   curation rejects ${label}`);
};

const VALID_ID = 'administrativo/demanda-de-nulidad-simple';

// Claiming a term without saying where it was read is an assertion, not a
// verification, and the catalogue exists precisely to make that impossible.
expectRejected(
  'un término VERIFICADO sin fuente',
  { actuacionId: VALID_ID, termStatus: 'VERIFICADO', termDescription: '4 meses', verifiedBy: 'Ana' },
  'MISSING_SOURCE_URL'
);

expectRejected(
  'un término VERIFICADO sin descripción',
  { actuacionId: VALID_ID, termStatus: 'VERIFICADO', sourceUrl: 'https://x.co/n', verifiedBy: 'Ana' },
  'MISSING_TERM_DESCRIPTION'
);

// Describing a deadline while declaring it unverified is the exact confusion
// TermStatus exists to prevent.
expectRejected(
  'NO_VERIFICADO con descripción de término',
  { actuacionId: VALID_ID, termStatus: 'NO_VERIFICADO', termDescription: '4 meses', verifiedBy: 'Ana' },
  'UNVERIFIED_WITH_DESCRIPTION'
);

expectRejected(
  'una verificación sin autor',
  {
    actuacionId: VALID_ID,
    termStatus: 'NO_CADUCA',
    termDescription: 'No opera caducidad',
    sourceUrl: 'https://x.co/n'
  },
  'MISSING_VERIFIED_BY'
);

// The source is rendered as a link; a non-http scheme must never survive.
expectRejected(
  'una fuente con esquema no http',
  {
    actuacionId: VALID_ID,
    termStatus: 'VERIFICADO',
    termDescription: '4 meses',
    sourceUrl: 'javascript:alert(1)',
    verifiedBy: 'Ana'
  },
  'MISSING_SOURCE_URL'
);

expectRejected(
  'un estado de término inexistente',
  { actuacionId: VALID_ID, termStatus: 'QUIZAS', verifiedBy: 'Ana' },
  'INVALID_TERM_STATUS'
);

const wellFormed = validateVerificationInput(
  {
    termStatus: 'VERIFICADO',
    termDescription: '30 días hábiles siguientes a la notificación',
    sourceUrl: 'https://www.suin-juriscol.gov.co/norma',
    verifiedBy: 'Dra. Ana Ruiz',
    note: 'Confirmado con el texto vigente'
  },
  VALID_ID
);

if (!wellFormed.ok) {
  console.error(`FAIL curation: a well-formed verification was rejected (${wellFormed.error.code})`);
  failures++;
} else {
  console.log('ok   curation accepts a well-formed verification');
}

// A firm override must actually reach the drafting engine, and must carry its
// provenance so nobody mistakes it for the shipped catalogue.
const baseForMerge = catalogService.list().find((a) => a.term.status === 'NO_VERIFICADO');

if (!baseForMerge) {
  console.error('FAIL curation: no NO_VERIFICADO actuación available to exercise the merge');
  failures++;
} else {
  const verification: CatalogVerification = {
    actuacionId: baseForMerge.id,
    term: { status: 'VERIFICADO', description: '10 días hábiles (norma verificada por la firma)' },
    legalBasis: null,
    sourceUrl: 'https://www.suin-juriscol.gov.co/norma',
    note: null,
    verifiedBy: 'Dra. Ana Ruiz',
    verifiedAt: '2026-08-12T00:00:00.000Z'
  };

  const merged = applyVerification(baseForMerge, verification);
  const guidance = renderCatalogGuidance(merged) ?? '';

  if (merged.term.status !== 'VERIFICADO' || !merged.verification) {
    console.error('FAIL curation: the override did not replace the term or lost its provenance');
    failures++;
  } else if (merged.verification.replaced.status !== 'NO_VERIFICADO') {
    console.error('FAIL curation: the override did not record what it replaced');
    failures++;
  } else if (!guidance.includes('10 días hábiles') || guidance.includes('no verificado en el catálogo')) {
    console.error('FAIL curation: the drafting guidance still carries the pre-override term');
    failures++;
  } else if (!guidance.includes('Dra. Ana Ruiz')) {
    console.error('FAIL curation: the drafting guidance does not disclose that the firm supplied it');
    failures++;
  } else {
    console.log(`ok   firm override reaches the drafting guidance ("${baseForMerge.exactName}")`);
  }

  // Retracting must restore the warning, never leave a described term behind.
  const retracted = applyVerification(
    { ...baseForMerge, term: { status: 'VERIFICADO', description: '4 meses' } },
    { ...verification, term: { status: 'NO_VERIFICADO', description: null } }
  );
  const retractedGuidance = renderCatalogGuidance(retracted) ?? '';

  if (!retractedGuidance.includes('NO afirmes') || retractedGuidance.includes('4 meses')) {
    console.error('FAIL curation: retracting a term did not restore the "do not assert" instruction');
    failures++;
  } else {
    console.log('ok   retracting a term restores the unverified warning');
  }
}

console.log(failures === 0 ? '\nALL CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
