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
  | 'FAMILIA_ADMINISTRATIVA'
  | 'SEGURIDAD_SOCIAL'
  | 'RESPONSABILIDAD_FISCAL'
  | 'CONTRATOS'
  | 'EXTINCION_DOMINIO'
  | 'RESTITUCION_TIERRAS'
  | 'URBANISMO';

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

/**
 * La remision de una RAMA al Codigo General del Proceso, declarada una vez.
 *
 * Se declara por rama y no por ficha porque la remision es un hecho de la
 * rama: la Ley 1116 no dice nada del recurso de reposicion, y lo que hace que
 * el recurso exista alli es el art. 1 del CGP, no una linea de la ficha.
 *
 * `citas` son las frases literales que sostienen la afirmacion. Sin ellas la
 * remision no se declara: es la misma regla que gobierna un termino.
 */
export interface RemisionDeRama {
  /** Hoy solo el CGP. El campo existe para que anadir otro no sea un rediseno. */
  estatuto: 'CGP';
  /** Norma y articulo, p. ej. "Ley 1564 de 2012, art. 1". */
  base: string;
  /** Frases literales del articulo, transcritas caracter por caracter. */
  citas: string[];
  /** De donde viajan las fichas. Hoy siempre CIVIL. */
  ramaFuente: LegalBranch;
  /**
   * Hasta donde llega la remision DENTRO de la rama, cuando no cubre todo.
   * En CONSTITUCIONAL la reposicion existe para las acciones populares y de
   * grupo y NO para la tutela, y callarlo seria peor que no ofrecerla.
   */
  alcance: string | null;
  /** URL oficial donde se leyo. */
  fuente: string;
  /** Fecha de consulta, YYYY-MM-DD. */
  consultadoEl: string;
}

/**
 * El sobre con el que una ficha prestada llega a una rama.
 *
 * Viaja con la ficha —no dentro del catalogo— y es lo unico que la pantalla y
 * el motor necesitan para no confundirla con una actuacion propia de la rama.
 */
export interface SobreDeRemision {
  ramaFuente: LegalBranch;
  paraRama: LegalBranch;
  estatuto: string;
  base: string;
  /** Lo que se pinta junto al nombre, en el selector y en la ficha. */
  marca: string;
  /** La frase larga, para el aviso de la ficha y para el motor. */
  aviso: string;
  alcance: string | null;
  /**
   * Lo que la ficha afirma EN SU RAMA DE ORIGEN. Se conserva como referencia
   * —el abogado quiere saber cuanto es en lo civil— y jamas como el termino de
   * esta rama: el que viaja en `term` esta degradado a NO_VERIFICADO.
   */
  terminoEnLaRamaFuente: ActuacionTerm;
  /**
   * El fundamento tal como lo trae la ficha, sin la coletilla de la remision.
   *
   * Se conserva porque la coletilla dice «no afirme que este plazo es el de
   * esta rama», y eso deja de ser cierto en el momento en que la firma lo
   * verifica PARA esta rama. Sin el original habria que reconstruirlo cortando
   * una cadena, que es como se pierden los artículos.
   */
  legalBasisEnLaRamaFuente: string;
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
   * LA ACTUACION LA ESCRIBIO LA FIRMA, no viene con el producto.
   *
   * Nadie de esta casa leyo una norma para ella: no hay articulo comprobado,
   * ni termino, ni secciones exigidas. Se marca en el dato y no solo en la
   * pantalla porque el motor de redaccion tambien tiene que saberlo — a un
   * modelo al que se le entrega una ficha sin fundamento hay que PROHIBIRLE
   * expresamente inventarle uno, que es justo lo que hace por defecto.
   */
  firmDefined?: boolean;
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
  /*
   * POR REMISION: la ficha vive en otra rama y esta rama la ALCANZA, sin que
   * su plazo se afirme aqui.
   *
   * No es lo mismo que `transversal`. Lo transversal es una actuacion que se
   * ejerce ante cualquier autoridad y cuyo termino es el mismo en todas —el
   * derecho de peticion son quince dias lo mismo ante la UGPP que ante el
   * INPEC—, asi que la ficha se muestra tal cual. Aqui es al reves: el recurso
   * de reposicion EXISTE en familia, en societario y en insolvencia porque el
   * Codigo General del Proceso las gobierna, pero nadie leyo si su plazo es el
   * mismo, y el CPACA ya demostro que puede no serlo (diez dias en vez de
   * tres). Por eso el sobre llega con el termino degradado a NO_VERIFICADO.
   *
   * El sobre lo pone el servicio al listar, no el dato: la ficha del catalogo
   * es UNA sola y no se copia. Duplicarla obligaria a verificar cada copia por
   * separado, que es exactamente lo que el comentario de `transversal` ya
   * declara como el defecto a evitar.
   */
  porRemision?: SobreDeRemision;
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
  /*
   * LA RAMA EN LA QUE SE VERIFICO, y null cuando es la rama propia de la ficha.
   *
   * Hizo falta el dia en que una ficha empezo a aparecer en varias ramas por
   * remision. `civil/recurso-de-reposicion` es UNA ficha; si la firma verifica
   * su plazo para FAMILIA y eso se guardara solo contra el id, el termino que
   * acaba de escribir para familia sustituiria al del proceso civil, que es
   * otro y esta verificado. Verificar en una rama no puede mover el reloj de
   * otra: la clave es rama + id.
   */
  rama: LegalBranch | null;
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
  /** Rama en la que se verifica. null o ausente = la rama propia de la ficha. */
  rama?: LegalBranch | null;
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


/**
 * Una actuacion que la firma anadio a una rama porque el catalogo no la trae.
 *
 * NACE SIN NORMA VERIFICADA, y esa es su condicion normal, no un defecto: el
 * abogado escribio un nombre, no una ficha. Se ofrece igual porque la
 * alternativa real no era una ficha mejor sino redactar bajo una actuacion que
 * no es la suya, o no redactar.
 *
 * Los campos opcionales son la puerta de salida de esa condicion: cuando la
 * firma escribe el termino Y su fuente en la pantalla de Catalogo — el mismo
 * formulario con el que cura una ficha de fabrica — la actuacion deja de
 * mostrarse advertida. El termino sin la fuente no basta, ni aqui ni en la
 * base: `chk_firm_actuacion_unverified_has_no_term`.
 */
export interface FirmActuacion {
  /** Slug derivado de area + nombre, p. ej. 'civil/demanda-de-oposicion'. */
  id: string;
  area: LegalBranch;
  exactName: string;
  role: ActuacionRole;
  /** Nace NO_VERIFICADO. Solo la curaduría de la firma lo mueve. */
  termStatus: TermStatus;
  legalBasis: string | null;
  termDescription: string | null;
  sourceUrl: string | null;
  note: string | null;
  createdBy: string;
  createdAt: string;
}

/** Lo que llega al crear una actuacion propia. Se valida antes de escribirla. */
export interface FirmActuacionInput {
  area: string;
  exactName: string;
  role?: string;
  note?: string | null;
  createdBy: string;
}
