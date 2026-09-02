import { config } from '../../config/env.config';
import { fetchOfficialRuling, parseCitation } from './officialRuling.service';
import { discoverCsjRulings } from './csjRuling.service';
import { discoverConsejoEstadoRulings } from './consejoEstadoRuling.service';
import type { OfficialRuling } from './officialRuling.service';

/**
 * Finds rulings about a topic that the corpus does not hold, and reads them.
 *
 * THE SEARCH ENGINE ONLY POINTS. It never decides what a ruling says, and it
 * never decides that one exists: all it produces is candidate citation strings
 * scraped from titles and URLs on the Court's own domain. Every one of those is
 * then confirmed against the State's register and downloaded from the
 * relatoría by `fetchOfficialRuling` — the same path a lawyer typing a citation
 * by hand goes through.
 *
 * That separation is this project's own rule about search results, applied to
 * the one place it could do real damage: a search result is not a source of law.
 * An engine that invents "SU-049 de 2022" gets the same answer the app already
 * gives a human who types it — the Court's index does not have it, so nothing is
 * fetched and nothing is indexed.
 *
 * WHY A SEARCH ENGINE AT ALL, given the Court runs Elasticsearch. Its
 * `buscador_new` endpoint is real — `accion=ver_total_providencias` answers with
 * 49,617 hits — but the action that performs a query is undocumented and did not
 * respond to a dozen guesses. Building on it would mean depending on something
 * that can change without notice, and the day it changed, topic discovery would
 * stop working SILENTLY. A documented search API pointed at the official domain
 * fails loudly instead.
 */

export type DiscoveryStatus =
  | 'OK'
  /** No search provider configured: discovery is off, not broken. */
  | 'NO_PROVIDER'
  | 'FAILED';

export interface DiscoveredRuling {
  ruling: OfficialRuling;
  /** Why this one was proposed, so a person can judge the search's aim. */
  motivo: string;
}

export interface DiscoveryResult {
  status: DiscoveryStatus;
  found: DiscoveredRuling[];
  /** Citations the engine proposed and the Court's register refused. */
  descartadas: Array<{ cita: string; razon: string }>;
  reason?: string;
}

/** Only the Court's own domain. A ruling quoted on a blog is not the ruling. */
const OFFICIAL_HOST = 'corteconstitucional.gov.co';

/** Enough candidates to be useful, few enough to keep a search interactive. */
const MAX_CANDIDATES = 6;

interface SearchHit {
  url: string;
  title: string;
  snippet: string;
}

/**
 * One query against the configured engine, restricted to the official domain.
 *
 * Kept behind a single function so the provider is swappable: the rest of this
 * module never learns which engine answered, only which citations came back.
 */
const searchOfficialDomain = async (topic: string): Promise<SearchHit[]> => {
  const query = `site:${OFFICIAL_HOST}/relatoria ${topic}`;

  const response = await fetch(
    `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=20`,
    {
      headers: {
        Accept: 'application/json',
        'X-Subscription-Token': config.search.braveApiKey
      },
      signal: AbortSignal.timeout(20_000)
    }
  );

  if (!response.ok) {
    throw new Error(`el buscador respondió ${response.status}`);
  }

  const payload = (await response.json()) as {
    web?: { results?: Array<{ url?: string; title?: string; description?: string }> };
  };

  return (payload.web?.results ?? [])
    .filter((r) => (r.url ?? '').includes(OFFICIAL_HOST))
    .map((r) => ({ url: r.url ?? '', title: r.title ?? '', snippet: r.description ?? '' }));
};

/**
 * Citation strings a hit could be about, in the order they should be trusted.
 *
 * The URL first, because the relatoría names its files after the ruling and a
 * path cannot be rephrased; the title second. Snippets are read last and often
 * mention OTHER rulings the document cites — useful, and exactly why every
 * candidate still has to clear the register.
 */
const citationsIn = (hit: SearchHit): string[] => {
  const found: string[] = [];
  const seen = new Set<string>();

  for (const text of [hit.url, hit.title, hit.snippet]) {
    const matches = text.matchAll(/\b(SU|C|T)\s*-?\s*(\d{1,4})\s*[-/]\s*(\d{2,4})\b/gi);

    for (const m of matches) {
      const raw = `${m[1]}-${m[2]}/${m[3]}`;
      const parsed = parseCitation(raw);
      if (!parsed) continue;

      const key = `${parsed.tipo}-${parsed.numero}-${parsed.anio}`;
      if (seen.has(key)) continue;

      seen.add(key);
      found.push(raw);
    }
  }

  return found;
};

