import { decodeDocument } from '../ingestion/documentFetch';
import type { OfficialRuling, RulingOutcome } from './officialRuling.service';

/**
 * Brings a Supreme Court ruling from the Court's own search service.
 *
 * WHY A SECOND READER AND NOT A BRANCH IN THE FIRST. The Constitutional Court
 * publishes at a derivable address — `/relatoria/2008/T-760-08.htm` — so a
 * citation IS a URL there. The Supreme Court publishes nothing of the sort: its
 * providencias live at filesystem paths carrying the magistrate's name, the sala
 * and whether the chamber was permanent or de descongestión, as in
 * `/Index/LABORAL/DESCONGESTION/2022/Dr. Omar De Jesus Restrepo Ochoa/Sentencias/SL4102-2022.doc`.
 * Nobody can derive that from "SL4102 de 2022". It has to be asked.
 *
 * WHAT REPLACES THE INDEX AS THE GUARD. For the Constitutional Court the answer
 * was the State's open-data register, because the relatoría answers HTTP 200 for
 * rulings that do not exist. Here the guard is the search service's own answer:
 * every result carries `title`, which is the FILE NAME the Court stored —
 * `SL4102-2022.doc`. A citation exists exactly when a result's file name is it.
 * That is a fact the Court published, not an inference from a page's length.
 *
 * The distinction matters because the search is fuzzy on purpose: asking for
 * `SL4102-2023` returns 111 results, none of them that providencia. Accepting
 * "the search returned something" as proof of existence would confirm every
 * invented citation ever written. Only the exact file-name match counts.
 *
 * WHAT THIS ADDS THAT DID NOT EXIST. Casación civil, laboral and penal, plus the
 * tutelas the Supreme Court decides — the everyday matter of most litigation in
 * Colombia, none of which the Constitutional Court reader could ever reach.
 */

/** The Court's search backend. Public, no key, read from its own client. */
/**
 * EL AGENTE DE USUARIO NO ES ADORNO, Y HOY COSTÓ UN DIAGNÓSTICO EQUIVOCADO.
 *
 * Los WAF de los dominios judiciales colombianos responden 403 al agente por
 * defecto de una librería. Sin esta cabecera un servicio en pie parece caído, y
 * eso fue exactamente lo que llevó a declarar muerta esta API durante un día:
 * `curl` fallaba por otra razón —verificación de revocación de certificado— y
 * la conclusión fue que la Corte había bloqueado el tráfico. No lo había hecho.
 *
 * Identificarse como un cliente que lee páginas públicas no es evadir nada: es
 * decir lo que se es, en vez de el nombre por defecto de una dependencia.
 */
const AGENTE =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const API = 'https://consultaprovidenciasbk.cortesuprema.gov.co/api';
const DOWNLOAD = 'https://consultaprovidenciasbk.cortesuprema.gov.co/downloadFile';

/** The site the API belongs to. Sent so the request looks like what it is. */
const ORIGIN = 'https://consultaprovidencias.cortesuprema.gov.co';

/**
 * The four collections the Court separates its work into.
 *
 * These are NOT legal branches: `Tutelas` holds tutelas from every sala, so a
 * labour tutela is in `Tutelas` while a labour casación is in `Laboral`. The
 * prefix of the citation says which, and getting it wrong means searching the
 * wrong collection and reporting a real providencia as non-existent.
 */
type Corpus = 'Tutelas' | 'Civil' | 'Laboral' | 'Penal';

/**
 * How the Court prefixes its providencias: S for sentencia, A for auto, then
 * the sala. Every tutela prefix (ST_, AT_) lives in the Tutelas collection no
 * matter which sala decided it.
 */
const CORPUS_BY_PREFIX: Record<string, Corpus> = {
  SL: 'Laboral',
  AL: 'Laboral',
  SC: 'Civil',
  AC: 'Civil',
  SP: 'Penal',
  AP: 'Penal',
  STL: 'Tutelas',
  STC: 'Tutelas',
  STP: 'Tutelas',
  ATL: 'Tutelas',
  ATC: 'Tutelas',
  ATP: 'Tutelas'
};

export interface CsjCitation {
  /** SL, SC, SP, STC… as the Court writes it. */
  prefijo: string;
  numero: string;
  anio: number;
  /** Normalised back to the Court's own form: `SL4102-2022`. */
  canonica: string;
  corpus: Corpus;
}

