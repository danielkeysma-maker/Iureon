/**
 * Ingests the shared jurisprudence corpus from `research/jurisprudencia.json`.
 *
 * Run with: npm run ingest:corpus [-- --dry]
 *
 * WHY THIS REPLACED THE SCRAPERS. Four "court scrapers" used to feed this
 * pipeline. They fetched the relatoría's index page, pulled ruling NUMBERS out
 * of the HTML with a regex, and then attached invented hechos, an invented
 * ratio decidendi, an outcome hardcoded to CONCEDIDO, and a `fullText` that was
 * a one-line template claiming to be "contenido extraído directamente del
 * sistema de la Corte Constitucional". When the network failed they fell back
 * to a hand-written list named `getOfficialIndexedDatabase` — which included
 * "Sentencia SU-049 de 2022", a providencia that does not exist.
 *
 * SYSTEM_CORPUS is read by every tenant. One invented ratio in there misleads
 * every firm at once, forever, and reads exactly like a real one.
 *
 * So this script does the opposite of guessing:
 *   - the ruling list is curated and versioned, never regex-scraped;
 *   - the TEXT is downloaded from the official URL at ingest time;
 *   - anything that cannot be fetched is SKIPPED and reported, never filled in.
 */
import { readFileSync } from 'fs';
import { fetchDocumentText } from '../modules/ingestion/documentFetch';
import { join } from 'path';
import { JurisprudenceIngestionPipeline } from '../modules/ingestion/jurisprudenceIngestion.service';
import { embeddingsService } from '../modules/embeddings/embeddings.service';
import { supabase } from '../config/supabase.config';
import type { IngestionRulingMetadata } from '../modules/ingestion/types';

interface SeedRuling {
  numeroProvidencia: string;
  corporacion: IngestionRulingMetadata['corporacion'];
  tipoSentencia: IngestionRulingMetadata['tipoSentencia'];
  rama: IngestionRulingMetadata['rama'];
  magistradoPonente: string;
  ano: number;
  /** Official page carrying the ruling text. Mandatory: no URL, no ingestion. */
  url: string;
  /** One line on what the case was about. Descriptive only — never a holding. */
  hechosClave: string;
  ratioDecidendi: string;
  resuelveOutcome: IngestionRulingMetadata['resuelveOutcome'];
}

const SEED = join(__dirname, '..', '..', '..', 'research', 'jurisprudencia.json');
const DRY = process.argv.includes('--dry');

/** Minimum characters a fetched page must yield to count as a ruling body. */
const MIN_TEXT = 2000;

/*
 * El lector de documentos vive en `modules/ingestion/documentFetch.ts`.
 *
 * Se movió allí cuando el corpus de doctrina necesitó exactamente el mismo:
 * los sitios oficiales colombianos sirven conceptos en las mismas tres formas
 * en que las relatorías sirven providencias — HTML en windows-1252, PDF y Word
 * 97 binario. Copiarlo habría dejado un segundo lector al que le faltara
 * cualquiera de estas lecciones, y la copia es la que nadie nota que está rota.
 *
 * Todas las guardas y su historia siguen documentadas en ese archivo.
 */

/**
 * Providencias already present in SYSTEM_CORPUS, by `file_name`.
 *
 * WHY THIS EXISTS. The pipeline inserts chunks; it does not upsert them, and
 * there is no unique key on (providencia, chunk_index). A second run of this
 * script therefore does not "re-ingest" a ruling — it ADDS a second copy of
 * every chunk. Duplicated chunks then compete with each other in every tenant's
 * search results, and nothing in the logs would ever say so.
 *
 * That stopped being theoretical: a first run died partway through C-355 de
 * 2006 with 20 rulings already committed. Without this check, finishing the job
 * would have meant duplicating those 20.
 *
 * Reading the corpus back is also the only honest source of truth about what is
 * in it. The log of a process that was killed is not.
 */
