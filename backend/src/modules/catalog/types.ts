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
  | 'CONTRATACION'
  | 'SUPERINTENDENCIAS'
  | 'INTERNACIONAL'
  | 'AGRARIO'
  | 'ADUANERO'
  | 'PROPIEDAD_INTELECTUAL'
  | 'POLICIVO'
  | 'DISCIPLINARIO'
  | 'ARBITRAJE'
  | 'INSOLVENCIA'
  | 'AMBIENTAL'
  | 'FAMILIA_ADMINISTRATIVA';

/** Who authors the document. */
/**
 * Who signs the document.
 *
 * The sustanciador is deliberately NOT a role: he projects the providencia the
 * judge signs, so it is one document with two hands, not two documents.
 * SECRETARIA is a role because its acts — estados, constancias, traslados,
 * emplazamientos — are signed by the secretary in their own name. The citador's
 * work (delivering citations, keeping delivery sheets) is issued by the
 * secretariat and lives under SECRETARIA too.
 */
export type ActuacionRole = 'LITIGANTE' | 'DESPACHO' | 'SECRETARIA';

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

/**
 * Provenance stamped on an actuación whose term or basis was curated by the
 * firm itself rather than shipped with the product.
 *
 * It is surfaced, never hidden: a lawyer reading a deadline is entitled to know
 * whether it came from the verified catalogue or from a colleague last Tuesday.
 */
export interface ActuacionVerification {
  verifiedBy: string;
  verifiedAt: string;
  note: string | null;
  /** What the shipped catalogue said before the firm overrode it. */
  replaced: ActuacionTerm;
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
  /** Present only when this firm curated the entry in-product. */
  verification?: ActuacionVerification;
  /*
   * TRANSVERSAL: la actuacion aplica en TODA rama, no solo en la suya.
   *
   * El derecho de peticion (art. 23 C.P., Ley 1755 de 2015) se ejerce ante
   * cualquier autoridad — un laboralista lo radica ante la UGPP y un penalista
   * ante el INPEC — pero sus fichas viven en ADMINISTRATIVO porque la Ley 1755
   * es su fuente. Sin esta marca, elegir cualquier otra rama las escondia:
   * existian, estaban verificadas, y nadie fuera de administrativo las veia.
   *
   * Marca y no duplicacion, a proposito: cada copia exigiria verificar su
   * termino por separado, y dieciocho copias por rama son dieciocho lugares
   * donde un termino corregido puede quedar viejo.
   */
  transversal?: boolean;
}

/**
 * A firm's curation of one catalogued actuación.
 *
 * Only the term, the article and the source may be corrected. Section
 * requirements are not editable yet, and that limit is declared rather than
 * silently enforced.
 */
export interface CatalogVerification {
  actuacionId: string;
  term: ActuacionTerm;
  legalBasis: string | null;
  sourceUrl: string | null;
  note: string | null;
  verifiedBy: string;
  verifiedAt: string;
}

/** What a curation request may carry. Validated before it is persisted. */
export interface CatalogVerificationInput {
  actuacionId: string;
  termStatus: TermStatus;
  termDescription?: string | null;
  legalBasis?: string | null;
  sourceUrl?: string | null;
  note?: string | null;
  verifiedBy: string;
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
