/**
 * Ingests the official conceptos into SYSTEM_CORPUS.
 *
 *   npx ts-node --transpile-only src/scripts/ingestConceptos.ts [--dry]
 *
 * Reads every `research/conceptos-*.json` produced by a verification pass,
 * downloads each concepto from its own official URL, and refuses any whose
 * supporting quote is not actually there.
 *
 * WHY THE TEXT IS FETCHED RATHER THAN TAKEN FROM THE FILE. The research pass
 * writes a `tesis` — somebody's description of what the concepto says — and a
 * `cita_verbatim`, which claims to be literal. Only the second is evidence, and
 * only the source can confirm it. Embedding the description would put generated
 * prose into a corpus whose entire value is holding what the source actually
 * says, and at rest the two are indistinguishable.
 *
 * Resumable by design: file names already in SYSTEM_CORPUS are skipped, because
 * this pipeline inserts chunks rather than upserting them. A second run without
 * that check does not re-ingest a concepto — it adds a second copy of every
 * chunk, and duplicated chunks then compete with each other in every tenant's
 * search with nothing in the logs to say so.
 */
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import {
  conceptoIngestion,
  quoteIsInSource,
  type ConceptoInput
} from '../modules/ingestion/conceptoIngestion.service';
import { fetchDocumentText } from '../modules/ingestion/documentFetch';

const RESEARCH = join(__dirname, '..', '..', '..', 'research');
const DRY = process.argv.includes('--dry');

/** A concepto is far shorter than a ruling; the ruling floor would reject them all. */
const MIN_TEXT = 600;

interface ConceptoSeed {
  numero: string;
  tipo_documento: string;
  fecha: string;
  rama: string;
  tema: string;
  pregunta: string;
  tesis: string;
  cita_verbatim: string;
  vigente: boolean;
  source_url: string;
}

interface EntidadSeed {
  entidad: string;
  conceptos: ConceptoSeed[];
}

/**
 * The branch a concepto is filed under must be one the catalogue knows.
 *
 * The research returned `LABORAL_ADMINISTRATIVO` for Función Pública, which is
 * an accurate description of the subject and not a branch of this product. A
 * row filed under a branch no selector offers is invisible: it sits in the
 * corpus, matches nothing a user can ask for, and looks like an ingestion that
 * worked.
 */
const BRANCH_ALIASES: Record<string, string> = {
  LABORAL_ADMINISTRATIVO: 'LABORAL'
};

const readSeeds = (): EntidadSeed[] =>
  readdirSync(RESEARCH)
    .filter((name) => name.startsWith('conceptos-') && name.endsWith('.json') && name !== 'conceptos-alcance.json')
    .map((name) => JSON.parse(readFileSync(join(RESEARCH, name), 'utf8')) as EntidadSeed)
    .filter((seed) => Array.isArray(seed.conceptos));

/**
 * Two files name the same entity and must agree, so neither spelling decides.
 *
 * `conceptos-alcance.json` wrote "Departamento Administrativo de la Funcion
 * Publica" and the seed wrote "Función Pública". Matched as display strings,
 * two accents silently dropped eleven verified conceptos into the skipped list,
 * under a message that read like a missing verification rather than a typo.
 */
const entityKey = (name: string): string =>
  name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/**
 * Names that mean the same legal person as one whose scope was verified.
 *
 * The SIC's conceptos are signed by its "Oficina Asesora Jurídica", which is an
 * office inside the Superintendencia and not another entity: the scope verified
 * for the SIC — CPACA art. 28, non-binding — is exactly the scope of what that
 * office issues. Matched literally, seven verified conceptos were dropped with
 * a message saying nobody had checked who they bind, which was false.
 *
 * Kept explicit rather than solved by prefix-matching. A rule that quietly
 * accepts any longer name would also accept a genuinely different body whose
 * conceptos carry a different weight, and that is the one mistake this whole
 * module exists to prevent.
 */
const ENTITY_ALIASES: Record<string, string> = {
  'superintendencia de industria y comercio sic oficina asesora juridica':
    'superintendencia de industria y comercio sic'
};