/**
 * La Corte Suprema, por su propio buscador y sin pasar por el motor web.
 *
 * ─── POR QUÉ ESTO NO EXISTÍA Y SE NOTABA ────────────────────────────────────
 *
 * El descubrimiento consultaba UNA sola relatoría —la constitucional— y su
 * propio aviso lo confesaba: «si el asunto es de casación civil, laboral o
 * penal, es probable que no viva en esa relatoría». Se comprobó en producción
 * con «servidumbre de tránsito»: el buscador propuso seis candidatas, el
 * registro las descartó todas correctamente, y el abogado se quedó sin nada —
 * porque ese asunto es casación civil y nunca se le preguntó a la Suprema.
 *
 * `discoverCsjRulings` YA EXISTÍA, con sus cuatro colecciones y su lectura
 * oficial. Solo faltaba llamarlo.
 *
 * ─── NO PASA POR EL MOTOR WEB, Y ESO ES MEJOR ───────────────────────────────
 *
 * La constitucional necesita un buscador externo porque su índice no expone
 * consulta por tema. La Suprema sí: su propio buscador responde, así que aquí
 * no hay candidatas que confirmar — lo que vuelve ya viene de la corporación.
 * Se busca en las dos EN PARALELO: son independientes, y esperarlas en fila
 * sumaría al abogado el peor de los dos tiempos por nada.
 */
/**
 * El Consejo de Estado, por el enlace permanente de SAMAI.
 *
 * Cierra el hueco que el aviso de la pantalla venía declarando: hasta ahora lo
 * CONTENCIOSO ADMINISTRATIVO —nulidad y restablecimiento, contractual,
 * reparación directa, electoral— quedaba fuera del descubrimiento por tema.
 */
/**
 * Lo minimo que debe traer una providencia para PROPONERSE al redactor.
 *
 * Es la misma cifra que `check:discovery` exige a todo lo devuelto: «si algo
 * llego aqui, fue descargado». El Consejo de Estado entrega el EXTRACTO de su
 * relatoria, no el fallo, y muchos extractos son un parrafo. Un parrafo sirve
 * para decidir si abrir la providencia; no sirve para que el motor la cite
 * como si la hubiera leido. Por eso los cortos no entran al descubrimiento,
 * aunque sigan siendo reales — el CI llevaba catorce corridas en rojo por un
 * extracto de 2.000 caracteres, y tenia razon.
 */
const TEXTO_MINIMO_PARA_PROPONER = 4000;

/**
 * Impone el contrato en la SALIDA, para las tres cortes y no solo para el
 * Consejo: nada de lo que este modulo devuelve como «encontrado» tiene menos
 * texto que el minimo. Lo que no llega se anota en `descartadas` con su razon,
 * porque una providencia real que no se propone no es un error silencioso: es
 * una decision que el abogado puede leer. El CI fallo una vez mas despues del
 * filtro del Consejo —otra corporacion, otro texto corto— y la leccion es que
 * el contrato se sostiene donde se entrega, no corporacion por corporacion.
 */
const conTextoSuficiente = (
  lista: DiscoveredRuling[],
  descartadas?: Array<{ cita: string; razon: string }>
): DiscoveredRuling[] => {
  const dentro: DiscoveredRuling[] = [];
  for (const d of lista) {
    const largo = (d.ruling.text ?? '').length;
    if (largo >= TEXTO_MINIMO_PARA_PROPONER) dentro.push(d);
    else
      descartadas?.push({
        cita: d.ruling.citation,
        razon: `texto insuficiente para citarla (${largo} caracteres; se exigen ${TEXTO_MINIMO_PARA_PROPONER})`
      });
  }
  return dentro;
};

const descubrirEnElConsejo = async (topic: string) => {
  try {
    const todas = await discoverConsejoEstadoRulings(topic);
    const conTexto = todas.filter((d) => (d.ruling.text ?? '').length >= TEXTO_MINIMO_PARA_PROPONER);
    if (conTexto.length < todas.length) {
      console.log(
        `[DISCOVERY] Consejo de Estado: ${todas.length - conTexto.length} providencia(s) con extracto corto no se proponen; ${conTexto.length} sí.`
      );
    }
    return conTexto;
  } catch {
    /* Igual que la Suprema: una corporación caída no tumba a las otras dos. */
    return [];
  }
};

const descubrirEnLaSuprema = async (topic: string) => {
  try {
    return await discoverCsjRulings(topic);
  } catch {
    /*
     * Una corporación que falla no tumba a la otra. El resultado se presenta
     * con lo que sí respondió, que es mejor que un error para todo: el abogado
     * prefiere dos sentencias de la constitucional a una pantalla vacía porque
     * el servidor de la Suprema estaba caído.
     */
    return [];
  }
};