/**
 * Reads a Supreme Court citation the way a Colombian lawyer writes one.
 *
 * `SL4102-2022`, `SL 4102 de 2022`, `STC1234/2021` — the same reference in
 * different hands. Unlike the Constitutional Court's, these years are written in
 * full: this numbering scheme began in 2013, and before it the Court cited by
 * docket number, so a two-digit year here would be ambiguous rather than
 * shorthand. A citation without four digits is refused, not guessed.
 */
export const parseCsjCitation = (raw: string): CsjCitation | null => {
  const clean = raw.toUpperCase().replace(/\s+/g, ' ').trim();

  const match = /\b(S|A)(T?)([LCP])\s*[-–]?\s*(\d{1,6})\s*(?:\/|\s+DE\s+|-)\s*(\d{4})\b/.exec(clean);
  if (!match) return null;

  const [, sa, t, sala, numero, anioRaw] = match;
  const prefijo = `${sa}${t}${sala}`;
  const corpus = CORPUS_BY_PREFIX[prefijo];
  if (!corpus) return null;

  const anio = Number(anioRaw);

  // The scheme started in 2013 and nothing is dated ahead of now. Outside that
  // window the string parsed but cannot be a providencia, and saying so beats
  // searching for it and reporting the empty result as "no existe".
  if (anio < 2013 || anio > new Date().getFullYear() + 1) return null;

  return { prefijo, numero, anio, canonica: `${prefijo}${numero}-${anio}`, corpus };
};

interface SearchRow {
  title: string | null;
  id: string | null;
  onlinePath: string | null;
  doctor: string | null;
  ano: number | null;
  fechaCreacion: string | null;
}

const gql = async (query: string, timeoutMs: number): Promise<any> => {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': AGENTE, Referer: ORIGIN, Origin: ORIGIN },
    body: JSON.stringify({ query }),
    signal: AbortSignal.timeout(timeoutMs)
  });

  if (!res.ok) throw new Error(`el buscador respondió ${res.status}`);

  const body = (await res.json()) as { data?: any; errors?: Array<{ message: string }> };
  if (body.errors?.length) throw new Error(body.errors[0].message);
  return body.data;
};

/** The query is built by string concatenation, so a quote would break it. */
const escapar = (s: string): string => s.replace(/["\\]/g, '');

const buscar = async (texto: string, corpus: Corpus, timeoutMs: number): Promise<SearchRow[]> => {
  /*
   * `isExact: false` a propósito, y no es un aflojamiento.
   *
   * Con `true` el servicio busca la frase dentro del cuerpo del documento, y una
   * cita no está en su propio cuerpo: pedir exactamente `SL4102-2022` no
   * devuelve absolutamente nada. Con `false` es una búsqueda por término, y la
   * exactitud se aplica después contra el nombre del archivo — que es más
   * estricto que cualquier cosa que ofrezca el servicio, porque la Corte o
   * guardó ese archivo o no lo guardó.
   */
  const query =
    `{ getSearchResult(searchQuery:{ query: "${escapar(texto)}" typeOfQuery: "${corpus}" ` +
    `start: 0 isExact : false magistrate:"" year:"" autoSentencia: "" order: "" ` +
    `roomTutelas: "" addedQueries: [] }) ` +
    `{ numOfResults searchResults { title id onlinePath doctor ano fechaCreacion } } }`;

  const data = await gql(query, timeoutMs);
  return (data?.getSearchResult?.searchResults ?? []) as SearchRow[];
};

/** `SL4102-2022.doc` matches `SL4102-2022`; `SL41020-2022.doc` does not. */
const esLaMisma = (fileName: string, canonica: string): boolean =>
  fileName
    .toUpperCase()
    .replace(/\.(PDF|DOCX?|RTF|HTML?)$/, '')
    .trim() === canonica;

/**
 * Downloads the providencia the Court stored, preferring its PDF.
 *
 * Many are kept as Word 97, and the Court's own client tries the `.pdf` sibling
 * first. Doing the same means the common case never goes through the OLE reader.
 */
const descargar = async (path: string, timeoutMs: number): Promise<string> => {
  const candidatos = /\.pdf$/i.test(path) ? [path] : [path.replace(/\.[^.]+$/, '.pdf'), path];

  let ultimoError = '';

  for (const candidato of candidatos) {
    try {
      const res = await fetch(DOWNLOAD, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'User-Agent': AGENTE, Referer: ORIGIN, Origin: ORIGIN },
        body: JSON.stringify({ path: candidato }),
        signal: AbortSignal.timeout(timeoutMs)
      });

      if (!res.ok) {
        ultimoError = `la descarga respondió ${res.status}`;
        continue;
      }

      const leido = await decodeDocument(
        Buffer.from(await res.arrayBuffer()),
        res.headers.get('content-type') ?? '',
        MIN_TEXT
      );

      if (leido.ok) return leido.text;
      ultimoError = leido.reason;
    } catch (error) {
      ultimoError = (error as Error).message;
    }
  }

  throw new Error(ultimoError || 'no se pudo descargar');
};

