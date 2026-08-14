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
import { join } from 'path';
import { JurisprudenceIngestionPipeline } from '../modules/ingestion/jurisprudenceIngestion.service';
import { embeddingsService } from '../modules/embeddings/embeddings.service';
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
  console.log(`Semilla: ${seed.length} providencia(s)${DRY ? '  [DRY RUN]' : ''}\n`);

  let ingested = 0;
  let chunks = 0;
  const skipped: string[] = [];

  const pipeline = new JurisprudenceIngestionPipeline();

  for (const ruling of seed) {
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

      fullText = extractText(await response.text());
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

  console.log(`\ningestadas: ${ingested}   chunks: ${chunks}   omitidas: ${skipped.length}`);

  // Skips are printed, never silent. A corpus that quietly ingested half of
  // what it was given looks identical to one that ingested everything.
  if (skipped.length) {
    console.log('\nOMITIDAS:');
    skipped.forEach((s) => console.log(`  - ${s}`));
  }
}

void main();
