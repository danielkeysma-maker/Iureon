/**
 * Catalogue domain types. Mirrors the backend contract in
 * backend/src/modules/catalog/types.ts.
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

export type ActuacionRole = 'LITIGANTE' | 'DESPACHO';

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
}
