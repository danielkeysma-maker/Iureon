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
import type { CatalogVerification, LegalBranch } from '../types';

interface Case {
  label: string;
  expect: 'MATCH' | 'NO_MATCH';
  mustContain?: string;
  exactMatch?: string;
  /** Narrows the search, as a caller who knows the branch would. */
  branch?: LegalBranch;
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

  // Civil (CGP). The verbal / verbal sumario pair is the dangerous one: the
  // traslado is 20 days in one and 10 in the other, so a wrong match halves or
  // doubles the window a defendant actually has to answer.
  {
    label: 'Contestación de la demanda en proceso verbal',
    expect: 'MATCH',
    exactMatch: 'Contestación de la demanda en proceso verbal',
    mustContain: 'Veinte (20) días'
  },
  {
    label: 'Contestación de demanda verbal sumario',
    expect: 'MATCH',
    exactMatch: 'Contestación de la demanda en proceso verbal sumario',
    mustContain: 'Diez (10) días'
  },
  {
    label: 'Demanda de proceso verbal sumario',
    expect: 'MATCH',
    exactMatch: 'Demanda de proceso verbal sumario'
  },
  // Casación splits into two filings with very different windows: 5 days to
  // lodge the recurso, 30 to file the demanda. Collapsing them loses the case.
  {
    label: 'Interposición del recurso de casación',
    expect: 'MATCH',
    branch: 'CIVIL',
    exactMatch: 'Interposición del recurso extraordinario de casación',
    mustContain: 'Cinco (5) días'
  },
  {
    label: 'Demanda de casación',
    expect: 'MATCH',
    exactMatch: 'Demanda de casación',
    mustContain: 'Treinta (30) días'
  },
  // Three ordinary recursos, all with a 3-day window but different addressees.
  // The first two share a name with a CPACA filing, so they need their branch.
  { label: 'Recurso de reposición', expect: 'MATCH', branch: 'CIVIL', exactMatch: 'Recurso de reposición' },
  { label: 'Recurso de apelación', expect: 'MATCH', branch: 'CIVIL', exactMatch: 'Recurso de apelación' },
  { label: 'Recurso de súplica', expect: 'MATCH', branch: 'CIVIL', exactMatch: 'Recurso de súplica' },

  // THE COLLISION. "Recurso de reposición" is 3 days before a civil judge
  // (CGP art. 318) and 10 before the administration (CPACA art. 76). Asked
  // without a branch, the catalogue must refuse: answering with either one at
  // random would hand a lawyer a wrong deadline with full confidence, which is
  // the single failure mode this module exists to prevent.
  { label: 'Recurso de reposición', expect: 'NO_MATCH' },
  { label: 'Recurso de apelación', expect: 'NO_MATCH' },
  { label: 'Recurso de queja', expect: 'NO_MATCH' },
  { label: 'Recurso de súplica', expect: 'NO_MATCH' },
  {
    label: 'Recurso de reposición',
    expect: 'MATCH',
    branch: 'ADMINISTRATIVO',
    exactMatch: 'Recurso de reposición (vía gubernativa)',
    mustContain: 'diez (10) días'
  },
  // Executive proceedings: the plain and the secured demand are different filings.
  { label: 'Demanda ejecutiva singular', expect: 'MATCH', exactMatch: 'Demanda ejecutiva singular' },
  {
    label: 'Demanda ejecutiva con garantía real',
    expect: 'MATCH',
    exactMatch: 'Demanda ejecutiva con garantía real'
  },
  {
    label: 'Excepciones de mérito en proceso ejecutivo',
    expect: 'MATCH',
    exactMatch: 'Excepciones de mérito en proceso ejecutivo',
    mustContain: 'Diez (10) días'
  },
  // Queja was unverifiable when this case was written, so it asserted the
  // refusal wording. The term has since been read in the norm: it has no term
  // of its own because it travels in subsidio of the reposición (art. 353).
  // The case now asserts that derivation, which is the fact most easily lost
  // if someone later "simplifies" the entry into a bare number of days.
  {
    label: 'Recurso de queja',
    expect: 'MATCH',
    branch: 'CIVIL',
    exactMatch: 'Recurso de queja',
    mustContain: 'subsidio'
  },
  {
    label: 'Demanda de pertenencia',
    expect: 'MATCH',
    exactMatch: 'Demanda de declaración de pertenencia'
  },

