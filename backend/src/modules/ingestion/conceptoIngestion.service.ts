import { supabase } from '../../config/supabase.config';
import { embeddingsService } from '../embeddings/embeddings.service';

/**
 * Ingests official conceptos into the shared corpus.
 *
 * WHY THIS IS NOT `jurisprudenceIngestion`. A providencia and a concepto are
 * different claims about the law, and the corpus has to say which is which — a
 * concepto from the DIAN binds DIAN officials and no judge at all, so serving
 * one under the same heading as a ruling would give an administrative opinion
 * judicial weight it does not have.
 *
 * THE TEXT IS DOWNLOADED, NEVER SUMMARISED INTO THE CORPUS. The research pass
 * produces two very different things for each concepto: `citaVerbatim`, which is
 * literal text from the source, and `tesis`, which is somebody's description of
 * it. Only the first is evidence. Indexing the second would put generated prose
 * into a corpus whose whole value is that it holds what the source actually
 * says, and it would be indistinguishable from the real thing at rest — the same
 * failure shape as a fabricated vector.
 *
 * So `tesis` lives in metadata as a label, and what gets embedded is text
 * fetched from the concepto itself.
 */

export interface ConceptoInput {
  entidad: string;
  numero: string;
  tipoDocumento: string;
  fecha: string;
  rama: string;
  tema: string;
  /** Someone's summary. Metadata only — never the indexed content. */
  tesis: string;
  /** Literal text from the source. This is what must appear in the download. */
  citaVerbatim: string;
  /** Who the concepto binds, with its norm. Verified once per entity. */
  bindingScope: string;
  sourceUrl: string;
  /** The full text, downloaded by the caller. Never composed here. */
  fullText: string;
}

export type ConceptoOutcome =
  | { status: 'INGESTED'; chunks: number }
  | { status: 'SKIPPED'; reason: string }
  | { status: 'FAILED'; reason: string };

/**
 * How much of the quote has to survive to count as found.
 *
 * Not 100%: an official page renders quotes with typographic dashes, non
 * breaking spaces and soft hyphens that no honest transcription preserves.
 * Comparing normalised text and requiring a long contiguous run is what
 * separates "the source says this" from "the source is about this".
 */
const MIN_QUOTE_CHARS = 40;

const normalise = (text: string): string =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[‘’“”]/g, '"')
    .replace(/[‐-―]/g, '-')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/**
 * Whether the quote the research claims is literal actually appears in the text.
 *
 * THE CHECK THAT MAKES THIS PIPELINE HONEST. Everything else here is plumbing;
 * this is the part that refuses to index a quote nobody can find at the URL it
 * cites. A concepto whose supporting sentence is not in its own source is
 * exactly the defect this project spent a day removing from the catalogue —
 * a real-looking citation that no one had opened.
 *
 * Returns the reason it failed, or null when the quote is there.
 */
