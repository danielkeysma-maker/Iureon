import { catalogService } from '../catalog/catalog.service';
import { esTituloDeTrabajo, objetivoDelTitulo } from '../catalog/tituloDeTrabajo';
import type { Actuacion, LegalBranch } from '../catalog/types';

/**
 * Turns a catalogued actuación into the block Claude drafts against.
 *
 * The point of the catalogue is that the model no longer supplies procedural
 * facts from memory. When an actuación is known, the article, the competent
 * authority and the mandatory sections are handed to it verbatim, and it is
 * told not to invent any others.
 */

const formatSections = (actuacion: Actuacion): string =>
  actuacion.requiredSections
    .map((section) => {
      const flag = section.mandatory ? ' [OBLIGATORIA]' : '';
      const basis = section.basis ? ` (${section.basis})` : '';
      return `${section.n}. ${section.name}${flag}${basis}`;
    })
    .join('\n');

const formatTerm = (actuacion: Actuacion): string => {
  switch (actuacion.term.status) {
    case 'NO_CADUCA':
      return `TÉRMINO: ${actuacion.term.description}`;
    case 'VERIFICADO':
      return `TÉRMINO DE CADUCIDAD: ${actuacion.term.description}`;
    default:
      // Never let the model fill this in. An invented deadline is worse than
      // an acknowledged gap, because the lawyer would act on it.
      return 'TÉRMINO: no verificado en el catálogo. NO afirmes ningún término ni caducidad para esta actuación; si es relevante, indica que debe verificarse en la norma aplicable.';
  }
};

/**
 * Lo que se le dice al modelo cuando la actuación la escribió la FIRMA.
 *
 * ─── POR QUÉ NECESITA BLOQUE PROPIO ─────────────────────────────────────────
 *
 * El bloque normal empieza diciendo «los siguientes datos fueron verificados
 * contra el texto de la norma». Para una actuación propia eso sería falso, y
 * peor: le daría al modelo permiso para completar los huecos con lo que
 * recuerde. Un modelo al que se le entrega una ficha vacía bajo un
 * encabezamiento de ficha verificada no deja el artículo en blanco — lo
 * inventa, con la misma confianza con la que escribe el resto.
 *
 * Así que aquí se invierte la instrucción: no hay ficha, no la fabriques, y
 * DILO en el escrito. Que el documento salga declarando que su término no está
 * verificado es exactamente lo que se busca: el abogado firma sabiendo qué
 * comprobar, en vez de leer un plazo que nadie leyó.
 */
