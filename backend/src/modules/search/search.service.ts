import { ALL_CATALOGS } from '../catalog/data';
import { vectorSearchService } from './vectorSearch.service';

/**
 * Legal search over what the product has actually verified.
 *
 * Until 2026-08-14 this file answered from three hand-written arrays and the
 * frontend carried seventeen more. They were not placeholders: they had
 * magistrado ponente, a citation string ready to paste into a brief, and a
 * `fullText` with CONSIDERANDO and RESUELVE composed here rather than taken
 * from any providencia. One of them cited "SU-049 de 2022", which does not
 * exist — the real unification on estabilidad laboral reforzada is SU-049 de
 * 2017. The doctrine read roughly right, which is exactly what made it
 * dangerous: nobody re-checks a number that looks correct.
 *
 * The rule here is the catalogue's rule. This service returns what it can
 * source, says so when it has nothing, and never fills the gap with prose.
 */

export type CorpusStatus =
  | 'OK'
  /** Query ran, corpus holds nothing for it. */
  | 'EMPTY'
  /** Nothing has been ingested yet — different from "no results". */
  | 'NOT_SEEDED'
  | 'NO_PROVIDER'
  | 'NO_INDEX'
  | 'FAILED';

export interface GlossaryItem {
  id: string;
  term: string;
  /** The branch the term was catalogued under. */
  category: string;
  definition: string;
  colombianNormativeRef: string;
  /** Where the definition comes from. Never absent: a term with no source is not a term. */
  sourceUrl: string;
}

export interface LegalSearchItem {
  id: string;
  type: 'ACTUACION' | 'SENTENCIA' | 'ARTICULO_LEY';
  title: string;
  branch: string;
  /** Article and statute, as catalogued. */
  legalBasis: string;
  summary: string;
  citationString: string;
  sourceUrl: string;
}

export interface SearchResponse<T> {
  status: CorpusStatus;
  items: T[];
  /** Present whenever status is not OK, so the UI can explain instead of showing zero. */
  reason?: string;
}

export interface PrecedentItem {
  id: string;
  contentChunk: string;
  similarity: number;
  branch: string | null;
  /** Every field below comes from the row's metadata; null when not recorded. */
  providencia: string | null;
  corporacion: string | null;
  magistradoPonente: string | null;
  outcome: string | null;
  sourceUrl: string | null;
  /** SYSTEM_CORPUS = shared law corpus; anything else = this firm's own files. */
  isSharedCorpus: boolean;
}

const normalise = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

/**
 * The catalogue is the only verified legal knowledge this product owns, so it
 * is what the glossary and the statute search read from. 363 of its 378 entries
 * carry a term read in the norm plus the URL it was read at; the other 15 are
 * declared NO_VERIFICADO and are deliberately NOT offered here — a glossary
 * entry with no verified term is the defect this file was rewritten to remove.
 */
const catalogEntries = () =>
  ALL_CATALOGS.flatMap((catalog) =>
    catalog.actuaciones.map((entry) => ({ branch: entry.branch as string, entry }))
  );

export class LegalSearchService {
  /**
   * Glosario. Built from catalogued actuaciones whose term was verified.
   */
  public getGlossaryTerms(query?: string, category?: string): SearchResponse<GlossaryItem> {
    const wanted = query ? normalise(query) : '';

    const items = catalogEntries()
      .filter(({ branch, entry }) => {
        if (entry.term.status === 'NO_VERIFICADO' || !entry.term.description) return false;
        if (category && category !== 'TODAS' && branch !== category) return false;
        if (!wanted) return true;
        return (
          normalise(entry.exactName).includes(wanted) ||
          normalise(entry.term.description).includes(wanted) ||
          normalise(entry.legalBasis ?? '').includes(wanted)
        );
      })
      .map(({ branch, entry }) => ({
        id: entry.id,
        term: entry.exactName,
        category: branch,
        definition: entry.term.description as string,
        colombianNormativeRef: entry.legalBasis ?? '',
        sourceUrl: entry.sourceUrl ?? ''
      }));

    if (items.length === 0) {
      return {
        status: 'EMPTY',
        items: [],
        reason: query
          ? `El catálogo no tiene una actuación verificada que coincida con "${query}".`
          : 'No hay términos verificados para ese filtro.'
      };
    }

    return { status: 'OK', items };
  }

  /**
   * Buscador de normas. Same source, presented as citable statute references.
   */
  public searchLegalDatabase(query: string, branch?: string): SearchResponse<LegalSearchItem> {
    const wanted = query ? normalise(query) : '';

    const items = catalogEntries()
      .filter(({ branch: b, entry }) => {
        if (entry.term.status === 'NO_VERIFICADO') return false;
        if (branch && branch !== 'TODOS' && b !== branch) return false;
        if (!wanted) return true;
        return (
          normalise(entry.exactName).includes(wanted) ||
          normalise(entry.legalBasis ?? '').includes(wanted) ||
          normalise(entry.term.description ?? '').includes(wanted)
        );
      })
      .map(({ branch: b, entry }) => ({
        id: entry.id,
        type: 'ACTUACION' as const,
        title: entry.exactName,
        branch: b,
        legalBasis: entry.legalBasis ?? '',
        summary: entry.term.description ?? 'Sin término de caducidad verificado.',
        citationString: entry.legalBasis ?? '',
        sourceUrl: entry.sourceUrl ?? ''
      }));

    if (items.length === 0) {
      return {
        status: 'EMPTY',
        items: [],
        reason: `No hay una norma catalogada y verificada que coincida con "${query}".`
      };
    }

    return { status: 'OK', items };
  }

  /**
   * Precedentes. Reads the shared SYSTEM_CORPUS through semantic search.
   *
   * This does NOT search the live web, despite what the old method name and its
   * comment claimed. It searches what has been ingested and embedded. While the
   * corpus is empty it says so, and returns nothing.
   */
  public async searchPrecedents(
    firmId: string,
    query: string,
    limit?: number
  ): Promise<SearchResponse<PrecedentItem>> {
    const result = await vectorSearchService.search(firmId, query, limit);

    if (result.status !== 'OK') {
      return { status: result.status as CorpusStatus, items: [], reason: result.reason };
    }

    if (result.matches.length === 0) {
      return {
        status: 'NOT_SEEDED',
        items: [],
        reason:
          'No hay providencias indexadas todavía. El corpus de jurisprudencia está vacío: la búsqueda no encontró nada porque no hay nada, no porque tu consulta sea mala.'
      };
    }

    const str = (meta: Record<string, unknown> | null, key: string): string | null => {
      const value = meta?.[key];
      return typeof value === 'string' && value.trim() ? value : null;
    };

    return {
      status: 'OK',
      items: result.matches.map((m, i) => ({
        id: m.documentId ?? `${m.fileName ?? 'chunk'}-${i}`,
        contentChunk: m.contentChunk,
        similarity: m.similarity,
        branch: m.branch,
        providencia: str(m.metadata, 'providencia'),
        corporacion: str(m.metadata, 'corporacion'),
        magistradoPonente: str(m.metadata, 'magistradoPonente'),
        outcome: str(m.metadata, 'resuelveOutcome'),
        sourceUrl: str(m.metadata, 'sourceUrl'),
        isSharedCorpus: m.firmId === 'SYSTEM_CORPUS'
      }))
    };
  }
}
