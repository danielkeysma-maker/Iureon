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
  /**
   * La actuación la escribió la firma porque el catálogo no la trae.
   *
   * Ninguna norma verificada la respalda: no hay artículo comprobado, ni
   * término, ni secciones exigidas. Se pinta con el mismo tratamiento ámbar de
   * «sin catalogar», porque para el abogado es el mismo hecho — el escrito no
   * se apoya en nada que alguien haya leído.
   */
  firmDefined?: boolean;
  /**
   * La actuación se ejerce en TODA rama y su ficha vive en la suya.
   *
   * El derecho de petición se radica lo mismo ante la UGPP que ante el INPEC, y
   * su plazo es el mismo, así que se muestra tal cual. El backend ya la marcaba
   * y la enviaba; el tipo del frontend no la declaraba.
   */
  transversal?: boolean;
  /**
   * LA FICHA ES DE OTRA RAMA Y ESTA LA ALCANZA, sin que su plazo se afirme aquí.
   *
   * No es lo mismo que `transversal`. Lo transversal es la misma actuación en
   * todas partes; esto es una ficha PRESTADA: existe en esta rama porque el
   * Código General del Proceso la gobierna, y nadie leyó si su plazo es el
   * mismo. Por eso llega con el término en NO_VERIFICADO y con este sobre, que
   * la pantalla tiene que pintar — mezclarla como propia sería afirmar en esta
   * rama un plazo que solo se comprobó en otra.
   */
  porRemision?: SobreDeRemision;
}

/** El sobre con el que una ficha prestada llega a una rama. */
export interface SobreDeRemision {
  /** De dónde viene la ficha. Hoy siempre CIVIL. */
  ramaFuente: LegalBranch;
  /** A qué rama llegó. Es la rama en la que la firma puede verificar su plazo. */
  paraRama: LegalBranch;
  estatuto: string;
  /** Norma y artículo por los que llega, p. ej. "Ley 1564 de 2012, art. 1". */
  base: string;
  /** Lo que se pinta junto al nombre. Viene del servidor para no divergir. */
  marca: string;
  /** La frase larga, para el aviso de la ficha. */
  aviso: string;
  /** Hasta dónde llega la remisión dentro de la rama, cuando no cubre todo. */
  alcance: string | null;
  /** Lo que la ficha afirma en su rama de origen. Referencia, nunca afirmación. */
  terminoEnLaRamaFuente: ActuacionTerm;
  legalBasisEnLaRamaFuente: string;
}

/**
 * Una actuación que la firma añadió a una rama.
 *
 * Nace sin norma verificada y sale de esa condición en la pantalla de Catálogo,
 * con el mismo formulario con el que se cura una ficha de fábrica: término Y
 * fuente, o no asciende.
 */
export interface FirmActuacion {
  id: string;
  area: LegalBranch;
  exactName: string;
  role: ActuacionRole;
  termStatus: TermStatus;
  legalBasis: string | null;
  termDescription: string | null;
  sourceUrl: string | null;
  note: string | null;
  createdBy: string;
  createdAt: string;
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
  /**
   * La rama en la que se verifica, cuando la ficha llegó a ella por remisión.
   *
   * Sin ella, el término que el socio acaba de leer para familia sustituiría al
   * del proceso civil, que es otro y ya está verificado.
   */
  rama?: LegalBranch | null;
  termStatus: TermStatus;
  termDescription: string | null;
  legalBasis: string | null;
  sourceUrl: string | null;
  note: string | null;
  verifiedBy: string;
}