const fetchIngestedFileNames = async (): Promise<Set<string>> => {
  const seen = new Set<string>();

  if (!supabase) return seen;

  // Supabase caps a select at 1000 rows, and the corpus is already past that.
  // Paging is not an optimization here: without it the set comes back truncated
  // and the script silently duplicates everything beyond the first page.
  const PAGE = 1000;

  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from('document_embeddings')
      .select('file_name')
      .eq('firm_id', 'SYSTEM_CORPUS')
      .range(from, from + PAGE - 1);

    if (error) {
      throw new Error(`No se pudo leer el estado de SYSTEM_CORPUS: ${error.message}`);
    }

    if (!data || data.length === 0) break;

    data.forEach((row: { file_name: string }) => seen.add(row.file_name));

    if (data.length < PAGE) break;
  }

  return seen;
};

async function main(): Promise<void> {
  if (!embeddingsService.isAvailable()) {
    console.error('Sin proveedor de embeddings. No se ingesta nada.');
    process.exit(1);
  }

  let seed: SeedRuling[];

  try {
    seed = JSON.parse(readFileSync(SEED, 'utf8')).rulings ?? [];
  } catch (error) {
    console.error(`No se pudo leer ${SEED}: ${(error as Error).message}`);
    process.exit(1);
  }

  if (seed.length === 0) {
    console.log('El archivo semilla no tiene providencias. Nada que ingestar.');
    return;
  }

  console.log(`Proveedor: ${embeddingsService.providerName}`);
  console.log(`Semilla: ${seed.length} providencia(s)${DRY ? '  [DRY RUN]' : ''}`);

  const alreadyIngested = await fetchIngestedFileNames();

  console.log(`Ya en SYSTEM_CORPUS: ${alreadyIngested.size} providencia(s)\n`);

  let ingested = 0;
  let chunks = 0;
  let resumed = 0;
  const skipped: string[] = [];

  const pipeline = new JurisprudenceIngestionPipeline();

  for (const ruling of seed) {
    // Re-ingesting would duplicate every chunk, not replace it. Skipping is
    // what makes this script safe to run again after a crash.
    if (alreadyIngested.has(`${ruling.numeroProvidencia}.pdf`)) {
      resumed++;
      continue;
    }

    // Toda la lectura —HTTP, PDF, Word 97, charset declarado y la guarda de
    // mojibake— vive en `fetchDocumentText`. El piso de 2000 caracteres se pasa
    // desde aquí porque el cuerpo de una providencia y el de un concepto no
    // miden lo mismo, y un piso afinado para uno rechaza al otro en silencio.
    const fetched = await fetchDocumentText(ruling.url ?? '', { minText: MIN_TEXT });

    if (!fetched.ok) {
      skipped.push(`${ruling.numeroProvidencia}: ${fetched.reason}`);
      continue;
    }

    const fullText = fetched.text;

    console.log(`  ${ruling.numeroProvidencia} — ${fullText.length} caracteres`);

    if (DRY) {
      ingested++;
      continue;
    }

    const result = await pipeline.ingestRuling({
      corporacion: ruling.corporacion,
      numeroProvidencia: ruling.numeroProvidencia,
      tipoSentencia: ruling.tipoSentencia,
      rama: ruling.rama,
      magistradoPonente: ruling.magistradoPonente,
      ano: ruling.ano,
      hechosClave: ruling.hechosClave,
      ratioDecidendi: ruling.ratioDecidendi,
      resuelveOutcome: ruling.resuelveOutcome,
      pdfUrl: ruling.url,
      fullText
    });

    if (result.success) {
      ingested++;
      chunks += result.chunksIngested;
    } else {
      skipped.push(`${ruling.numeroProvidencia}: la ingesta falló`);
    }
  }

  console.log(
    `\ningestadas: ${ingested}   chunks: ${chunks}   ya estaban: ${resumed}   omitidas: ${skipped.length}`
  );

  // Skips are printed, never silent. A corpus that quietly ingested half of
  // what it was given looks identical to one that ingested everything.
  if (skipped.length) {
    console.log('\nOMITIDAS:');
    skipped.forEach((s) => console.log(`  - ${s}`));
  }
}

void main();
