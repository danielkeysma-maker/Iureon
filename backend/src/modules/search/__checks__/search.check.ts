/**
 * Guards the rule this module was rewritten for: no fabricated law, ever.
 *
 * Run with: npm run check:search
 *
 * On 2026-08-14 the product shipped seventeen rulings written by hand in
 * `SearchView.tsx`, three more in `search.service.ts` and five in the glossary
 * modal. They carried magistrado ponente, a citation string ready to paste
 * into a brief, and `fullText` with CONSIDERANDO and RESUELVE composed in the
 * component. One cited "SU-049 de 2022", which does not exist — the real
 * unification on estabilidad laboral reforzada is SU-049 de 2017.
 *
 * That defect is the twin of the fabricated embeddings: it looks exactly like
 * the real thing, and the doctrine around it read correctly enough that nobody
 * checked the number. These checks fail loudly if it comes back.
 */
import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import { LegalSearchService } from '../search.service';

let failures = 0;
const fail = (message: string): void => {
  console.error(`FAIL ${message}`);
  failures++;
};
const pass = (message: string): void => console.log(`ok   ${message}`);

const REPO = join(__dirname, '..', '..', '..', '..', '..');

const walk = (dir: string): string[] => {
  try {
    return readdirSync(dir).flatMap((entry) => {
      const full = join(dir, entry);
      if (entry === 'node_modules' || entry === 'dist') return [];
      if (statSync(full).isDirectory()) return walk(full);
      return /\.(ts|tsx)$/.test(full) ? [full] : [];
    });
  } catch {
    return [];
  }
};

// ---------------------------------------------------------------------------
// 1. No source file may hardcode a ruling citation.
// ---------------------------------------------------------------------------
// Matches the hyphenated docket form a fabricated card uses — SU-049-2022,
// T-238-2023, SL-4102-2023 — which is how these were written. The catalogue's
// own data is excluded: its entries cite rulings that WERE read in the source,
// and they are generated from research/, not typed into a component.
// Both separators, because only the hyphen was matched before and the two
// citations that survived longest were written with a slash: `SU-049/22` in the
// Herramientas glossary and `SU-049/2022` in the drafting data. A pattern that
// catches one spelling of a defect declares the other one clean.
const RULING = /\b(SU|T|C|SL|SC|SP|CE)-\s?\d{2,4}\s?[-/]\s?\d{2,4}\b/;

/**
 * Comments are prose. The first version only skipped lines that BEGIN with a
 * comment marker, so a trailing `// ej: SL-4102-2023` on a type declaration
 * tripped it — punishing the documentation of the very defect being guarded.
 * Strip the comment tail and test what is left.
 */
