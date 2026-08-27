import { config } from '../../config/env.config';
import { fetchOfficialRuling, parseCitation } from './officialRuling.service';
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

export const discoverRulings = async (topic: string): Promise<DiscoveryResult> => {
  if (!config.search.enabled) {
    return {
      status: 'NO_PROVIDER',
      found: [],
      descartadas: [],
      reason:
        'El descubrimiento por tema no está configurado. La búsqueda sigue funcionando sobre el corpus indexado y sobre las sentencias que se nombren por su número.'
    };
  }

  let hits: SearchHit[];

  try {
    hits = await searchOfficialDomain(topic);
  } catch (error) {
    return {
      status: 'FAILED',
      found: [],
      descartadas: [],
      reason: `No se pudo consultar el buscador: ${(error as Error).message}`
    };
  }

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

  return { status: 'OK', found, descartadas };
};
