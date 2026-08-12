import { ALL_CATALOGS } from './data';
import { applyVerification, applyVerifications } from './verification.merge';
import { verificationStore, type VerificationLoad } from './verification.store';
import type {
  Actuacion,
  ActuacionRole,
  BranchCatalog,
  CatalogMeta,
  LegalBranch
} from './types';

/**
 * Whether the firm's own curation was consulted for this answer.
 *
 * Carried on every firm-scoped response so the UI can say "no pude leer tus
 * verificaciones" instead of quietly showing the shipped catalogue as if it
 * were current.
 */
export type CurationStatus = VerificationLoad['status'];

/**
 * Branch catalogues currently loaded, from the generated `data/index.ts`.
 * Branches absent there are simply not catalogued yet; callers must degrade
 * rather than assume an empty result means "no such actuación exists".
 *
 * The service deliberately does not name the branches: adding one is a change
 * to the generator's BRANCHES list and nothing else.
 */
const CATALOGS: BranchCatalog[] = ALL_CATALOGS;

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
   *
   * `branch` narrows the search when the caller knows it. Without it, a label
   * that fits more than one branch is AMBIGUOUS and resolves to null: "recurso
   * de reposición" is 3 days before a civil judge (CGP art. 318) and 10 before
   * the administration (CPACA art. 76), and answering with either one at random
   * would hand a lawyer the wrong deadline with full confidence.
   */
  findByDocumentType(documentType: string, branch?: LegalBranch): Actuacion | null {
    const target = normalize(documentType);

    if (!target) return null;

    const pool = branch ? this.actuaciones.filter((a) => a.branch === branch) : this.actuaciones;

    const exact = pool.filter((a) => normalize(a.exactName) === target);
    if (exact.length === 1) return exact[0];
    if (exact.length > 1) return CatalogService.ambiguous(documentType, exact);

    const targetWords = new Set(significantWords(documentType));
    if (targetWords.size === 0) return null;

    let best: Actuacion | null = null;
    let bestOverlap = 0;
    let bestScore = -Infinity;
    let tied: Actuacion[] = [];

    for (const actuacion of pool) {
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
        tied = [actuacion];
      } else if (score === bestScore) {
        tied.push(actuacion);
      }
    }

    if (bestOverlap < CatalogService.MIN_MATCH_SCORE) return null;
    if (tied.length > 1) return CatalogService.ambiguous(documentType, tied);

    return best;
  }

  /**
   * Refuses to choose between equally good candidates.
   *
   * Returning null makes the drafting pipeline fall back to its generic
   * structure and the panel show nothing — which is the correct outcome. The
   * whole module exists because a confident wrong deadline is worse than an
   * acknowledged absence of one.
   */
  private static ambiguous(documentType: string, candidates: Actuacion[]): null {
    console.warn(
      `[CATALOG] "${documentType}" es ambiguo entre ${candidates.length} actuaciones (${candidates
        .map((a) => `${a.branch}:${a.exactName}`)
        .join(' | ')}). No se resuelve sin rama.`
    );
    return null;
  }

  // ---------------------------------------------------------------------------
  // Firm-scoped reads. The shipped catalogue is the base knowledge; a firm's
  // own verifications are overlaid on top so a term confirmed once in-product
  // applies to every later draft without a developer touching source.
  // ---------------------------------------------------------------------------

  /** Provenance for the branches in scope, so the declared gaps stay visible. */
  listMeta(branch?: LegalBranch): CatalogMeta[] {
    return CATALOGS.filter((c) => !branch || c.meta.branch === branch).map((c) => c.meta);
  }

  /**
   * Loads the firm's curation, or nothing when there is no firm yet.
   *
   * The shipped catalogue is product knowledge and must be readable before a
   * firm is registered: requiring a tenant to see it made the whole feature
   * invisible in exactly the state a new user starts in.
   */
  private async loadCuration(firmId?: string | null): Promise<VerificationLoad> {
    const tenant = firmId?.trim();
    return tenant
      ? verificationStore.listForFirm(tenant)
      : { status: 'NO_TENANT', verifications: [] };
  }

  async listForFirm(
    firmId?: string | null,
    branch?: LegalBranch,
    role?: ActuacionRole
  ): Promise<{ actuaciones: Actuacion[]; meta: CatalogMeta[]; curation: CurationStatus }> {
    const load = await this.loadCuration(firmId);

    return {
      actuaciones: applyVerifications(this.list(branch, role), load.verifications),
      meta: this.listMeta(branch),
      curation: load.status
    };
  }

  /**
   * Resolves a document-type label for one firm.
   *
   * Matching runs against the shipped names, which curation never changes, so
   * the override is applied after the match rather than widening it.
   */
  async resolveForFirm(
    firmId: string | null | undefined,
    documentType: string,
    branch?: LegalBranch
  ): Promise<{ actuacion: Actuacion | null; curation: CurationStatus }> {
    const base = this.findByDocumentType(documentType, branch);
    const load = await this.loadCuration(firmId);

    if (!base) return { actuacion: null, curation: load.status };

    const found = load.verifications.find((v) => v.actuacionId === base.id);

    return {
      actuacion: found ? applyVerification(base, found) : base,
      curation: load.status
    };
  }

  async getByIdForFirm(
    firmId: string,
    id: string
  ): Promise<{ actuacion: Actuacion | null; curation: CurationStatus }> {
    const base = this.getById(id);
    const load = await verificationStore.listForFirm(firmId);

    if (!base) return { actuacion: null, curation: load.status };

    const found = load.verifications.find((v) => v.actuacionId === base.id);

    return {
      actuacion: found ? applyVerification(base, found) : base,
      curation: load.status
    };
  }
}

export const catalogService = new CatalogService();
