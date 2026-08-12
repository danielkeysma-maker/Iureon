import { ADMINISTRATIVO_CATALOG } from './data/administrativo';
import { CONSTITUCIONAL_CATALOG } from './data/constitucional';
import type {
  Actuacion,
  ActuacionRole,
  BranchCatalog,
  LegalBranch
} from './types';

/**
 * Branch catalogues currently loaded. Branches absent here are simply not
 * catalogued yet; callers must degrade rather than assume an empty result
 * means "no such actuación exists".
 */
const CATALOGS: BranchCatalog[] = [ADMINISTRATIVO_CATALOG, CONSTITUCIONAL_CATALOG];

const normalize = (text: string): string =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s*\(.*?\)\s*/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** Words too common in filing names to help identify one. */
const STOP_WORDS = new Set([
  'de',
  'del',
  'la',
  'el',
  'los',
  'las',
  'y',
  'o',
  'a',
  'en',
  'por',
  'para',
  'ante',
  'redaccion',
  'proyeccion',
  'elaboracion',
  'solicitud'
]);

const significantWords = (text: string): string[] =>
  normalize(text)
    .split(' ')
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));

/**
 * Procedural knowledge lookup.
 *
 * The drafting pipeline receives a free-text document type from the UI, which
 * rarely matches a catalogue name verbatim, so matching is exact first and
 * then scored by shared significant words. A wrong match is worse than none —
 * it would attach the wrong deadline to a filing — so a minimum overlap is
 * required before an entry is returned.
 */
export class CatalogService {
  private readonly actuaciones: Actuacion[] = CATALOGS.flatMap((c) => c.actuaciones);

  /** Minimum shared significant words before a fuzzy match is trusted. */
  private static readonly MIN_MATCH_SCORE = 2;

  listBranches(): LegalBranch[] {
    return CATALOGS.map((c) => c.meta.branch);
  }

  getCatalog(branch: LegalBranch): BranchCatalog | null {
    return CATALOGS.find((c) => c.meta.branch === branch) ?? null;
  }

  list(branch?: LegalBranch, role?: ActuacionRole): Actuacion[] {
    return this.actuaciones.filter(
      (a) => (!branch || a.branch === branch) && (!role || a.role === role)
    );
  }

  getById(id: string): Actuacion | null {
    return this.actuaciones.find((a) => a.id === id) ?? null;
  }

  /**
   * Resolves a UI document-type label to a catalogued actuación.
   * Returns null when nothing matches confidently.
   */
  findByDocumentType(documentType: string): Actuacion | null {
    const target = normalize(documentType);

    if (!target) return null;

    const exact = this.actuaciones.find((a) => normalize(a.exactName) === target);
    if (exact) return exact;

    const targetWords = new Set(significantWords(documentType));
    if (targetWords.size === 0) return null;

    let best: Actuacion | null = null;
    let bestOverlap = 0;
    let bestScore = -Infinity;

    for (const actuacion of this.actuaciones) {
      // Deduplicated: a name that repeats a word must not outrank a name that
      // matches the request more precisely. "Demanda de nulidad o de nulidad y
      // restablecimiento ... contra actos precontractuales" would otherwise
      // beat plain "Demanda de nulidad y restablecimiento del derecho", which
      // is a different filing with a different caducidad.
      const words = new Set(significantWords(actuacion.exactName));
      const overlap = [...words].filter((word) => targetWords.has(word)).length;

      if (overlap === 0) continue;

      // Every extra word the catalogue entry carries is a term the caller did
      // not ask for, so a more specific filing is penalised unless the caller
      // named that specificity.
      const extraneous = words.size - overlap;
      const score = overlap - 0.5 * extraneous;

      if (score > bestScore) {
        bestScore = score;
        bestOverlap = overlap;
        best = actuacion;
      }
    }

    return bestOverlap >= CatalogService.MIN_MATCH_SCORE ? best : null;
  }
}

export const catalogService = new CatalogService();
