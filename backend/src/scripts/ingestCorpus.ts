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
import { PDFParse } from 'pdf-parse';
import WordExtractor from 'word-extractor';
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

/**
 * A length floor alone is not enough, and that was a real hole here.
 *
 * The Consejo de Estado serves rulings from `/uploads/sun/` as binary Word
 * files. Running an HTML tag-stripper over one produces thousands of characters
 * of compression noise — it sails past MIN_TEXT and lands in the corpus as if
 * it were the providencia. The gate has to check that what came back is TEXT,
 * not merely that there is a lot of it.
 */
/**
 * OLE compound-file signature — the container Word 97 `.doc` files live in.
 *
 * The Corte Suprema publishes a good part of its casación civil and penal this
 * way. Those rulings are not reachable as HTML or PDF at all, so without this
 * branch the corpus simply has a hole where they should be.
 *
 * Note what this is NOT: converting the file to PDF first. Anything able to
 * render a .doc into a PDF can already read its text, so the PDF step only adds
 * a layout pass whose page furniture — headers, footers, page numbers — comes
 * back interleaved into the prose we are about to chunk.
 */
const OLE_SIGNATURE = Buffer.from([0xd0, 0xcf, 0x11, 0xe0]);

const looksBinary = (raw: string): boolean => {
  if (raw.startsWith('%PDF') || raw.startsWith('PK')) return true;
  // Word 97 compound-file signature.
  if (raw.charCodeAt(0) === 0xd0 && raw.charCodeAt(1) === 0xcf) return true;

  const sample = raw.slice(0, 4000);
  let control = 0;
  for (let i = 0; i < sample.length; i++) {
    const code = sample.charCodeAt(i);
    if (code === 0 || (code < 9) || (code > 13 && code < 32) || code === 0xfffd) control++;
  }
  return control / Math.max(sample.length, 1) > 0.05;
};

/**
 * Pulls readable text out of a relatoría page. Deliberately conservative: if
 * the result is too short the caller refuses the ruling rather than indexing a
 * navigation menu as if it were a holding.
 */
const extractText = (html: string): string =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&aacute;/g, 'á')
    .replace(/&eacute;/g, 'é')
    .replace(/&iacute;/g, 'í')
    .replace(/&oacute;/g, 'ó')
    .replace(/&uacute;/g, 'ú')
    .replace(/&ntilde;/g, 'ñ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

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

    if (!/^https?:\/\//.test(ruling.url ?? '')) {
      skipped.push(`${ruling.numeroProvidencia}: sin URL http(s)`);
      continue;
    }

    let fullText: string;

    try {
      const response = await fetch(ruling.url, {
        headers: { 'User-Agent': 'IureonLegalTechBot/1.0 (+https://iureon.co)' }
      });

      if (!response.ok) {
        skipped.push(`${ruling.numeroProvidencia}: HTTP ${response.status}`);
        continue;
      }

      // A 200 proves nothing. The Corte Constitucional's relatoría answers 200
      // with 32 characters for ruling numbers that do not exist — byte for byte
      // the same response a deliberately fake number gets. So the body decides,
      // not the status.
      const contentType = response.headers.get('content-type') ?? '';
      const buffer = Buffer.from(await response.arrayBuffer());
      const isPdf = /application\/pdf/i.test(contentType) || buffer.subarray(0, 4).toString() === '%PDF';

      if (isPdf) {
        // The Corte Suprema publishes casación as PDF: half this corpus is
        // unreachable without reading them. Parsing beats the alternative of
        // silently indexing only the courts that happen to serve HTML.
        try {
          const parser = new PDFParse({ data: buffer });
          try {
            fullText = (await parser.getText()).text.replace(/\s+/g, ' ').trim();
          } finally {
            await parser.destroy();
          }
        } catch (error) {
          skipped.push(`${ruling.numeroProvidencia}: PDF ilegible (${(error as Error).message})`);
          continue;
        }
      } else if (buffer.subarray(0, 4).equals(OLE_SIGNATURE)) {
        // Read straight out of the OLE `WordDocument` stream. One conversion,
        // no external binary, and it runs on a server — unlike automating Word.
        try {
          fullText = (await new WordExtractor().extract(buffer))
            .getBody()
            .replace(/\s+/g, ' ')
            .trim();
        } catch (error) {
          skipped.push(`${ruling.numeroProvidencia}: .doc ilegible (${(error as Error).message})`);
          continue;
        }
      } else {
        const raw = buffer.toString('utf8');

        if (looksBinary(raw)) {
          // PDF and Word 97 are handled above, so whatever this is, we have no
          // reader for it. Running the HTML stripper over a binary yields
          // thousands of characters of noise that sail past MIN_TEXT and land in
          // the corpus looking like prose — the failure that has to stay loud.
          skipped.push(
            `${ruling.numeroProvidencia}: binario sin lector (ni PDF ni Word 97); extraerlo daría ruido con apariencia de texto`
          );
          continue;
        }

        fullText = extractText(raw);
      }
    } catch (error) {
      skipped.push(`${ruling.numeroProvidencia}: ${(error as Error).message}`);
      continue;
    }

    // A page that yields almost nothing is a redirect, a login wall or a menu.
    // Indexing it would put the site's navigation into the corpus under a
    // providencia's name.
    if (fullText.length < MIN_TEXT) {
      skipped.push(
        `${ruling.numeroProvidencia}: la página rindió ${fullText.length} caracteres (mínimo ${MIN_TEXT})`
      );
      continue;
    }

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
