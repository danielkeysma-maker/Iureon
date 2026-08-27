import { supabase } from '../../config/supabase.config';
import { embeddingsService } from '../embeddings/embeddings.service';
import { fetchOfficialRuling } from './officialRuling.service';
import type { OfficialRuling } from './officialRuling.service';

/**
 * Puts a ruling the corpus lacked into the corpus, without pretending it was
 * curated.
 *
 * WHAT SEPARATES THIS FROM THE CURATED PIPELINE, AND WHY IT MATTERS. The 62
 * providencias in SYSTEM_CORPUS carry `hechosClave` and `ratioDecidendi`
 * written by a person who read each one. A ruling discovered by a search has
 * neither, and there are only two ways to fill them: leave them empty, or have
 * a model write them.
 *
 * Having a model write them is the defect this codebase spent a day removing
 * from a different corpus. A generated ratio would sit in the same table as one
 * a lawyer wrote, embed identically, and be indistinguishable at rest — while
 * being an opinion about what a ruling holds, which is the single most
 * consequential sentence anyone writes about a providencia.
 *
 * So they stay empty and the row says `curado: false`. What gets indexed is the
 * text the relatoría served, nothing else. A search can then tell a lawyer that
 * this one arrived automatically and nobody has read it yet — which is true,
 * useful, and the opposite of quietly promoting it.
 */

/** The chunk size the curated corpus uses. Mixing sizes skews similarity. */
const CHUNK_CHARS = 2500;
const CHUNK_OVERLAP = 200;

/**
  * Todo lo que profiere la Corte Constitucional es materia constitucional.
 *
 * El registro del Estado guarda el TIPO DE PROCESO — tutela, demanda de
 * inconstitucionalidad, ley aprobatoria de tratado — que no es una rama del
 * derecho. Deducir de ahi una rama distinta seria adivinar, y archivar una
 * sentencia bajo la rama equivocada la esconde del abogado que la necesita
 * mientras parece una ingesta que funciono.
 *
 * Esta constante existe para que se lea como decision y no como omision: el
 * dia que entren sentencias de otra corporacion, aqui hay que pensar.
 */
const BRANCH = 'CONSTITUCIONAL';

const fileNameFor = (citation: string): string =>
  `auto-${citation.replace(/[^A-Za-z0-9]+/g, '-').toLowerCase()}.txt`;

const chunkText = (text: string): string[] => {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= CHUNK_CHARS) return clean ? [clean] : [];

  const chunks: string[] = [];
  for (let start = 0; start < clean.length; start += CHUNK_CHARS - CHUNK_OVERLAP) {
    chunks.push(clean.slice(start, start + CHUNK_CHARS));
    if (start + CHUNK_CHARS >= clean.length) break;
  }
  return chunks;
};

export type AutoIngestOutcome =
  | { citation: string; status: 'INDEXED'; chunks: number }
  | { citation: string; status: 'ALREADY'; chunks: 0 }
  | { citation: string; status: 'SKIPPED'; reason: string };

const alreadyIndexed = async (fileName: string): Promise<boolean> => {
  if (!supabase) return false;

  const { data } = await supabase
    .from('document_embeddings')
    .select('id')
    .eq('firm_id', 'SYSTEM_CORPUS')
    .eq('file_name', fileName)
    .limit(1);

  return (data ?? []).length > 0;
};

const indexRuling = async (ruling: OfficialRuling): Promise<AutoIngestOutcome> => {
  const fileName = fileNameFor(ruling.citation);

  // This pipeline inserts rather than upserts, so a second pass without this
  // check does not re-index a ruling — it adds a second copy of every chunk,
  // and duplicates then compete with each other in every tenant's search.
  if (await alreadyIndexed(fileName)) {
    return { citation: ruling.citation, status: 'ALREADY', chunks: 0 };
  }

  if (!embeddingsService.isAvailable()) {
    // Never a synthesised vector: an invented embedding indexes exactly like a
    // real one and returns confident nonsense for ever.
    return { citation: ruling.citation, status: 'SKIPPED', reason: 'sin proveedor de embeddings' };
  }

  const chunks = chunkText(ruling.text);
  if (chunks.length === 0) {
    return { citation: ruling.citation, status: 'SKIPPED', reason: 'texto vacío' };
  }

  // The header carries only what the official register recorded. No summary,
  // no ratio, nothing anybody would have had to write.
  const header =
    `[CORPORACIÓN: CORTE_CONSTITUCIONAL] [TIPO: ${ruling.tipo}] ` +
    `[PROVIDENCIA: ${ruling.citation}] [PONENTE: ${ruling.magistrado}] ` +
    `[PROCESO: ${ruling.proceso}] [FECHA: ${ruling.fecha}]\n\n`;

  const withHeader = chunks.map((c) => header + c);
  const vectors = await embeddingsService.embedAll(withHeader);

  if (vectors.length !== withHeader.length) {
    return {
      citation: ruling.citation,
      status: 'SKIPPED',
      reason: 'el proveedor devolvió menos vectores que chunks'
    };
  }

  for (const [index, chunk] of withHeader.entries()) {
    const { error } = await supabase!.from('document_embeddings').insert({
      firm_id: 'SYSTEM_CORPUS',
      branch: BRANCH,
      file_name: fileName,
      content_chunk: chunk,
      embedding: vectors[index],
      chunk_index: index,
      metadata: {
        sourceKind: 'JURISPRUDENCIA',
        providencia: ruling.citation,
        corporacion: 'CORTE_CONSTITUCIONAL',
        tipoSentencia: ruling.tipo,
        magistradoPonente: ruling.magistrado,
        fecha: ruling.fecha,
        proceso: ruling.proceso,
        sourceUrl: ruling.sourceUrl,
        /*
         * The field that keeps this honest. A curated entry carries a ratio a
         * lawyer wrote after reading; this one carries the text and nothing
         * else, and the search says so rather than letting it pass for the
         * same thing.
         */
        curado: false,
        ingestadoPor: 'DESCUBRIMIENTO_AUTOMATICO'
      }
    });

    if (error) {
      return {
        citation: ruling.citation,
        status: 'SKIPPED',
        reason: `insert falló en chunk ${index}: ${error.message}`
      };
    }
  }

  return { citation: ruling.citation, status: 'INDEXED', chunks: withHeader.length };
};

/**
 * Indexes rulings named by citation, re-fetching each from the official source.
 *
 * THE TEXT IS FETCHED AGAIN RATHER THAN SENT FROM THE BROWSER, and the extra
 * download is the price of not trusting the client. A browser that supplies the
 * text of a ruling is a browser that decides what a ruling says — the same
 * shape as one that names its own credit balance. The citation is the only
 * thing it gets to choose, and even that the Court's register has to confirm.
 */
export const autoIngest = async (citations: string[]): Promise<AutoIngestOutcome[]> => {
  const results: AutoIngestOutcome[] = [];

  for (const cita of citations) {
    const outcome = await fetchOfficialRuling(cita);

    if (outcome.status !== 'FOUND') {
      results.push({ citation: cita, status: 'SKIPPED', reason: outcome.reason });
      continue;
    }

    results.push(await indexRuling(outcome.ruling));
  }

  return results;
};