const renderFirmDefinedGuidance = (actuacion: Actuacion): string => {
  const curada = actuacion.term.status !== 'NO_VERIFICADO';

  /*
   * EL CAMINO SIN NOMBRE ENTRA POR AQUÍ, y entra a propósito por el MISMO
   * bloque y no por uno paralelo.
   *
   * Lo que hay que decirle al motor es idéntico en los dos casos —no hay ficha,
   * no la fabriques, y dilo en el escrito—, y dos bloques que dicen lo mismo
   * divergen: el día que alguien endurezca uno, el otro se queda con la
   * redacción vieja y nadie se entera hasta leer un borrador que afirma un
   * artículo. Lo único que cambia aquí es CÓMO SE LLAMA la cosa que se escribe,
   * porque de un título de trabajo hay que decir además que no es el nombre de
   * una figura jurídica.
   */
  const trabajo = esTituloDeTrabajo(actuacion.exactName);
  const objetivo = trabajo ? objetivoDelTitulo(actuacion.exactName) : '';

  const aportado = curada
    ? `
LO QUE LA FIRMA SÍ COMPROBÓ Y PUEDES USAR:
FUNDAMENTO NORMATIVO (aportado por la firma): ${actuacion.legalBasis}
${actuacion.term.status === 'NO_CADUCA' ? 'TÉRMINO' : 'TÉRMINO DE CADUCIDAD'} (aportado por la firma): ${actuacion.term.description}
${actuacion.sourceUrl ? `FUENTE: ${actuacion.sourceUrl}` : ''}
No añadas ningún otro artículo, plazo ni requisito a los anteriores.`
    : `
NO HAY TÉRMINO NI ARTÍCULO. No afirmes ninguno.
EN EL PROPIO ESCRITO debes dejar constancia, con palabras llanas, de que el término aplicable a esta actuación no está verificado y debe comprobarse en la norma antes de radicar. No lo escondas en una nota al pie: dilo donde se lea.`;

  /*
   * LA PROHIBICIÓN DE BAUTIZAR VA ANTES QUE TODO LO DEMÁS, y no al final.
   *
   * «Recurso de reposición» no es una etiqueta: es una figura con su artículo,
   * su término y su autoridad, y ponerle ese nombre a un escrito que nadie
   * verificó afirma las tres cosas sin haber leído ninguna norma. Un modelo al
   * que se le entrega un objetivo en prosa y ningún nombre lo primero que hace
   * es escoger uno del oficio, con toda naturalidad, en el encabezamiento.
   */
  const encabezado = trabajo
    ? `ESCRITO SIN NOMBRE DE ACTUACIÓN — lo que la firma quiere lograr: "${objetivo}"

NADIE LE PUSO NOMBRE A ESTA ACTUACIÓN, Y TÚ TAMPOCO SE LO PONES. Lo de arriba es un TÍTULO DE TRABAJO descriptivo escrito por el abogado, no la denominación jurídica de ninguna figura. PROHIBIDO llamar al escrito "recurso de reposición", "acción de tutela", "incidente", "nulidad" ni ninguna otra figura del ordenamiento colombiano, ni en el título, ni en el encabezamiento, ni en la referencia, ni en el cuerpo, ni al describir lo que se presenta. Encabézalo diciendo qué se pide y ante quién, con las palabras del objetivo.`
    : `ACTUACIÓN DEFINIDA POR LA FIRMA — "${actuacion.exactName}"`;

  /*
   * Con nombre, el escrito ES de esa clase y se dice así. Sin nombre no hay
   * clase que nombrar, así que lo que gobierna la estructura es el objetivo.
   */
  const queEscribes = trabajo
    ? `QUÉ ESCRIBES, DE TODAS FORMAS: un escrito completo dirigido a lograr "${objetivo}"`
    : `QUÉ ESCRIBES, DE TODAS FORMAS: un "${actuacion.exactName}" completo`;

  return `${encabezado}

ESTA ACTUACIÓN NO TIENE FICHA VERIFICADA EN EL CATÁLOGO. La añadió la propia firma porque el catálogo no la trae, y nadie ha comprobado contra la norma su artículo, su término ni las secciones que debe contener.

PROHIBIDO INVENTAR, y esta prohibición manda sobre la línea de NORMATIVIDAD del encargo: no escribas números de artículo, no afirmes plazos, términos ni caducidades, y no digas de ninguna sección que una norma la exige. Si un requisito te parece necesario, descríbelo en palabras y di que debe verificarse; jamás le pongas una cita que no te hayan entregado aquí.
${aportado}

${queEscribes}, con la estructura usual de esa clase de escrito en la práctica colombiana y con sus TÍTULOS DE SECCIÓN escritos —encabezamiento y destinatario, referencia, presentación del apoderado, hechos, fundamentos, petición, pruebas, anexos, notificaciones y firma, o los que esa clase de escrito pida—. Cada título va solo en su línea, en mayúscula sostenida y entre **dobles asteriscos**, igual que en cualquier otro escrito.

NO HAY CONTRADICCIÓN ENTRE LAS DOS REGLAS ANTERIORES, y conviene tenerlo claro: no tener ficha verificada te prohíbe AFIRMAR el artículo, el plazo o que la norma exige tal sección; no te autoriza a entregar un texto corrido sin títulos ni a escribir una pieza procesal distinta de la que se pidió. La estructura es del oficio; la cita es de la norma. Preséntala como la práctica usual, nunca como impuesta por una norma que nadie comprobó.`;
};

/**
 * Renders the guidance block for an already-resolved actuación, or null when
 * none was catalogued — in which case the caller keeps its previous reference
 * structure.
 *
 * Pure on purpose: resolution (which may consult the firm's own verifications
 * over the network) happens in the caller, so this stays synchronously testable.
 */
