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
const RULING = /\b(SU|T|C|SL|SC|SP|CE)-\s?\d{2,4}\s?-\s?\d{2,4}\b/;

/**
 * Comments are prose. The first version only skipped lines that BEGIN with a
 * comment marker, so a trailing `// ej: SL-4102-2023` on a type declaration
 * tripped it — punishing the documentation of the very defect being guarded.
 * Strip the comment tail and test what is left.
 */
const withoutComments = (line: string): string =>
  line.replace(/\/\*.*?\*\//g, '').replace(/\/\/.*$/, '');
const isComment = (line: string): boolean => /^\s*(\/\/|\*|\/\*)/.test(line);

const scanned = [
  join(REPO, 'backend', 'src', 'modules', 'search'),
  join(REPO, 'backend', 'src', 'modules', 'ingestion'),
  join(REPO, 'frontend', 'src', 'modules', 'search'),
  join(REPO, 'frontend', 'src', 'modules', 'precedents')
].flatMap(walk);

const offenders = scanned.flatMap((file) =>
  readFileSync(file, 'utf8')
    .split('\n')
    .map((text, i) => ({ file, line: i + 1, text }))
    .filter((row) => !isComment(row.text) && RULING.test(withoutComments(row.text)))
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