const withoutComments = (line: string): string =>
  // The trailing \r goes first, and that is not cosmetic. On a CRLF checkout —
  // every Windows clone of this repo — `//.*$` matched nothing at all: `.` never
  // matches a carriage return and `$` will not sit before one, so the comment
  // survived and this check failed on a line that merely DOCUMENTS the format it
  // guards. A gate that fires for a reason unrelated to the defect is worse than
  // no gate: it teaches everyone that red means "line endings again".
  line
    .replace(/\r$/, '')
    .replace(/\/\*.*?\*\//g, '')
    .replace(/\/\/.*$/, '');
const isComment = (line: string): boolean => /^\s*(\/\/|\*|\/\*)/.test(line);

/**
 * Every module, not just the one the defect was found in.
 *
 * This list used to name four directories — search and ingestion — and that is
 * precisely how "SU-049 de 2022" survived being deleted. It was cleaned out of
 * the search module and went on living in two places nobody scanned: the
 * Herramientas glossary, which showed it as an "ejemplo en escrito procesal"
 * ready to paste into a brief, and agent/data/jurisprudence.ts, which fed it to
 * the drafting model as authority. Scoping a gate to the crime scene declares
 * the rest of the city safe.
 *
 * The catalogue's generated data is the one exclusion, and it is earned: its
 * entries cite rulings that were read at the source, and they are built from
 * research/ by a script rather than typed into a component.
 */
const scanned = [join(REPO, 'backend', 'src', 'modules'), join(REPO, 'frontend', 'src', 'modules')]
  .flatMap(walk)
  .filter((file) => !file.includes(join('catalog', 'data')));

/**
 * Citations allowed to appear in source, each one opened at the relatoría.
 *
 * The rule this check enforces is "no UNVERIFIED ruling in the source", and the
 * honest way to keep it strict is to record the exceptions rather than stop
 * looking at whole directories — the scoping that let SU-049 de 2022 survive in
 * two modules after being deleted from a third.
 *
 * These four are doctrinal references inside document templates and the
 * glossary, not fabricated data, and each was confirmed on 2026-08-15 by
 * fetching its page and checking the document carries its own docket. That test
 * matters: the relatoría answers 200 for a providencia that does not exist,
 * returning the site shell — 5,513 characters of fonts and navigation — so a
 * length threshold would have called the fake one real. SU-049 de 2022 was used
 * as the control and correctly failed.
 *
 *   C-590 de 2005   /relatoria/2005/C-590-05.htm   (also in the verified corpus)
 *   SU-813 de 2007  /relatoria/2007/SU813-07.htm
 *   SU-556 de 2014  /relatoria/2014/SU556-14.htm
 *   C-327 de 2016   /relatoria/2016/C-327-16.htm
 *
 * Adding a line here means opening the ruling first. It is not a place to put
 * something the gate found inconvenient.
 */
const VERIFIED = /\b(C-590\/2005|SU-813\/2007|SU-556\/2014|C-327\/16)\b/g;

const offenders = scanned.flatMap((file) =>
  readFileSync(file, 'utf8')
    .split('\n')
    .map((text, i) => ({ file, line: i + 1, text }))
    .filter(
      (row) =>
        !isComment(row.text) &&
        RULING.test(withoutComments(row.text).replace(VERIFIED, ''))
    )
);

if (offenders.length) {
  fail(`${offenders.length} línea(s) traen una cita de providencia escrita a mano:`);
  for (const o of offenders.slice(0, 8)) {
    console.error(`     ${o.file.replace(REPO, '.')}:${o.line}  ${o.text.trim().slice(0, 100)}`);
  }
} else {
  pass('no component or service hardcodes a ruling citation');
}

if (scanned.length === 0) {
  fail('el escaneo no encontró archivos: la ruta del repo cambió y el guardia quedó ciego');
} else {
  pass(`scanned ${scanned.length} source files`);
}

// ---------------------------------------------------------------------------
// 2. The glossary only offers terms that were verified.
// ---------------------------------------------------------------------------
const service = new LegalSearchService();
const glossary = service.getGlossaryTerms();

if (glossary.status !== 'OK' || glossary.items.length === 0) {
  fail(`el glosario devolvió ${glossary.status} con ${glossary.items.length} términos`);
} else {
  pass(`glossary serves ${glossary.items.length} catalogued terms`);
}

const withoutDefinition = glossary.items.filter((item) => !item.definition?.trim());
if (withoutDefinition.length) {
  fail(`${withoutDefinition.length} término(s) sin definición: un término vacío no es un término`);
} else {
  pass('every glossary term carries its wording');
}

// ---------------------------------------------------------------------------
// 3. A term with no source is not offered. This is the catalogue's rule and it
//    has to survive the trip through the search layer.
// ---------------------------------------------------------------------------
const withoutSource = glossary.items.filter((item) => !/^https?:\/\//.test(item.sourceUrl ?? ''));
if (withoutSource.length) {
  fail(
    `${withoutSource.length} término(s) sin fuente http(s), p. ej. "${withoutSource[0].term}": un término sin fuente no se puede verificar`
  );
} else {
  pass('every glossary term carries an http(s) source');
}

// ---------------------------------------------------------------------------
// 4. Searching for nonsense returns EMPTY, never a consolation result.
// ---------------------------------------------------------------------------
const nonsense = service.searchLegalDatabase('qwertyuiop asdfghjkl');

if (nonsense.status === 'EMPTY' && nonsense.items.length === 0 && nonsense.reason) {
  pass('an unmatched query answers EMPTY with a reason, not with filler');
} else {
  fail(`una consulta sin coincidencias devolvió ${nonsense.status} con ${nonsense.items.length} ítems`);
}

console.log(failures === 0 ? '\nALL CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
