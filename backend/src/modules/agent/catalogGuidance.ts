import { catalogService } from '../catalog/catalog.service';
import { esTituloDeTrabajo, objetivoDelTitulo } from '../catalog/tituloDeTrabajo';
import type { Actuacion, LegalBranch } from '../catalog/types';
import { renderAndamiaje, universoCitable } from './andamiaje';
import type { ReferenciaNormativa } from './citacionNormativa';

/**
 * DÓNDE SE VA A LEER ESTE BLOQUE, y por qué la lista no se cierra en todas partes.
 *
 * El mismo bloque lo consumen cuatro sitios: la redacción del borrador
 * (`openrouter.service.ts`), la revisión de un escrito, el chat sobre el escrito
 * y las preguntas de audiencia. Los tres jueces pidieron por escrito que esta
 * decisión se tomara a mano en vez de dejarla implícita, y aquí está tomada:
 *
 *   REDACCION — lista CERRADA. El modelo escribe el documento que el abogado
 *   firma, así que cada artículo que ponga es un artículo firmado.
 *
 *   REVISION — lista ABIERTA, pero sin permiso para afirmar contenido. Revisar
 *   un escrito ajeno exige poder decir «le falta el artículo de los anexos», y
 *   una lista cerrada allí vuelve la revisión inútil: degradaría tres productos
 *   para arreglar uno. Lo que sí viaja a la revisión es la mitad que no cuesta
 *   nada y que arregla la mitad del defecto medido: no digas QUÉ DICE un
 *   artículo cuyo texto nadie te entregó.
 */
export type SuperficieDelBloque = 'REDACCION' | 'REVISION';

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

/*
 * ─── LA REGLA DE CITACIÓN NORMATIVA ────────────────────────────────────────
 *
 * LO QUE HABÍA AQUÍ, y por qué era la puerta. La regla decía: «cita únicamente
 * los artículos indicados arriba Y AQUELLOS QUE CONOZCAS CON CERTEZA. Si
 * necesitas un requisito que no aparece en esta lista, descríbelo sin inventar
 * el número de artículo». Era un universo cerrado seguido de una excepción sin
 * borde cuyo único juez era el propio modelo —y un modelo siempre está «con
 * certeza» del art. 2005 del Código Civil—, y su segunda frase solo prohibía
 * INVENTAR EL NÚMERO, no AFIRMAR QUÉ DICE un artículo real.
 *
 * LA MEDICIÓN QUE LO DECIDE, del 9 de septiembre de 2026. En el mismo prompt,
 * el mismo modelo y la misma pasada conviven dos reglas de citación: la
 * jurisprudencial es una LISTA CERRADA con cláusula anti-confianza («NO agregues
 * otras de memoria, ni siquiera si estás seguro de que existen») y la de normas
 * era la lista abierta de arriba. Resultado sobre la demanda de restitución:
 * CERO providencias inventadas y VEINTITRÉS artículos fuera de la ficha. No es
 * una hipótesis de diseño: es un experimento controlado que ya corrió, y lo que
 * mide es la FORMA de la regla. Así que la de normas copia la forma que funcionó.
 *
 * LOS EJEMPLOS VAN LITERALES, y no es folclore. Los tres jueces coincidieron en
 * que la instrucción abstracta no muerde y la que trae el error medido sí. Cada
 * frase entrecomillada de aquí abajo salió de uno de los dos borradores que se
 * midieron; si algún día dejan de parecer necesarias, quien las borre debería
 * volver a correr la medición antes.
 */
