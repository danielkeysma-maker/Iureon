/**
 * Catalogue domain types. Mirrors the backend contract in
 * backend/src/modules/catalog/types.ts.
 */

/**
 * Las 22 ramas del catálogo. DEBE coincidir con la unión del backend.
 *
 * Se quedó en trece mientras el catálogo crecía a veintidós, así que el tipo
 * afirmaba una cosa y la API devolvía otra: `useCatalogBranches` se declara
 * `LegalBranch[]` y recibía nueve valores que este tipo decía imposibles. No
 * rompía en pantalla —`BRANCH_LABELS` es `Record<string,string>`— y por eso
 * nadie lo veía; lo que sí hacía era volver inútil el typecheck justo donde el
 * contrato con el catálogo importa.
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
  n: number;
  name: string;
  mandatory: boolean;
  basis: string | null;
}

/**
 * How the filing deadline is known.
 *
 * NO_CADUCA and NO_VERIFICADO must never be presented the same way. One means
 * the filing can be brought at any time; the other means nobody checked. A
 * lawyer who reads the second as the first can lose the case to caducidad, so
 * the UI renders them with different colour, icon and wording.
 */
export type TermStatus = 'VERIFICADO' | 'NO_CADUCA' | 'NO_VERIFICADO';

export interface ActuacionTerm {
  status: TermStatus;
  description: string | null;
}

/**
 * Stamped on an actuación the firm curated itself.
 *
 * Always surfaced. A lawyer reading a deadline is entitled to know whether it
 * came with the product or from a colleague, and `replaced` keeps the previous
 * value visible so an override can be reviewed rather than taken on faith.
 */
export interface ActuacionVerification {
  verifiedBy: string;
  verifiedAt: string;
  note: string | null;
  replaced: ActuacionTerm;
}

export interface Actuacion {
  id: string;
  exactName: string;
  branch: LegalBranch;
  role: ActuacionRole;
  legalBasis: string;
  competentAuthority: string | null;
  term: ActuacionTerm;
  requiredSections: RequiredSection[];
  sourceUrl: string | null;
  verification?: ActuacionVerification;
}

/**
 * Whether the firm's own curation could be read for this response.
 *
 * UNAVAILABLE is not the same as "nothing curated": it means the catalogue on
 * screen may be missing corrections the firm already made, so the UI warns
 * instead of presenting shipped data as current.
 */
export type CurationStatus = 'OK' | 'NOT_CONFIGURED' | 'UNAVAILABLE' | 'NO_TENANT';

/**
 * Provenance for one branch's catalogue.
 *
 * `gaps` is the honest part: what the catalogue does NOT cover, declared rather
 * than left to be discovered. The labour branch's first gap is that a whole
 * transition regime runs alongside the code it was verified against.
 */
export interface CatalogMeta {
  branch: LegalBranch;
  verifiedAt: string;
  sourceOfTruth: string;
  gaps: string[];
}

/** What the firm submits when it verifies an actuación against the norm. */
export interface VerificationInput {
  actuacionId: string;
  termStatus: TermStatus;
  termDescription: string | null;
  legalBasis: string | null;
  sourceUrl: string | null;
  note: string | null;
  verifiedBy: string;
}