  // Laboral (Ley 2452 de 2025, the code in force since 2 April 2026). The
  // pairs below are the ones a lawyer would most easily carry across branches.
  {
    label: 'Contestación de la demanda laboral',
    expect: 'MATCH',
    branch: 'LABORAL',
    exactMatch: 'Contestación de la demanda laboral',
    mustContain: 'Diez (10) días'
  },
  {
    label: 'Demanda laboral ordinaria',
    expect: 'MATCH',
    branch: 'LABORAL',
    exactMatch: 'Demanda laboral ordinaria'
  },
  // Revisión is 2 years in civil (CGP art. 356) and 5 in labour (art. 236).
  // Same recurso, same name shape, two and a half times the window.
  {
    label: 'Recurso extraordinario de revisión laboral',
    expect: 'MATCH',
    branch: 'LABORAL',
    exactMatch: 'Recurso extraordinario de revisión laboral',
    mustContain: 'Cinco (5) años'
  },
  {
    label: 'Recurso extraordinario de revisión',
    expect: 'MATCH',
    branch: 'CIVIL',
    exactMatch: 'Recurso extraordinario de revisión',
    mustContain: 'Dos (2) años'
  },
  {
    label: 'Excepción de prescripción trienal',
    expect: 'MATCH',
    branch: 'LABORAL',
    exactMatch: 'Formulación de la excepción de prescripción trienal',
    mustContain: 'tres (3) años'
  },
  {
    label: 'Recurso de apelación laboral',
    expect: 'MATCH',
    branch: 'LABORAL',
    exactMatch: 'Recurso de apelación laboral',
    mustContain: 'tres (3) días'
  },
  // Once unverifiable, now read in Ley 2452 de 2025 art. 243: twenty days of
  // traslado to sustain. The article number is asserted because this branch was
  // renumbered wholesale — a carried-over CPTSS citation is the failure mode.
  {
    label: 'Demanda de casación laboral',
    expect: 'MATCH',
    branch: 'LABORAL',
    exactMatch: 'Demanda de casación laboral',
    mustContain: 'art. 243'
  },

  // Familia. The catalogue's job here is partly to NOT offer something.
  {
    label: 'Solicitud de adjudicación judicial de apoyos',
    expect: 'MATCH',
    branch: 'FAMILIA',
    exactMatch: 'Solicitud de adjudicación judicial de apoyos',
    mustContain: 'cinco (5) días'
  },
  {
    label: 'Demanda de divorcio contencioso',
    expect: 'MATCH',
    branch: 'FAMILIA',
    exactMatch: 'Demanda de divorcio contencioso',
    mustContain: 'veinte (20) días'
  },
  {
    label: 'Demanda de investigación de la paternidad',
    expect: 'MATCH',
    branch: 'FAMILIA',
    exactMatch: 'Demanda de investigación de la paternidad o la maternidad'
  },
  {
    label: 'Demanda de alimentos a favor de mayor de edad',
    expect: 'MATCH',
    branch: 'FAMILIA',
    exactMatch: 'Demanda de alimentos a favor de mayor de edad',
    mustContain: 'alimentos provisionales'
  },

  // Penal (Ley 906 de 2004). These terms decide whether someone stays in
  // custody, so they are asserted digit by digit.
  {
    label: 'Solicitud de libertad por vencimiento de términos',
    expect: 'MATCH',
    branch: 'PENAL',
    exactMatch: 'Solicitud de libertad por vencimiento de términos',
    mustContain: 'sesenta (60) días'
  },
  {
    label: 'Solicitud de control de legalidad de la captura',
    expect: 'MATCH',
    branch: 'PENAL',
    exactMatch: 'Solicitud de control de legalidad de la captura',
    mustContain: 'treinta y seis (36) horas'
  },
  {
    label: 'Escrito de acusación',
    expect: 'MATCH',
    branch: 'PENAL',
    exactMatch: 'Escrito de acusación',
    mustContain: 'noventa (90) días'
  },
  {
    label: 'Querella',
    expect: 'MATCH',
    branch: 'PENAL',
    exactMatch: 'Querella',
    mustContain: 'seis (6) meses'
  },
  {
    label: 'Demanda de casación penal',
    expect: 'MATCH',
    branch: 'PENAL',
    exactMatch: 'Demanda de casación penal',
    mustContain: 'Treinta (30) días'
  },
  // The term is not in art. 176; it lives in arts. 178 and 179. Autos and
  // sentencias run on different clocks, and the guidance must keep them apart —
  // flattening them into one figure is how an appeal gets filed out of time.
  {
    label: 'Recurso de apelación penal',
    expect: 'MATCH',
    branch: 'PENAL',
    exactMatch: 'Recurso de apelación penal',
    mustContain: 'art. 178'
  },