export const REGLA_DE_CITACION_REDACCION = `REGLA DE CITACIÓN NORMATIVA — manda sobre la línea de NORMATIVIDAD del encargo y sobre cualquier otra invitación a fundamentar en derecho que leas en este prompt.

1. LA LISTA ES CERRADA. Los únicos artículos, leyes y decretos que puedes escribir en este documento son los de la ficha de arriba y los del ANDAMIAJE PROCESAL VERIFICADO. NO agregues otros de memoria, ni siquiera si estás seguro de que existen y de que son los que corresponden a este caso. Un artículo real citado sin comprobar es indistinguible de uno inventado hasta que el juez lo lee, y para entonces el abogado ya firmó.

2. EL NÚMERO NO AUTORIZA EL CONTENIDO. De un artículo autorizado puedes escribir el número y transcribir entre comillas el texto que aparezca arriba. Si arriba no aparece su texto, NO digas qué dice, NO lo resumas entre paréntesis, NO le atribuyas un efecto jurídico y NO lo describas junto con otros en una sola frase que los cubra a todos. Está prohibido escribir «artículo 2005 (obligación de restituir la cosa arrendada al terminar el contrato)»; está prohibido escribir «sus artículos 8, 9, 22 y 35, sobre las obligaciones del arrendatario»; está prohibido escribir «su autenticidad se presume conforme al artículo 244». Los tres números existen y las tres frases suenan bien: por eso son peligrosas.

3. TAMPOCO AFIRMES CONTENIDO NORMATIVO SIN NÚMERO. Quitar la cita no vuelve comprobada la afirmación: «la ley exige restituir el inmueble al terminar el contrato» es lo mismo sin comprobar y además sin rastro. Si no tienes el texto, argumenta con los HECHOS del caso y di que el respaldo normativo debe comprobarse antes de radicar.

4. LO QUE LA FICHA DEJA ABIERTO SE QUEDA ABIERTO. Si arriba se ofrecen dos autoridades, dos trámites o dos instancias —«juez civil municipal O del circuito»—, el escrito NO escoge: menciona las dos y di, donde se lea, que la elección depende de un dato que debe verificarse antes de radicar. Y NUNCA afirmes una conclusión cuyo dato de cálculo estás dejando entre corchetes: si el salario mínimo va en $[•], la cuantía no es de menor cuantía ni de ninguna otra; escribes la operación y dejas el resultado en corchetes.

5. NO ESTIRES EL TEXTO QUE SÍ TE DIERON. Si arriba dice «no será oído hasta que consigne», escribe eso y no «so pena de que se declare la ineficacia de su contestación y demás actuaciones». Lo que la ficha no dice, no lo dices tú.

6. LOS HECHOS SON DEL ABOGADO. No des por ocurrido nada que él no haya relatado: no escribas «las prórrogas que en efecto operaron» si los hechos no lo afirman. Lo que falte va entre corchetes como dato faltante, nunca como hecho probado.

7. SI FALTA LA NORMA, FALTA Y SE DICE. Cuando un requisito, una causal o un fundamento sustancial no esté en ninguna de las dos listas, descríbelo en palabras y SIN número de artículo, y deja constancia EN EL PROPIO ESCRITO —donde se lea, no en una nota al pie— de que ese fundamento no está verificado y debe comprobarse antes de radicar.

NO HAY CONTRADICCIÓN CON LA ORDEN DE REDACTAR COMPLETO: la estructura es del oficio y no la pierdes; la cita es de la norma y esa sí está tasada. Un escrito con menos artículos y todos comprobables se firma. Uno con veintitrés artículos que nadie leyó obliga al abogado a comprobarlos todos, y por eso vale menos que ninguno.`;

/*
 * La mitad que sí viaja a revisión, chat y preguntas de audiencia. No cierra la
 * lista —allí cerrarla vuelve la revisión inútil— pero quita el permiso que de
 * verdad hizo daño: afirmar qué dice un artículo cuyo texto nadie entregó.
 */
const REGLA_DE_CITACION_REVISION = `REGLA DE CITACIÓN NORMATIVA — manda sobre la línea de NORMATIVIDAD del encargo.

Los artículos de arriba fueron leídos contra el texto oficial de la norma. Puedes nombrar otros cuando el análisis lo exija —esta superficie sirve para señalar lo que a un escrito le falta—, pero de ninguno que no esté arriba puedes AFIRMAR QUÉ DICE: nada de paréntesis explicativos, nada de glosas que cubran varios artículos a la vez, nada de atribuirle un efecto jurídico. Escribe el número y para qué lo invocas, y di que su contenido debe comprobarse. Tampoco afirmes contenido normativo sin número: quitar la cita no vuelve comprobada la afirmación. Y no cierres tú una disyuntiva que la ficha deja abierta.`;