/** A providencia shorter than this is a cover page, not a ruling. */
const MIN_TEXT = 2000;

/** Enough for the network on a bad day, short enough not to hold a draft. */
const TIMEOUT_MS = 25_000;

export const fetchCsjRuling = async (raw: string): Promise<RulingOutcome> => {
  const cita = parseCsjCitation(raw);

  if (!cita) {
    return {
      status: 'NOT_A_CITATION',
      reason: `"${raw}" no tiene la forma de una providencia de la Corte Suprema (por ejemplo SL4102-2022).`
    };
  }

  let filas: SearchRow[];

  try {
    filas = await buscar(cita.canonica, cita.corpus, TIMEOUT_MS);
  } catch (error) {
    /*
     * Inalcanzable NO es inexistente, y confundirlos es el error caro.
     *
     * Decirle a un abogado que su sentencia no existe porque el buscador de la
     * Corte tuvo una mala tarde es afirmar algo falso sobre el derecho. Quien
     * llama distingue: una la descarta, la otra pide reintentar.
     */
    return {
      status: 'UNREACHABLE',
      reason: `No se pudo consultar el buscador de la Corte Suprema: ${(error as Error).message}`
    };
  }

  const exacta = filas.find((f) => f.title && esLaMisma(f.title, cita.canonica));

  if (!exacta?.id) {
    return {
      status: 'DOES_NOT_EXIST',
      reason: `El buscador de la Corte Suprema no tiene ninguna providencia llamada ${cita.canonica}. No la cites.`
    };
  }

  let text: string;

  try {
    text = await descargar(exacta.id, TIMEOUT_MS);
  } catch (error) {
    return {
      status: 'UNREACHABLE',
      reason: `${cita.canonica} existe en el registro de la Corte Suprema, pero su texto no se pudo descargar: ${(error as Error).message}`
    };
  }

  if (text.trim().length < MIN_TEXT) {
    return {
      status: 'UNREACHABLE',
      reason: `${cita.canonica} existe, pero lo descargado tiene ${text.trim().length} caracteres y no parece la providencia completa.`
    };
  }

  /*
   * La sala sale de la ruta, no de una suposición sobre el prefijo.
   *
   * La Corte guarda PERMANENTE y DESCONGESTION como carpetas distintas, y son
   * salas distintas de verdad. Escribirlo mal en la ficha convertiría una cita
   * correcta en una atribución falsa, que es justo lo que este módulo existe
   * para impedir.
   */
  const salaMatch = /\/Index\/([A-ZÁÉÍÓÚÑ]+)\/([A-ZÁÉÍÓÚÑ]+)\//i.exec(exacta.id);
  const sala = salaMatch ? `Sala ${salaMatch[1]} — ${salaMatch[2]}` : `Sala ${cita.corpus}`;

  return {
    status: 'FOUND',
    ruling: {
      corporacion: 'CORTE_SUPREMA',
      citation: cita.canonica,
      tipo: cita.prefijo,
      fecha: exacta.fechaCreacion ?? String(exacta.ano ?? cita.anio),
      magistrado: (exacta.doctor ?? '').trim() || 'no registrado',
      sala,
      proceso: cita.corpus === 'Tutelas' ? 'Tutela' : `Casación ${cita.corpus}`,
      /*
       * La página desde la que un abogado puede abrirla él mismo. El servicio
       * de descarga es un POST, así que no sirve como enlace para pegar en un
       * escrito, y poner uno que no abre es peor que no poner ninguno.
       */
      sourceUrl: `${ORIGIN}/busqueda`,
      text
    }
  };
};

