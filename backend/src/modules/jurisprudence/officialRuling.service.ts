import { fetchDocumentText } from '../ingestion/documentFetch';

/**
 * Brings a Constitutional Court ruling from its official relatoría, on demand.
 *
 * WHY THIS EXISTS. The corpus holds 62 providencias against a universe of
 * 29,424. A lawyer who names a ruling we never indexed should not be told it
 * does not exist — the Court publishes it, and reading it is a fetch away. This
 * is not a new capability: it is a new door into `fetchDocumentText`, which
 * already reads the HTML, PDF and Word 97 those sites serve.
 *
 * THE GUARD IS THE INDEX, AND NOTHING ELSE WOULD WORK. The relatoría answers
 * HTTP 200 for rulings that do not exist — measured: `SU-049-22` and `C-999-22`
 * both return 8,607 bytes of the same "not found" page, byte for byte, while
 * C-590 de 2005 returns 213,276. So fetching cannot tell a real citation from an
 * invented one, and a length threshold is a guess about page furniture.
 *
 * The State publishes the authoritative list as open data — every ruling from
 * 1992 to today — and it answers `[]` for SU-049 de 2022. That matters here
 * more than anywhere: this codebase has already emitted a citation to SU-049 de
 * 2022, which never existed. A fabricated citation looks exactly like a real one
 * until somebody opens it, and now nothing gets fetched that the Court's own
 * index does not confirm.
 */

/** The State's open-data register of Constitutional Court rulings. */
const INDEX_API = 'https://www.datos.gov.co/resource/v2k4-2t8s.json';

/** A page shorter than this is the relatoría's "not found", not a ruling. */
const MIN_RULING_TEXT = 4000;

export interface Citation {
  /** C, T or SU. */
  tipo: string;
  /** The sequential number, without padding. */
  numero: string;
  /** Four digits, resolved from the two the citation usually carries. */
  anio: number;
}

/** Las corporaciones que este módulo sabe leer, cada una con su lector. */
export type Corporacion = 'CORTE_CONSTITUCIONAL' | 'CORTE_SUPREMA';

export interface OfficialRuling {
  /*
   * Quién la profirió, y viaja con la providencia en vez de deducirse.
   *
   * Antes el indexador escribía CORTE_CONSTITUCIONAL fijo, porque era la única
   * corporación que había. Archivar una casación laboral bajo la Corte
   * Constitucional sería una atribución falsa que se ve idéntica a una correcta
   * una vez indexada, y que el abogado citaría tal cual.
   */
  corporacion: Corporacion;
  citation: string;
  tipo: string;
  fecha: string;
  magistrado: string;
  sala: string;
  /** The kind of process: Tutela, Demanda de inconstitucionalidad, etc. */
  proceso: string;
  sourceUrl: string;
  text: string;
}

export type RulingOutcome =
  | { status: 'FOUND'; ruling: OfficialRuling }
  | { status: 'NOT_A_CITATION'; reason: string }
  /** The Court's own index does not have it. The strongest answer we can give. */
  | { status: 'DOES_NOT_EXIST'; reason: string }
  | { status: 'UNREACHABLE'; reason: string };

/**
 * Reads a citation the way a Colombian lawyer writes one.
 *
 * "C-590 de 2005", "C-590/05", "T-384 de 2018", "SU-087/22" — all the same
 * ruling reference in different hands. Two-digit years resolve against the
 * Court's own lifetime: it opened in 1992, so 92-99 are 1900s and the rest are
 * 2000s. That rule stops working in 2092 and will be somebody else's problem.
 */
export const parseCitation = (raw: string): Citation | null => {
  const clean = raw
    .toUpperCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const match = /\b(SU|C|T)\s*[-–]?\s*(\d{1,4})\s*(?:\/|\s+DE\s+|-)\s*(\d{2,4})\b/.exec(clean);
  if (!match) return null;

  const [, tipo, numero, anioRaw] = match;
  let anio = Number(anioRaw);

  if (anioRaw.length === 2) {
    anio = anio >= 92 ? 1900 + anio : 2000 + anio;
  }

  if (anio < 1992 || anio > new Date().getFullYear() + 1) return null;

  return { tipo, numero: String(Number(numero)), anio };
};