/**
 * Renders the guidance block for an already-resolved actuación, or null when
 * none was catalogued — in which case the caller keeps its previous reference
 * structure.
 *
 * Pure on purpose: resolution (which may consult the firm's own verifications
 * over the network) happens in the caller, so this stays synchronously testable.
 */
export const renderCatalogGuidance = (
  actuacion: Actuacion | null,
  superficie: SuperficieDelBloque = 'REVISION'
): string | null => {
  if (!actuacion) return null;

  if (actuacion.firmDefined) return renderFirmDefinedGuidance(actuacion);

  const curated = actuacion.verification
    ? `\nORIGEN DEL DATO: verificado por la firma (${actuacion.verification.verifiedBy}). Prevalece sobre el catálogo base.`
    : '';

  const authority = actuacion.competentAuthority
    ? `\nAUTORIDAD COMPETENTE: ${actuacion.competentAuthority}`
    : '';

  const andamiaje =
    superficie === 'REDACCION' ? `\n\n${renderAndamiaje(actuacion.branch)}` : '';
  const regla =
    superficie === 'REDACCION' ? REGLA_DE_CITACION_REDACCION : REGLA_DE_CITACION_REVISION;

  return `CATÁLOGO PROCESAL VERIFICADO — "${actuacion.exactName}"

Los siguientes datos fueron verificados contra el texto de la norma. Úsalos como fuente autorizada y NO los contradigas ni los sustituyas por lo que recuerdes.

FUNDAMENTO NORMATIVO: ${actuacion.legalBasis}${authority}${curated}
${formatTerm(actuacion)}

ESTRUCTURA EXIGIDA POR LA NORMA (las marcadas [OBLIGATORIA] no pueden omitirse):
${formatSections(actuacion)}${andamiaje}

${regla}`;
};

/** Shipped-catalogue guidance, with no firm curation applied. */
export const buildCatalogGuidance = (
  documentType: string,
  branch?: LegalBranch,
  superficie: SuperficieDelBloque = 'REVISION'
): string | null =>
  renderCatalogGuidance(catalogService.findByDocumentType(documentType, branch), superficie);

/**
 * Guidance for one firm: the shipped catalogue with that firm's own verified
 * corrections overlaid. This is what closes the loop — a term confirmed once in
 * the curation screen reaches every later draft without a code change.
 */
export const buildCatalogGuidanceForFirm = async (
  firmId: string,
  documentType: string,
  branch?: LegalBranch,
  superficie: SuperficieDelBloque = 'REVISION'
): Promise<string | null> => {
  const { actuacion } = await catalogService.resolveForFirm(firmId, documentType, branch);
  return renderCatalogGuidance(actuacion, superficie);
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
  /*
   * EL UNIVERSO CITABLE VIAJA CON EL BORRADOR, ficha ∪ andamiaje de la rama.
   *
   * Es lo que el cedazo (`citacionNormativa.ts`) necesita para poder decir, sin
   * preguntarle al modelo, cuántas citas del escrito quedaron fuera de lo
   * verificado. La propuesta del anexo pedía ese conteo al propio redactor; los
   * tres jueces lo rechazaron por la misma razón: quien escribió «artículo 2005
   * (obligación de restituir…)» lo escribió con aplomo y no tiene motivo para
   * delatarse. La cifra la produce el código o no se produce.
   */
  articulosAutorizados: ReferenciaNormativa[];
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
    seccionesTotales: actuacion.requiredSections.length,
    /*
     * Una actuación que escribió la firma no tiene norma verificada detrás: su
     * universo citable es vacío, no «lo que traiga la rama». Darle el andamiaje
     * sería prestarle autoridad que nadie comprobó para ella.
     */
    articulosAutorizados: actuacion.firmDefined ? [] : universoCitable(actuacion)
  };
};
