/**
 * Catalogue of actuaciones: what filings exist, under which norm, with which
 * deadline, and which sections a valid document must contain.
 *
 * This replaces free-text templates with traceable procedural knowledge. Every
 * entry carries the article it came from, so a draft can cite its basis instead
 * of the model recalling one.
 */

export type LegalBranch =
  | 'CONSTITUCIONAL'
  | 'ADMINISTRATIVO'
  | 'CIVIL'
  | 'FAMILIA'
  | 'LABORAL'
  | 'PENAL'
  | 'SOCIETARIO'
  | 'TRIBUTARIO'
  | 'TRANSITO'
  | 'NOTARIAL'
  | 'INTERNACIONAL';

/** Who authors the document. */
export type ActuacionRole = 'LITIGANTE' | 'DESPACHO';

export interface RequiredSection {
  /** Display order within the document. */
  n: number;
  name: string;
  /** True when omitting this section makes the filing defective. */
  mandatory: boolean;
  /** Article the requirement comes from, when verified. */
  basis: string | null;
}

/**
 * How the filing deadline is known.
 *
 * The distinction between NO_CADUCA and NO_VERIFICADO is load-bearing and must
 * never be collapsed in the UI: telling a lawyer a term is unknown when it has
 * actually expired, or that none exists when nobody checked, are both ways to
 * lose a case. NO_VERIFICADO means "go check", not "you have time".
 */
export type TermStatus = 'VERIFICADO' | 'NO_CADUCA' | 'NO_VERIFICADO';

export interface ActuacionTerm {
  status: TermStatus;
  /** Verbatim description of the deadline. Null when NO_VERIFICADO. */
  description: string | null;
}

export interface Actuacion {
  /** Stable lookup key, e.g. "administrativo/demanda-de-nulidad-simple". */
  id: string;
  exactName: string;
  branch: LegalBranch;
  role: ActuacionRole;
  /** Norm and article, e.g. "Ley 1437 de 2011, art. 137". */
  legalBasis: string;
  competentAuthority: string | null;
  term: ActuacionTerm;
  requiredSections: RequiredSection[];
  /** Where the basis was verified. */
  sourceUrl: string | null;
}

/** Provenance for a branch's catalogue, so gaps stay visible rather than implied. */
export interface CatalogMeta {
  branch: LegalBranch;
  verifiedAt: string;
  sourceOfTruth: string;
  /** Known holes. Displayed rather than hidden. */
  gaps: string[];
}

export interface BranchCatalog {
  meta: CatalogMeta;
  actuaciones: Actuacion[];
}