/** How the open-data register writes a citation: `C-590/05`. */
const indexKey = (c: Citation): string =>
  `${c.tipo}-${c.numero.padStart(3, '0')}/${String(c.anio).slice(-2)}`;

/** How the relatoría names the file: `/relatoria/2005/C-590-05.htm`. */
const relatoriaUrl = (c: Citation): string =>
  `https://www.corteconstitucional.gov.co/relatoria/${c.anio}/` +
  `${c.tipo}-${c.numero.padStart(3, '0')}-${String(c.anio).slice(-2)}.htm`;

interface IndexRow {
  sentencia?: string;
  fecha_sentencia?: string;
  magistrado_a?: string;
  sala?: string;
  proceso?: string;
  sentencia_tipo?: string;
}

/**
 * Whether the Court's own register has this ruling.
 *
 * Returns null when the register itself could not be reached, which is NOT the
 * same as the ruling not existing — conflating the two would turn an outage
 * into a confident denial, and this module's whole value is that a denial can
 * be trusted.
 */
const lookupInIndex = async (c: Citation): Promise<IndexRow | null | undefined> => {
  const url = `${INDEX_API}?sentencia=${encodeURIComponent(indexKey(c))}`;

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
    if (!response.ok) return undefined;

    const rows = (await response.json()) as IndexRow[];
    return rows.length > 0 ? rows[0] : null;
  } catch {
    return undefined;
  }
};

export const fetchOfficialRuling = async (raw: string): Promise<RulingOutcome> => {
  const citation = parseCitation(raw);

  if (!citation) {
    return {
      status: 'NOT_A_CITATION',
      // La ayuda describe la forma EN PALABRAS, sin una sola cadena con figura
      // de cita. `check:search` marca cualquier providencia escrita a mano en el
      // código, y marca también los ejemplos: un regex no distingue un marcador
      // de posición de una sentencia real, y esa tosquedad es justo lo que hace
      // confiable la guarda. Escribir el ejemplo en prosa cuesta una frase.
      reason:
        `"${raw}" no se lee como una cita de la Corte Constitucional. Se espera el ` +
        'tipo (C, T o SU), luego el número de la sentencia y luego el año, ' +
        'separados por guion, por barra o por la palabra "de".'
    };
  }

  const row = await lookupInIndex(citation);

  if (row === undefined) {
    return {
      status: 'UNREACHABLE',
      reason:
        'No se pudo consultar el registro oficial de sentencias, así que no se puede confirmar que exista. No se descarga nada sin esa confirmación.'
    };
  }

  if (row === null) {
    return {
      status: 'DOES_NOT_EXIST',
      reason:
        `El registro oficial de la Corte Constitucional no tiene ${indexKey(citation)}. ` +
        'Verifica el número: la relatoría responde con una página aparentemente normal incluso para sentencias que no existen, así que la única forma de saberlo es este registro.'
    };
  }

  const sourceUrl = relatoriaUrl(citation);
  const fetched = await fetchDocumentText(sourceUrl, { minText: MIN_RULING_TEXT });

  if (!fetched.ok) {
    return {
      status: 'UNREACHABLE',
      reason: `${indexKey(citation)} existe en el registro oficial, pero su texto no se pudo leer: ${fetched.reason}`
    };
  }

  return {
    status: 'FOUND',
    ruling: {
      corporacion: 'CORTE_CONSTITUCIONAL',
      citation: indexKey(citation),
      tipo: row.sentencia_tipo ?? citation.tipo,
      fecha: (row.fecha_sentencia ?? '').slice(0, 10),
      magistrado: row.magistrado_a ?? '',
      sala: row.sala ?? '',
      proceso: row.proceso ?? '',
      sourceUrl,
      text: fetched.text
    }
  };
};