  // Societario. The insolvency thresholds are the trap here: Ley 2437 de 2024
  // does not offer the abbreviated route, it imposes it below 5.000 SMMLV.
  {
    label: 'Demanda de impugnación de decisiones de asamblea o junta de socios',
    expect: 'MATCH',
    branch: 'SOCIETARIO',
    exactMatch: 'Demanda de impugnación de decisiones de asamblea o junta de socios',
    mustContain: 'Dos (2) meses'
  },
  {
    label: 'Solicitud de admisión al proceso de reorganización abreviado',
    expect: 'MATCH',
    branch: 'SOCIETARIO',
    exactMatch: 'Solicitud de admisión al proceso de reorganización abreviado',
    mustContain: 'tres (3) meses'
  },
  {
    label: 'Solicitud de admisión al proceso de reorganización',
    expect: 'MATCH',
    branch: 'SOCIETARIO',
    exactMatch: 'Solicitud de admisión al proceso de reorganización',
    mustContain: 'cuatro (4) meses'
  },
  {
    label: 'Presentación de créditos en proceso de insolvencia',
    expect: 'MATCH',
    branch: 'SOCIETARIO',
    exactMatch: 'Presentación de créditos en proceso de insolvencia',
    mustContain: 'Veinte (20) días'
  },
  {
    label: 'Ejercicio de la acción social de responsabilidad contra administradores',
    expect: 'MATCH',
    branch: 'SOCIETARIO',
    exactMatch: 'Ejercicio de la acción social de responsabilidad contra administradores',
    mustContain: 'veinte por ciento'
  },

  // Tributario. The reconsideración/per saltum pair is the trap: 2 months to
  // one forum, 4 to the other, and the second is only open when the
  // requerimiento especial was answered properly.
  {
    label: 'Recurso de reconsideración',
    expect: 'MATCH',
    branch: 'TRIBUTARIO',
    exactMatch: 'Recurso de reconsideración',
    mustContain: 'Dos (2) meses'
  },
  {
    label: 'Demanda per saltum contra liquidación oficial tributaria',
    expect: 'MATCH',
    branch: 'TRIBUTARIO',
    exactMatch: 'Demanda per saltum contra liquidación oficial tributaria',
    mustContain: 'Cuatro (4) meses'
  },
  {
    label: 'Respuesta al requerimiento especial',
    expect: 'MATCH',
    branch: 'TRIBUTARIO',
    exactMatch: 'Respuesta al requerimiento especial',
    mustContain: 'Tres (3) meses'
  },
  // Firmeza and the requerimiento window are both 3 years and count from the
  // same date; a draft that confuses them tells the taxpayer the assessment
  // closed when the DIAN can still open it.
  {
    label: 'Constancia de firmeza de la declaración privada',
    expect: 'MATCH',
    branch: 'TRIBUTARIO',
    exactMatch: 'Constancia de firmeza de la declaración privada',
    mustContain: 'seis (6) años'
  },
  {
    label: 'Liquidación oficial de revisión',
    expect: 'MATCH',
    branch: 'TRIBUTARIO',
    exactMatch: 'Liquidación oficial de revisión',
    mustContain: 'seis (6) meses'
  },
  {
    label: 'Solicitud de devolución de saldo a favor',
    expect: 'MATCH',
    branch: 'TRIBUTARIO',
    exactMatch: 'Solicitud de devolución de saldo a favor',
    mustContain: 'cincuenta (50) días'
  },