export const discoverRulings = async (topic: string): Promise<DiscoveryResult> => {
  if (!config.search.enabled) {
    /*
     * SIN MOTOR WEB TODAVÍA SE PUEDE PREGUNTAR A LA SUPREMA, porque ella tiene
     * buscador propio. Antes esto devolvía «no configurado» y se acababa la
     * consulta: el descubrimiento entero dependía de una llave que solo hace
     * falta para la constitucional.
     */
    const [suprema, consejo] = await Promise.all([
      descubrirEnLaSuprema(topic),
      descubrirEnElConsejo(topic)
    ]);

    const descartadasSinLlave: Array<{ cita: string; razon: string }> = [];
    const sinLlave = conTextoSuficiente(
      [
        ...suprema.map((d) => ({ ruling: d.ruling, motivo: `Corte Suprema · Sala ${d.corpus}` })),
        ...consejo.map((d) => ({ ruling: d.ruling, motivo: `Consejo de Estado · ${d.seccion}` }))
      ],
      descartadasSinLlave
    );

    return {
      status: sinLlave.length > 0 ? 'OK' : 'NO_PROVIDER',
      found: sinLlave,
      descartadas: descartadasSinLlave,
      reason:
        sinLlave.length > 0
          ? undefined
          : 'El descubrimiento en la relatoría de la Corte Constitucional no está configurado, y ni la Corte Suprema ni el Consejo de Estado devolvieron nada para este tema.'
    };
  }

  /*
   * LAS DOS CORPORACIONES A LA VEZ. `Promise.all` y no una tras otra: son
   * consultas independientes a servidores distintos.
   */
  /*
   * LAS TRES CORPORACIONES A LA VEZ. Cada una es un servidor distinto; en fila
   * el abogado esperaria la suma de las tres y no la mas lenta.
   */
  const [hitsResultado, suprema, consejo] = await Promise.all([
    searchOfficialDomain(topic).then(
      (h) => ({ ok: true as const, hits: h }),
      (error: Error) => ({ ok: false as const, error })
    ),
    descubrirEnLaSuprema(topic),
    descubrirEnElConsejo(topic)
  ]);

  const descartadasDeLasOtras: Array<{ cita: string; razon: string }> = [];
  const deLasOtras: DiscoveredRuling[] = conTextoSuficiente(
    [
      ...suprema.map((d) => ({ ruling: d.ruling, motivo: `Corte Suprema · Sala ${d.corpus}` })),
      ...consejo.map((d) => ({ ruling: d.ruling, motivo: `Consejo de Estado · ${d.seccion}` }))
    ],
    descartadasDeLasOtras
  );

  if (!hitsResultado.ok) {
    /*
     * Si el motor web falla pero la Suprema respondió, se entrega lo que hay.
     * Devolver FAILED con las manos vacías tirando dos sentencias reales seria
     * castigar al abogado por una avería que no es suya.
     */
    if (deLasOtras.length > 0) {
      return {
        status: 'OK',
        found: deLasOtras,
        descartadas: [],
        reason: `El buscador de la relatoría constitucional no respondió (${hitsResultado.error.message}); esto viene de la Corte Suprema y del Consejo de Estado.`
      };
    }

    return {
      status: 'FAILED',
      found: [],
      descartadas: [],
      reason: `No se pudo consultar el buscador: ${hitsResultado.error.message}`
    };
  }

  const hits = hitsResultado.hits;

  const candidatos: Array<{ cita: string; motivo: string }> = [];
  const vistas = new Set<string>();

  for (const hit of hits) {
    for (const cita of citationsIn(hit)) {
      const parsed = parseCitation(cita);
      if (!parsed) continue;

      const key = `${parsed.tipo}-${parsed.numero}-${parsed.anio}`;
      if (vistas.has(key)) continue;

      vistas.add(key);
      candidatos.push({ cita, motivo: hit.title || hit.url });

      if (candidatos.length >= MAX_CANDIDATES) break;
    }
    if (candidatos.length >= MAX_CANDIDATES) break;
  }

  const found: DiscoveredRuling[] = [];
  const descartadas: Array<{ cita: string; razon: string }> = [];

  for (const { cita, motivo } of candidatos) {
    // Every candidate goes through the same door as a hand-typed citation:
    // the Court's register decides whether it exists, and the relatoría
    // supplies the text. The engine's word is never enough.
    const outcome = await fetchOfficialRuling(cita);

    if (outcome.status === 'FOUND') {
      found.push({ ruling: outcome.ruling, motivo });
    } else {
      descartadas.push({ cita, razon: outcome.reason });
    }
  }

  /*
   * LO CONSTITUCIONAL PRIMERO, LUEGO LO DE LA SUPREMA. No es jerarquia entre
   * cortes: es que lo primero paso por la confirmacion contra el registro del
   * Estado y lo segundo viene directo de la corporacion. Ambas son oficiales;
   * el orden refleja por cuantas puertas paso cada una.
   */
  return {
    status: 'OK',
    found: conTextoSuficiente([...found, ...deLasOtras], descartadas),
    descartadas: [...descartadas, ...descartadasDeLasOtras]
  };
};