export const renderCatalogGuidance = (actuacion: Actuacion | null): string | null => {
  if (!actuacion) return null;

  if (actuacion.firmDefined) return renderFirmDefinedGuidance(actuacion);

  const curated = actuacion.verification
    ? `\nORIGEN DEL DATO: verificado por la firma (${actuacion.verification.verifiedBy}). Prevalece sobre el catálogo base.`
    : '';

  const authority = actuacion.competentAuthority
    ? `\nAUTORIDAD COMPETENTE: ${actuacion.competentAuthority}`
    : '';

  return `CATÁLOGO PROCESAL VERIFICADO — "${actuacion.exactName}"

Los siguientes datos fueron verificados contra el texto de la norma. Úsalos como fuente autorizada y NO los contradigas ni los sustituyas por lo que recuerdes.

FUNDAMENTO NORMATIVO: ${actuacion.legalBasis}${authority}${curated}
${formatTerm(actuacion)}

ESTRUCTURA EXIGIDA POR LA NORMA (las marcadas [OBLIGATORIA] no pueden omitirse):
${formatSections(actuacion)}

REGLA DE CITACIÓN: cita únicamente los artículos indicados arriba y aquellos que conozcas con certeza. Si necesitas un requisito que no aparece en esta lista, descríbelo sin inventar el número de artículo.`;
};

/** Shipped-catalogue guidance, with no firm curation applied. */
export const buildCatalogGuidance = (
  documentType: string,
  branch?: LegalBranch
): string | null => renderCatalogGuidance(catalogService.findByDocumentType(documentType, branch));

/**
 * Guidance for one firm: the shipped catalogue with that firm's own verified
 * corrections overlaid. This is what closes the loop — a term confirmed once in
 * the curation screen reaches every later draft without a code change.
 */
export const buildCatalogGuidanceForFirm = async (
  firmId: string,
  documentType: string,
  branch?: LegalBranch
): Promise<string | null> => {
  const { actuacion } = await catalogService.resolveForFirm(firmId, documentType, branch);
  return renderCatalogGuidance(actuacion);
};

export const findCatalogedActuacion = (documentType: string): Actuacion | null =>
  catalogService.findByDocumentType(documentType);

/**
 * La procedencia del borrador: contra qué ficha del catálogo se redactó.
 *
 * ─── POR QUÉ VIAJA CON EL BORRADOR Y NO SE QUEDA EN EL PROMPT ───────────────
 *
 * El motor ya resolvía la actuación para instruir al modelo y la DESCARTABA al
 * responder. El abogado recibía un escrito que afirma un plazo sin poder saber
 * de dónde salió, ni si alguien lo verificó, ni si su firma lo corrigió. El
 * artboard 5a pide revisar «lo sin verificar» ANTES de exportar, y esto es lo
 * único que el producto sabe de verdad sobre ese punto: no cuántas frases del
 * texto están sin respaldo —eso no se mide—, sino si la ficha que gobierna el
 * escrito tiene su término comprobado y su fuente.
 *
 * Decir eso es exacto. Contar «2 afirmaciones sin verificar» sobre un texto que
 * nadie analizó sería una cifra inventada en la pantalla donde se decide firmar.
 */
export interface ProcedenciaDelBorrador {
  actuacionId: string;
  exactName: string;
  legalBasis: string;
  sourceUrl: string | null;
  competentAuthority: string | null;
  termStatus: Actuacion['term']['status'];
  termDescription: string | null;
  /** La firma corrigió o confirmó esta ficha en su pantalla de curaduría. */
  curadaPorLaFirma: boolean;
  /** La actuación entera la añadió la firma: ninguna norma verificada la respalda. */
  definidaPorLaFirma: boolean;
  curadaPor: string | null;
  /** Secciones que el escrito debe traer y cuyo artículo no está confirmado. */
  seccionesSinArticulo: number;
  seccionesTotales: number;
}

export const resolverProcedencia = async (
  firmId: string | null | undefined,
  documentType: string,
  branch?: LegalBranch
): Promise<ProcedenciaDelBorrador | null> => {
  const { actuacion } = await catalogService.resolveForFirm(firmId, documentType, branch);
  if (!actuacion) return null;

  return {
    actuacionId: actuacion.id,
    exactName: actuacion.exactName,
    legalBasis: actuacion.legalBasis,
    sourceUrl: actuacion.sourceUrl,
    competentAuthority: actuacion.competentAuthority,
    termStatus: actuacion.term.status,
    termDescription: actuacion.term.description,
    curadaPorLaFirma: Boolean(actuacion.verification),
    definidaPorLaFirma: Boolean(actuacion.firmDefined),
    curadaPor: actuacion.verification?.verifiedBy ?? null,
    seccionesSinArticulo: actuacion.requiredSections.filter((s) => !s.basis).length,
    seccionesTotales: actuacion.requiredSections.length
  };
};