  // Tránsito. Caducidad and prescripción are the pair to keep apart: the
  // ACTION lapses at 1 year from the facts (art. 161), the imposed SANCTION
  // prescribes at 3 (art. 159). Pleading the wrong one loses a good defence.
  {
    label: 'Solicitud de caducidad de la acción contravencional de tránsito',
    expect: 'MATCH',
    branch: 'TRANSITO',
    exactMatch: 'Solicitud de caducidad de la acción contravencional de tránsito',
    mustContain: 'caduca al año'
  },
  {
    label: 'Solicitud de prescripción de la sanción de tránsito',
    expect: 'MATCH',
    branch: 'TRANSITO',
    exactMatch: 'Solicitud de prescripción de la sanción de tránsito',
    mustContain: 'Tres (3) años'
  },
  {
    label: 'Solicitud de reducción de la multa de tránsito',
    expect: 'MATCH',
    branch: 'TRANSITO',
    exactMatch: 'Solicitud de reducción de la multa de tránsito',
    mustContain: 'cinco (5) días'
  },
  {
    label: 'Comparecencia y descargos ante orden de comparendo',
    expect: 'MATCH',
    branch: 'TRANSITO',
    exactMatch: 'Comparecencia y descargos ante orden de comparendo',
    mustContain: 'treinta (30) días calendario'
  },
  // A defence that is lost by not pleading it deserves its own check.
  {
    label: 'Solicitud de silencio administrativo positivo por recurso no resuelto',
    expect: 'MATCH',
    branch: 'TRANSITO',
    exactMatch: 'Solicitud de silencio administrativo positivo por recurso no resuelto',
    mustContain: 'a favor del recurrente'
  },

  // Notarial. The notarial route only works by unanimous agreement, and it
  // dies quietly: two months of inaction is treated as withdrawal.
  {
    label: 'Solicitud de divorcio ante notario por mutuo acuerdo',
    expect: 'MATCH',
    branch: 'NOTARIAL',
    exactMatch: 'Solicitud de divorcio ante notario por mutuo acuerdo',
    mustContain: 'quince (15) días'
  },
  {
    label: 'Solicitud de liquidación de herencia ante notario',
    expect: 'MATCH',
    branch: 'NOTARIAL',
    exactMatch: 'Solicitud de liquidación de herencia ante notario',
    mustContain: 'dos (2) meses'
  },
  {
    label: 'Solicitud de registro de instrumento público',
    expect: 'MATCH',
    branch: 'NOTARIAL',
    exactMatch: 'Solicitud de registro de instrumento público',
    mustContain: 'cinco (5) días hábiles'
  },
  {
    label: 'Edicto emplazatorio en sucesión notarial',
    expect: 'MATCH',
    branch: 'NOTARIAL',
    exactMatch: 'Edicto emplazatorio en sucesión notarial',
    mustContain: 'diez (10) días'
  },
  // The term is real but BORROWED: art. 60 of Ley 1579 grants the recourse and
  // fixes no deadline; the ten days come from CPACA art. 76, reachable only
  // through the express remission in art. 22. The case asserts the remission is
  // still spelled out, because a term whose source lives in another statute is
  // the first thing an editor "tidies up" into a bare figure.
  {
    label: 'Recurso de reposición contra acto de registro',
    expect: 'MATCH',
    branch: 'NOTARIAL',
    exactMatch: 'Recurso de reposición contra acto de registro',
    mustContain: 'Contencioso Administrativo'
  },

  // Contratación estatal. The liquidación cascade is the one people miss: a
  // 4-month bilateral window, then 2 months to do it unilaterally, then two
  // years in which it can still be done.
  {
    label: 'Solicitud de liquidación bilateral del contrato estatal',
    expect: 'MATCH',
    branch: 'CONTRATACION',
    exactMatch: 'Solicitud de liquidación bilateral del contrato estatal',
    mustContain: 'cuatro (4) meses'
  },
  {
    label: 'Acto de liquidación unilateral del contrato',
    expect: 'MATCH',
    branch: 'CONTRATACION',
    exactMatch: 'Acto de liquidación unilateral del contrato',
    mustContain: 'dos (2) meses'
  },
  // Irrevocability is the fact that decides how an award is attacked at all.
  {
    label: 'Resolución de adjudicación',
    expect: 'MATCH',
    branch: 'CONTRATACION',
    exactMatch: 'Resolución de adjudicación',
    mustContain: 'IRREVOCABLE'
  },
  {
    label: 'Observaciones al informe de evaluación de propuestas',
    expect: 'MATCH',
    branch: 'CONTRATACION',
    exactMatch: 'Observaciones al informe de evaluación de propuestas',
    mustContain: 'cinco (5) días hábiles'
  },
  {
    label: 'Aviso de convocatoria pública',
    expect: 'MATCH',
    branch: 'CONTRATACION',
    exactMatch: 'Aviso de convocatoria pública',
    mustContain: 'veinte (20) días calendario'
  },

