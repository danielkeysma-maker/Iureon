import { vectorSearchService, type VectorMatch } from '../search/vectorSearch.service';
import type { TranscriptSegment } from '../transcription/types';

/**
 * Jurisprudence the corpus offers for what a client actually said.
 *
 * WHY THE CLIENT'S WORDS AND NOT THE WHOLE TRANSCRIPT. An interview is mostly
 * the lawyer: greetings, questions, explanations of procedure. Searching all of
 * it retrieves precedent for the lawyer's own vocabulary, which is circular —
 * the corpus would answer the questions rather than the facts. The facts are in
 * what the client narrates, so that is what gets searched.
 *
 * WHY IT SUGGESTS AND NEVER CONCLUDES. This is vector similarity over a
 * conversation, and a similar paragraph is not an applicable precedent: the
 * facts may rhyme and the ruling still not govern. Every suggestion carries its
 * providencia, its corporación and its score so the lawyer can dismiss it in a
 * second, which is the outcome most of them deserve.
 *
 * WHAT IS ABSENT AND SHOULD BE SAID: doctrine. The corpus holds 62 providencias
 * and no doctrinal work, so this searches jurisprudence alone. Offering a
 * "doctrina" tab fed by case law would be labelling one thing as another.
 */

export interface InterviewSuggestion {
  /** The client's own words that produced this, so the lawyer can judge it. */
  fromClient: string;
  providencia: string | null;
  corporacion: string | null;
  ponente: string | null;
  sourceUrl: string | null;
  excerpt: string;
  /** 1 - cosine distance. Higher is closer, and closer is not the same as applicable. */
  similarity: number;
}

export interface InterviewInsights {
  suggestions: InterviewSuggestion[];
  /** Present when nothing could be searched, so the screen can say why. */
  reason?: string;
}

const CORPUS = 'SYSTEM_CORPUS';

/**
 * How many of the client's turns are searched.
 *
 * The longest ones, because in an interview length tracks substance: "sí,
 * doctor" is a turn and so is the account of what happened, and only the second
 * describes a case. Four keeps the round trips bounded on a two-hour
 * conversation.
 */
const MAX_TURNOS = 4;

/**
 * Below this the match is noise dressed as precedent.
 *
 * MEASURED AGAINST THIS CORPUS, not guessed. A query the corpus genuinely
 * covers scores 66-69%; a query on an adjacent topic it does NOT cover scores
 * 50-51%; and "receta de arroz con pollo" scores 36-41%. The first threshold
 * here was 0.45, which sits between nonsense and adjacent — so an interview
 * about desembargo returned three rulings at 50% and presented the corpus's
 * silence as three findings.
 *
 * At 0.60 that interview returns nothing and the screen says the corpus has
 * nothing close, which is the true answer. 62 providencias do not cover
 * Colombian law, and a tool that never says so is worse than one that says it
 * plainly.
 */
const UMBRAL = 0.6;

const CLIENT_ROLES = new Set(['CLIENTE', 'DEMANDANTE', 'DEMANDADO', 'VICTIMA', 'TESTIGO']);

/**
 * Every indexed chunk is prefixed with a machine header — [CORPORACIÓN: …]
 * [TIPO: …] [PROVIDENCIA: …] [PONENTE: …] [RESULTADO: …] followed by HECHOS and
 * RATIO — see jurisprudenceIngestion. It is there to be embedded, not to be
 * read: showing it back made every suggestion open with square brackets and
 * bury the ruling's actual words below the fold.
 */
const stripHeader = (chunk: string): string =>
  chunk
    .replace(/^(\[[^\]]*\]\s*)+/, '')
    .replace(/^HECHOS:\s*/m, '')
    .replace(/^RATIO:\s*/m, '')
    .trim();

const excerpt = (text: string, max = 260): string =>
  text.length <= max ? text : `${text.slice(0, max).trim()}…`;

/** Pulled from the header when the metadata column does not carry it. */
const fromHeader = (chunk: string, campo: string): string | null => {
  // Doble barra a propósito: dentro de una plantilla, `\[` es solo `[` y la clase
  // de caracteres se rompe. Verificado ejecutándola, no leyéndola.
  const match = new RegExp(`\\[${campo}:\\s*([^\\]]+)\\]`).exec(chunk);
  return match ? match[1].trim() : null;
};

const asString = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

const toSuggestion = (match: VectorMatch, fromClient: string): InterviewSuggestion => {
  const meta = match.metadata ?? {};

  return {
    fromClient: excerpt(fromClient, 160),
    providencia:
      asString(meta.providencia) ??
      asString(meta.numero) ??
      fromHeader(match.contentChunk, 'PROVIDENCIA') ??
      match.fileName,
    corporacion: asString(meta.corporacion) ?? fromHeader(match.contentChunk, 'CORPORACIÓN'),
    // The metadata column does not carry the ponente for these rows; the header
    // does, and a precedent without its magistrado is harder to look up.
    ponente: asString(meta.ponente) ?? fromHeader(match.contentChunk, 'PONENTE'),
    sourceUrl: asString(meta.sourceUrl) ?? asString(meta.source_url),
    excerpt: excerpt(stripHeader(match.contentChunk)),
    similarity: match.similarity
  };
};

export const suggestForInterview = async (segments: TranscriptSegment[]): Promise<InterviewInsights> => {
  const delCliente = segments
    .filter((segment) => CLIENT_ROLES.has(segment.role))
    .map((segment) => segment.text.trim())
    .filter((text) => text.length >= 80)
    .sort((a, b) => b.length - a.length)
    .slice(0, MAX_TURNOS);

  if (delCliente.length === 0) {
    return {
      suggestions: [],
      reason:
        'Todavía no hay intervenciones del cliente lo bastante largas. Asigna el rol de Cliente a su voz y vuelve a consultar.'
    };
  }

  const encontradas: InterviewSuggestion[] = [];
  let motivo: string | undefined;

  for (const turno of delCliente) {
    const resultado = await vectorSearchService.search(CORPUS, turno, 3);

    if (resultado.status !== 'OK') {
      motivo = resultado.reason;
      continue;
    }

    for (const match of resultado.matches) {
      if (match.similarity < UMBRAL) continue;
      encontradas.push(toSuggestion(match, turno));
    }
  }

  /*
   * One providencia per suggestion list, keeping its best match.
   *
   * The same ruling answers several turns of the same story — that is what a
   * coherent account looks like — and repeating it three times reads as three
   * findings when it is one.
   */
  const porProvidencia = new Map<string, InterviewSuggestion>();
  for (const sugerencia of encontradas) {
    const clave = sugerencia.providencia ?? sugerencia.excerpt.slice(0, 40);
    const previa = porProvidencia.get(clave);
    if (!previa || sugerencia.similarity > previa.similarity) {
      porProvidencia.set(clave, sugerencia);
    }
  }

  const suggestions = [...porProvidencia.values()].sort((a, b) => b.similarity - a.similarity);

  if (suggestions.length > 0) return { suggestions };

  /*
   * Empty is an answer and it needs saying.
   *
   * Two very different silences reach here: the search could not run at all
   * (no embeddings provider, no index), or it ran and nothing cleared the
   * threshold. Returning a bare empty list for both left the reader to guess
   * whether the tool was broken or the corpus simply does not cover their case
   * — and the second is the ordinary outcome for 62 providencias.
   */
  return {
    suggestions: [],
    reason:
      motivo ??
      'El corpus no tiene ninguna providencia lo bastante cercana a lo que narró el cliente. ' +
        'Son 62 sentencias curadas, no toda la jurisprudencia colombiana.'
  };
};