/** Who each entity's conceptos bind, verified once and read from disk. */
const readBindingScopes = (): Map<string, string> => {
  const path = join(RESEARCH, 'conceptos-alcance.json');
  const data = JSON.parse(readFileSync(path, 'utf8')) as {
    entidades: Array<{ entidad: string; apta_para_el_corpus: boolean; obliga_a: string }>;
  };

  return new Map(
    data.entidades
      .filter((e) => e.apta_para_el_corpus)
      .map((e) => [entityKey(e.entidad), e.obliga_a])
  );
};

async function main(): Promise<void> {
  const scopes = readBindingScopes();
  const seeds = readSeeds();
  const already = DRY ? new Set<string>() : await conceptoIngestion.ingestedFileNames();

  console.log(`Entidades con alcance verificado: ${scopes.size}`);
  console.log(`Archivos de conceptos: ${seeds.length}`);
  console.log(`Ya en SYSTEM_CORPUS: ${already.size} documento(s)\n`);

  let ingested = 0;
  const skipped: string[] = [];

  for (const seed of seeds) {
    // An entity whose binding scope was never verified does not enter, however
    // good its doctrine: a concepto that cannot say who it binds is an opinion
    // wearing the corpus's authority.
    const clave = entityKey(seed.entidad);
    const bindingScope = scopes.get(ENTITY_ALIASES[clave] ?? clave);

    if (!bindingScope) {
      skipped.push(`${seed.entidad}: sin alcance verificado en conceptos-alcance.json (${seed.conceptos.length} conceptos)`);
      continue;
    }

    for (const c of seed.conceptos) {
      const etiqueta = `${seed.entidad} · ${c.numero}`;

      if (!c.vigente) {
        skipped.push(`${etiqueta}: no declarado vigente`);
        continue;
      }

      const fileName = conceptoIngestion.fileNameFor({ entidad: seed.entidad, numero: c.numero });

      if (already.has(fileName)) {
        console.log(`  = ${etiqueta} (ya estaba)`);
        continue;
      }

      const fetched = await fetchDocumentText(c.source_url, { minText: MIN_TEXT });

      if (!fetched.ok) {
        skipped.push(`${etiqueta}: ${fetched.reason}`);
        continue;
      }

      const rama = BRANCH_ALIASES[c.rama] ?? c.rama;

      const input: ConceptoInput = {
        entidad: seed.entidad,
        numero: c.numero,
        tipoDocumento: c.tipo_documento,
        fecha: c.fecha,
        rama,
        tema: c.tema,
        tesis: c.tesis,
        citaVerbatim: c.cita_verbatim,
        bindingScope,
        sourceUrl: c.source_url,
        fullText: fetched.text
      };

      if (DRY) {
        // Even a dry run checks the quote: it is the whole point, and finding
        // out at ingestion time that a citation is unfindable is too late to be
        // useful for deciding whether the research pass was any good.
        const problema = quoteIsInSource(c.cita_verbatim, fetched.text);

        if (problema) {
          skipped.push(`${etiqueta}: ${problema}`);
        } else {
          console.log(`  ✓ ${etiqueta} — cita verificada en su fuente (${fetched.text.length} chars)`);
          ingested++;
        }
        continue;
      }

      const outcome = await conceptoIngestion.ingest(input);

      if (outcome.status === 'INGESTED') {
        console.log(`  + ${etiqueta} (${outcome.chunks} chunks)`);
        ingested++;
      } else {
        skipped.push(`${etiqueta}: ${outcome.reason}`);
      }
    }
  }

  console.log(`\n${DRY ? 'Verificados' : 'Ingestados'}: ${ingested}`);

  if (skipped.length > 0) {
    // Listed, never counted and forgotten. A corpus that quietly drops what it
    // could not read is indistinguishable from one that had less to read.
    console.log(`\nNo entraron (${skipped.length}):`);
    skipped.forEach((line) => console.log(`  - ${line}`));
  }

  if (DRY) console.log('\n--dry: no se escribió nada.');
}

main().catch((error) => {
  console.error('Falló la ingesta de conceptos:', error);
  process.exit(1);
});