  // Internacional. The seat of the arbitration decides whether recognition is
  // needed at all — asking for it when it is not costs months, skipping it
  // when it is makes the award unenforceable.
  {
    label: 'Solicitud de ejecución de laudo internacional con sede en Colombia',
    expect: 'MATCH',
    branch: 'INTERNACIONAL',
    exactMatch: 'Solicitud de ejecución de laudo internacional con sede en Colombia',
    mustContain: 'sin necesidad de reconocimiento previo'
  },
  {
    label: 'Solicitud de reconocimiento de laudo arbitral extranjero',
    expect: 'MATCH',
    branch: 'INTERNACIONAL',
    exactMatch: 'Solicitud de reconocimiento de laudo arbitral extranjero',
    mustContain: 'veinte (20) días'
  },
  {
    label: 'Recurso de anulación de laudo arbitral internacional',
    expect: 'MATCH',
    branch: 'INTERNACIONAL',
    exactMatch: 'Recurso de anulación de laudo arbitral internacional',
    mustContain: 'mes siguiente'
  },
  {
    label: 'Demanda de exequátur de sentencia extranjera',
    expect: 'MATCH',
    branch: 'INTERNACIONAL',
    exactMatch: 'Demanda de exequátur de sentencia extranjera',
    mustContain: 'cinco (5) días'
  },
  {
    label: 'Petición individual ante la Comisión Interamericana de Derechos Humanos',
    expect: 'MATCH',
    branch: 'INTERNACIONAL',
    exactMatch: 'Petición individual ante la Comisión Interamericana de Derechos Humanos',
    mustContain: 'seis (6) meses'
  },
  {
    label: 'Memorial de defensa en trámite de extradición',
    expect: 'MATCH',
    branch: 'INTERNACIONAL',
    exactMatch: 'Memorial de defensa en trámite de extradición',
    mustContain: 'diez (10) días'
  },

  // Superintendencias. Here the one-year window is PRESCRIPCIÓN, not
  // caducidad — the opposite of tránsito. It must be pleaded, it can be
  // interrupted, and no judge may declare it on their own motion. Treating it
  // as caducidad abandons claims that are still alive.
  {
    label: 'Demanda de protección al consumidor',
    expect: 'MATCH',
    branch: 'SUPERINTENDENCIAS',
    exactMatch: 'Demanda de protección al consumidor',
    mustContain: 'prescripción y no caducidad'
  },
  {
    label: 'Reclamación directa al productor o proveedor',
    expect: 'MATCH',
    branch: 'SUPERINTENDENCIAS',
    exactMatch: 'Reclamación directa al productor o proveedor',
    mustContain: 'quince (15) días hábiles'
  },
  {
    label: 'Consulta sobre datos personales',
    expect: 'MATCH',
    branch: 'SUPERINTENDENCIAS',
    exactMatch: 'Consulta sobre datos personales',
    mustContain: 'diez (10) días hábiles'
  },
  // Filing without exhausting the prior step gets the complaint rejected.
  {
    label: 'Queja ante la SIC por protección de datos personales',
    expect: 'MATCH',
    branch: 'SUPERINTENDENCIAS',
    exactMatch: 'Queja ante la SIC por protección de datos personales',
    mustContain: 'UNA VEZ AGOTADO'
  },
  {
    label: 'Recurso de reposición ante empresa de servicios públicos',
    expect: 'MATCH',
    branch: 'SUPERINTENDENCIAS',
    exactMatch: 'Recurso de reposición ante empresa de servicios públicos',
    mustContain: 'cinco (5) días'
  },
  {
    label: 'Solicitud de silencio administrativo positivo en servicios públicos',
    expect: 'MATCH',
    branch: 'SUPERINTENDENCIAS',
    exactMatch: 'Solicitud de silencio administrativo positivo en servicios públicos',
    mustContain: 'quince (15) días hábiles'
  },