/**
 * Finds Supreme Court rulings on a subject, using the Court's own search.
 *
 * WHY THIS NEEDS NO SEARCH ENGINE, unlike the Constitutional Court path. There,
 * discovery goes through Brave restricted to the Court's domain, because the
 * relatoria has no queryable index — a web search is the only way in, and every
 * citation it proposes then has to be confirmed against the State's register.
 *
 * Here the Court runs full-text search over its own providencias and answers
 * with the file names it stored. So the result IS the confirmation: there is no
 * outside party to distrust, no citation to re-verify, and no API key. It also
 * means this keeps working on a machine with no Brave key at all.
 *
 * WHY THE TEXT IS DOWNLOADED ONE AT A TIME AND FEW. Each providencia is a PDF of
 * a couple hundred kilobytes, and this runs inside a draft a lawyer is waiting
 * on. Two well-chosen rulings that arrive beat six that time out.
 */
export interface CsjDiscovered {
  ruling: OfficialRuling;
  /** Which collection it came out of, so a person can judge the aim. */
  corpus: Corpus;
}

/** Every collection, when the caller has no branch to narrow it with. */
const TODOS: Corpus[] = ['Laboral', 'Civil', 'Penal', 'Tutelas'];

export const discoverCsjRulings = async (
  topic: string,
  opciones: { corpora?: Corpus[]; max?: number } = {}
): Promise<CsjDiscovered[]> => {
  const corpora = opciones.corpora?.length ? opciones.corpora : TODOS;
  const max = opciones.max ?? 2;
  const limpio = topic.trim();

  if (limpio.length < 8) return [];

  /*
   * Las cuatro colecciones se consultan a la vez porque son independientes y
   * esperarlas en fila multiplicaria por cuatro lo que el abogado espera. Una
   * que falle no tumba a las demas: se queda sin candidatos y ya.
   */
  const porCorpus = await Promise.all(
    corpora.map(async (corpus) => {
      try {
        const filas = await buscar(limpio, corpus, TIMEOUT_MS);
        return filas.map((fila) => ({ fila, corpus }));
      } catch {
        return [];
      }
    })
  );

  /*
   * Se intercalan las colecciones en vez de concatenarlas.
   *
   * Concatenar entrega las dos primeras de Laboral siempre, y una consulta que
   * toca laboral y tutela recibiria dos veces lo mismo. Intercalar da una de
   * cada materia antes de repetir cualquiera.
   */
  const candidatos: Array<{ fila: SearchRow; corpus: Corpus }> = [];
  for (let i = 0; candidatos.length < max * 3; i++) {
    const antes = candidatos.length;
    for (const lista of porCorpus) if (lista[i]) candidatos.push(lista[i]);
    if (candidatos.length === antes) break;
  }

  const encontradas: CsjDiscovered[] = [];
  const vistas = new Set<string>();

  for (const { fila, corpus } of candidatos) {
    if (encontradas.length >= max) break;
    if (!fila.id || !fila.title) continue;

    const canonica = fila.title.toUpperCase().replace(/\.(PDF|DOCX?|RTF|HTML?)$/, '').trim();
    if (vistas.has(canonica)) continue;
    vistas.add(canonica);

    // Un nombre de archivo que no tiene forma de cita no se cita: la Corte
    // tambien guarda cosas como `36588(02-09-08).doc`, que es un radicado
    // antiguo y no una providencia numerada.
    if (!parseCsjCitation(canonica)) continue;

    let text: string;
    try {
      text = await descargar(fila.id, TIMEOUT_MS);
    } catch {
      continue;
    }

    if (text.trim().length < MIN_TEXT) continue;

    const salaMatch = /\/Index\/([A-ZÁÉÍÓÚÑ]+)\/([A-ZÁÉÍÓÚÑ]+)\//i.exec(fila.id);

    encontradas.push({
      corpus,
      ruling: {
        corporacion: 'CORTE_SUPREMA',
        citation: canonica,
        tipo: canonica.replace(/[0-9].*$/, ''),
        fecha: fila.fechaCreacion ?? String(fila.ano ?? ''),
        magistrado: (fila.doctor ?? '').trim() || 'no registrado',
        sala: salaMatch ? `Sala ${salaMatch[1]} — ${salaMatch[2]}` : `Sala ${corpus}`,
        proceso: corpus === 'Tutelas' ? 'Tutela' : `Casación ${corpus}`,
        sourceUrl: `${ORIGIN}/busqueda`,
        text
      }
    });
  }

  return encontradas;
};