export const quoteIsInSource = (citaVerbatim: string, fullText: string): string | null => {
  const quote = normalise(citaVerbatim.replace(/^["'“]|["'”]$/g, ''));
  const haystack = normalise(fullText);

  if (quote.length < MIN_QUOTE_CHARS) {
    return `la cita tiene ${quote.length} caracteres útiles; hacen falta ${MIN_QUOTE_CHARS}`;
  }

  if (haystack.includes(quote)) return null;

  // A quote may legitimately span an elision. Require a long contiguous run of
  // it to be present rather than accepting scattered words.
  const head = quote.slice(0, MIN_QUOTE_CHARS);
  if (haystack.includes(head)) return null;

  return 'la cita no aparece en el texto descargado de su propia fuente';
};

const chunkText = (text: string, size: number): string[] => {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= size) return clean ? [clean] : [];

  const overlap = 200;
  const chunks: string[] = [];

  for (let start = 0; start < clean.length; start += size - overlap) {
    chunks.push(clean.slice(start, start + size));
    if (start + size >= clean.length) break;
  }

  return chunks;
};

export class ConceptoIngestionPipeline {
  /** Conceptos already in SYSTEM_CORPUS, by file_name, so a rerun never duplicates. */
  public async ingestedFileNames(): Promise<Set<string>> {
    const seen = new Set<string>();
    if (!supabase) return seen;

    // Supabase truncates a select at 1000 rows. Without paging the set comes
    // back short and the rerun duplicates everything past the first page —
    // which is how the jurisprudence corpus nearly got a second copy of itself.
    const PAGE = 1000;

    for (let from = 0; ; from += PAGE) {
      const { data, error } = await supabase
        .from('document_embeddings')
        .select('file_name')
        .eq('firm_id', 'SYSTEM_CORPUS')
        .range(from, from + PAGE - 1);

      if (error) throw new Error(`No se pudo leer SYSTEM_CORPUS: ${error.message}`);
      if (!data || data.length === 0) break;

      (data as Array<{ file_name: string }>).forEach((row) => seen.add(row.file_name));
      if (data.length < PAGE) break;
    }

    return seen;
  }

  public fileNameFor(concepto: Pick<ConceptoInput, 'entidad' | 'numero'>): string {
    const slug = `${concepto.entidad}-${concepto.numero}`
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase();

    return `concepto-${slug}.txt`;
  }

  public async ingest(concepto: ConceptoInput): Promise<ConceptoOutcome> {
    if (!supabase) return { status: 'FAILED', reason: 'Supabase no está configurado' };

    if (!embeddingsService.isAvailable()) {
      // Never a mock vector. An invented embedding indexes identically to a real
      // one and returns confident nonsense for ever.
      return { status: 'FAILED', reason: 'sin proveedor de embeddings' };
    }

    const problema = quoteIsInSource(concepto.citaVerbatim, concepto.fullText);
    if (problema) return { status: 'SKIPPED', reason: problema };

    const chunks = chunkText(concepto.fullText, 2500);
    if (chunks.length === 0) return { status: 'SKIPPED', reason: 'texto vacío' };

    const encabezado =
      `[TIPO: CONCEPTO] [ENTIDAD: ${concepto.entidad}] [NÚMERO: ${concepto.numero}] ` +
      `[FECHA: ${concepto.fecha}] [TEMA: ${concepto.tema}]\n` +
      `ALCANCE: ${concepto.bindingScope}\n\n`;

    const conEncabezado = chunks.map((chunk) => encabezado + chunk);
    const vectors = await embeddingsService.embedAll(conEncabezado);

    if (vectors.length !== conEncabezado.length) {
      return { status: 'FAILED', reason: 'el proveedor devolvió menos vectores que chunks' };
    }

    const fileName = this.fileNameFor(concepto);

    for (const [index, chunk] of conEncabezado.entries()) {
      const { error } = await supabase.from('document_embeddings').insert({
        firm_id: 'SYSTEM_CORPUS',
        branch: concepto.rama,
        file_name: fileName,
        content_chunk: chunk,
        embedding: vectors[index],
        chunk_index: index,
        metadata: {
          // The field the whole doctrine engine turns on. Without it the search
          // layer reads the row as jurisprudence and a lawyer sees an
          // administrative opinion sitting among court rulings.
          sourceKind: 'CONCEPTO',
          entidad: concepto.entidad,
          bindingScope: concepto.bindingScope,
          providencia: concepto.numero,
          tipoDocumento: concepto.tipoDocumento,
          fecha: concepto.fecha,
          tema: concepto.tema,
          tesis: concepto.tesis,
          citaVerbatim: concepto.citaVerbatim,
          sourceUrl: concepto.sourceUrl
        }
      });

      // Surfaced, not swallowed: a corpus that silently fails to grow looks
      // exactly like one nobody has fed.
      if (error) {
        return { status: 'FAILED', reason: `insert falló en chunk ${index}: ${error.message}` };
      }
    }

    return { status: 'INGESTED', chunks: conEncabezado.length };
  }
}

export const conceptoIngestion = new ConceptoIngestionPipeline();