  // Secretaría. These are the acts the secretary signs in their own name, and
  // the terms they certify are what the parties' deadlines hang from.
  {
    label: 'Citación para notificación personal',
    expect: 'MATCH',
    branch: 'CIVIL',
    exactMatch: 'Citacion para notificacion personal',
    mustContain: 'treinta (30) dias'
  },
  {
    label: 'Emplazamiento y remisión al Registro Nacional de Personas Emplazadas',
    expect: 'MATCH',
    branch: 'CIVIL',
    exactMatch: 'Emplazamiento y remision al Registro Nacional de Personas Emplazadas',
    mustContain: 'quince (15) dias'
  },
  {
    label: 'Constancia de traslado en secretaría',
    expect: 'MATCH',
    branch: 'CIVIL',
    exactMatch: 'Constancia de traslado en secretaria',
    mustContain: 'tres (3) dias'
  },
  {
    label: 'Aviso de notificación',
    expect: 'MATCH',
    branch: 'CIVIL',
    exactMatch: 'Aviso de notificacion',
    mustContain: 'dia siguiente'
  },

  // Still not catalogued: must fall back rather than guess.
  { label: 'zzz documento inexistente', expect: 'NO_MATCH' },
  { label: 'de la', expect: 'NO_MATCH' }
];

let failures = 0;

for (const testCase of CASES) {
  const found = catalogService.findByDocumentType(testCase.label, testCase.branch);
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
    const guidance = buildCatalogGuidance(testCase.label, testCase.branch) ?? '';
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

// An abolished figure must never resolve, with or without a branch.
//
// Ley 1996 de 2019 art. 53 forbids initiating interdicción or inhabilitación
// proceedings, and its art. 61 repealed the matching numerals of CGP art. 22.
// The published text of CGP art. 577 still lists them among the jurisdicción
// voluntaria matters, so a model reading the code would happily draft one and
// no judge could admit it. The replacement is the adjudicación de apoyos.
const ABOLISHED = [
  'Proceso de interdicción',
  'Demanda de interdicción por discapacidad mental',
  'Solicitud de interdicción',
  'Proceso de inhabilitación'
];

for (const label of ABOLISHED) {
  const hit =
    catalogService.findByDocumentType(label) ?? catalogService.findByDocumentType(label, 'FAMILIA');

  if (hit) {
    console.error(
      `FAIL "${label}": la interdicción está prohibida (Ley 1996 de 2019, art. 53) y resolvió a "${hit.exactName}"`
    );
    failures++;
  } else {
    console.log(`ok   abolished figure not offered ("${label}")`);
  }
}

// The workspace now offers catalogued names as its document-type options, so
// every one of them must resolve back to itself when its branch is supplied.
// A name that does not is an option the lawyer can pick and get no norm for —
// which is exactly the gap that made the catalogue invisible in the UI. It also
// catches two entries inside one branch that normalise identically.
const unresolvable = catalogService
  .list()
  .filter((a) => catalogService.findByDocumentType(a.exactName, a.branch)?.id !== a.id);

if (unresolvable.length) {
  console.error(`FAIL ${unresolvable.length} actuaciones no resuelven desde su propio nombre:`);
  for (const a of unresolvable.slice(0, 5)) {
    console.error(`     ${a.branch}: ${a.exactName}`);
  }
  failures++;
} else {
  console.log(`ok   every catalogued name resolves within its branch (${catalogService.list().length})`);
}

// Secretarial work is a third of a court's output and had no role until now;
// this guards against the role silently disappearing from the catalogue.
const secretaria = catalogService.list(undefined, 'SECRETARIA');
if (secretaria.length === 0) {
  console.error('FAIL no hay actuaciones con rol SECRETARIA');
  failures++;
} else {
  console.log(`ok   secretarial role catalogued (${secretaria.length})`);
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
