import { resolveDocumentStructure } from './documentStructures';
import { buildCatalogGuidance, REGLA_DE_CITACION_REDACCION } from './catalogGuidance';
import { esTituloDeTrabajo, objetivoDelTitulo } from '../catalog/tituloDeTrabajo';

/**
 * Cómo se nombra el encargo dentro del prompt.
 *
 * ─── POR QUÉ NO BASTA CON EL BLOQUE DEL CATÁLOGO ────────────────────────────
 *
 * `catalogGuidance` ya le prohíbe al motor bautizar figuras cuando el escrito
 * no tiene nombre. Pero este prompt repite el `documentType` CUATRO veces por
 * su cuenta —la tarea, la regla de la actuación, la estructura y el mensaje de
 * usuario— y una de esas repeticiones le ORDENA que «su nombre debe leerse en
 * el encabezado o en el asunto del escrito». Con un título de trabajo eso haría
 * que el escrito saliera encabezado «SIN NOMBRE — QUE SE LEVANTE EL EMBARGO»,
 * que es peor que inventar la figura: es enseñarle la costura al juez.
 *
 * Así que el nombre se traduce UNA vez, aquí, y las cuatro repeticiones usan lo
 * traducido.
 */
const comoSeLlamaElEncargo = (documentType: string): { esTitulo: boolean; encargo: string } =>
  esTituloDeTrabajo(documentType)
    ? { esTitulo: true, encargo: objetivoDelTitulo(documentType) }
    : { esTitulo: false, encargo: documentType };


interface ClaudePromptInput {
  documentType: string;
  prompt: string;
  citations: string[];
  customFormat?: string;
  existingDraft?: string;
  /**
   * Guidance already resolved for the firm, including its own curated terms.
   * Omitted only by callers with no tenant in hand, which then fall back to the
   * shipped catalogue.
   */
  catalogGuidance?: string | null;
  /**
   * The block rendered from the files the lawyer attached (see
   * `adjuntos/renderBloqueAdjuntos`). Empty or absent when nothing was read.
   */
  adjuntos?: string;
}

interface ClaudeUserMessageInput {
  documentType: string;
  prompt: string;
  facts: string;
  citations: string[];
  existingDraft?: string;
  adjuntos?: string;
  /**
   * El mismo bloque que recibe el prompt de sistema. Solo se usa para saber si
   * hay ficha verificada y, en tal caso, repetir aquí la regla de citación —la
   * jurisprudencial se repite en las dos ramas de este mensaje desde agosto, y
   * la de normas no; esa asimetría es la que se midió.
   */
  catalogGuidance?: string | null;
}

/**
 * Builds Claude's system prompt.
 *
 * The formatting rule is load-bearing: the viewer and both exporters render
 * `**bold**` as real bold and strip markdown headings, so emitting `##` or
 * `---` would surface as literal noise in the signed document.
 *
 * A firm's taught format ("Enseñar Estilo") replaces the reference structure
 * entirely rather than being appended to it.
 */
/**
 * Renders the jurisprudence section — including, above all, its absence.
 *
 * THE DEFECT THIS REPLACES. The line joined the citations with a semicolon
 * after a bare label. With nothing found, that rendered as the two words `JURISPRUDENCIA: .` — an
 * empty field, two lines below an instruction to cite. A model does not read a
 * blank as "there is none"; it reads it as a slot, and it fills slots. This
 * codebase already shipped a draft citing SU-049 de 2022, a providencia that
 * does not exist, and twenty dockets in the shape TSB-LAB-2024-1102 that no
 * Colombian court issues.
 *
 * So silence is now stated. Everything listed here passed through the State's
 * own register, and the model is told both facts: these exist, and nothing else
 * may be added to them.
 */
export const renderJurisprudencia = (citations: string[]): string =>
  citations.length > 0
    ? `JURISPRUDENCIA VERIFICADA — la existencia de cada una fue confirmada contra el registro oficial de la corporación que la profirió:
${citations.map((c) => `- ${c}`).join('\n')}

REGLA DE CITACIÓN JURISPRUDENCIAL: cita ÚNICAMENTE las providencias de esta lista. NO agregues otras de memoria, ni siquiera si estás seguro de que existen: una sola cita sin comprobar invalida el escrito ante el despacho.`
    : `JURISPRUDENCIA: NINGUNA. El corpus verificado no tiene providencias para este asunto y la búsqueda en el registro oficial tampoco devolvió ninguna.

REGLA DE CITACIÓN JURISPRUDENCIAL: NO cites ninguna sentencia, auto ni providencia. No escribas radicados, no escribas magistrados ponentes, no escribas años de providencias. Si el argumento necesita respaldo jurisprudencial, sustenta con la norma y señala en el texto que el precedente aplicable debe verificarse antes de presentar. Un radicado inventado es peor que su ausencia, porque el abogado lo firma.`;

export const buildClaudeDraftPrompt = ({
  documentType,
  prompt,
  citations,
  customFormat,
  existingDraft,
  catalogGuidance,
  adjuntos
}: ClaudePromptInput): string => {
  // A catalogued actuación supplies the article, the deadline and the
  // norm-mandated sections. Only when the actuación is not catalogued yet does
  // the older free-text reference structure apply.
  const { esTitulo, encargo } = comoSeLlamaElEncargo(documentType);
  const guidance =
    catalogGuidance === undefined
      ? buildCatalogGuidance(documentType, undefined, 'REDACCION')
      : catalogGuidance;
  const estructuraObligatoria = guidance ?? resolveDocumentStructure(documentType);
  const continuationBlock = existingDraft
    ? `\nMODO CONTINUACIÓN/CORRECCIÓN: El usuario tiene un borrador previo que quiere que continúes, corrijas o proyectes. Tu tarea es tomar ese borrador como base y aplicar las instrucciones del usuario. Entrega el documento COMPLETO resultante (no solo la parte modificada).\n\nBORRADOR EXISTENTE:\n"""\n${existingDraft}\n"""\n`
    : '';
  /*
   * Only when something was read. The rule names the attachments as a source,
   * and naming a source that does not exist invites the model to imagine it.
   * When present it settles the two cases that matter: a datum from the file
   * is used verbatim — never turned back into a [•] marker, which is the exact
   * defect this block exists to end — and a conflict between the file and the
   * lawyer is resolved for the lawyer, visibly.
   */
  const reglaAdjuntos = adjuntos
    ? `\nREGLA DE LOS ADJUNTOS: Los datos que vienen de los adjuntos se usan tal cual y no se reemplazan por marcadores; si el adjunto y el abogado se contradicen, prevalece lo que escribió el abogado y se anota entre corchetes la discrepancia.\n`
    : '';
  /*
   * ─── LA LÍNEA DE NORMATIVIDAD NO SE EMITE CUANDO OTRO BLOQUE MANDA ────────
   *
   * `NORMATIVIDAD: Cita artículos pertinentes de CGP, CST, CPACA, CP, C. Civil…
   * o la que corresponda.` es ANTERIOR al catálogo —viene del 29 de julio de
   * 2026, de cuando el prompt vivía en `openrouter.service.ts`— y nunca se
   * revisó cuando el catálogo entró, el 11 de agosto. Es un mandato afirmativo
   * con lista abierta, nombra expresamente el C. Civil, y de ahí salieron los
   * arts. 2000, 2005 y 2035 del borrador medido.
   *
   * Hasta hoy solo estaba neutralizada en la rama SIN ficha (la actuación propia
   * de la firma), que es la menos peligrosa. Los tres jueces coincidieron en que
   * este era el injerto más barato y el que más rinde: mientras esa línea siga
   * saliendo junto a una lista cerrada, el prompt se contradice a sí mismo y el
   * modelo obedece a la orden más antigua, que es la que nombra el código.
   *
   * NO SE BORRA DEL TODO, y la distinción importa: sin ficha ni bloque que
   * reclame precedencia —el camino de `resolveDocumentStructure`— no hay nada
   * verificado que citar y quitarla dejaría el escrito sin ninguna orden de
   * fundamentar. La condición es exactamente esa: se suprime cuando el bloque
   * de arriba DECLARA que manda sobre ella. Las dos ramas del catálogo lo
   * declaran hoy; si alguien escribe una tercera que no lo declare, la línea
   * vuelve a salir sola, que es el lado seguro del fallo.
   */
  const otroBloqueManda = Boolean(guidance?.includes('manda sobre la línea de NORMATIVIDAD'));
  const lineaNormatividad = otroBloqueManda
    ? ''
    : '\nNORMATIVIDAD: Cita artículos pertinentes de CGP, CST, CPACA, CP, C. Civil, C. Penal, Ley 1755/2015, Decreto 2591/1991, Ley 906/2004, Ley 472/1998 o la que corresponda.\n';

  /*
   * Y LA REGLA DE CITACIÓN SE REPITE ARRIBA, fuera del rótulo «ESTRUCTURA».
   *
   * El bloque del catálogo entero se inyecta como `estructuraObligatoria`, es
   * decir bajo un encabezado que anuncia formato y en último lugar. La regla de
   * jurisprudencia, en cambio, se emite tres veces y en primer plano — y esa
   * asimetría de colocación es el mapa exacto de lo medido: 0 providencias
   * inventadas contra 23 artículos fuera de la ficha. Se corrige aquí, donde
   * estaba la orden que contradecía.
   */
  const reglaDeCitacion =
    guidance && guidance.includes(REGLA_DE_CITACION_REDACCION) ? `\n${REGLA_DE_CITACION_REDACCION}\n` : '';

  return `
REGLA ABSOLUTA: Responde EXCLUSIVAMENTE con el texto del documento jurídico. Sin comentarios, advertencias, explicaciones ni meta-texto. Comienza directamente con el encabezado del escrito.

REGLA DE COMPLETITUD: El documento DEBE estar COMPLETO de principio a fin hasta la firma. La sección de PETICIÓN/PRETENSIONES/RESUELVE es la MÁS IMPORTANTE — si la omites, el documento es inservible. NUNCA lo dejes incompleto.

REGLA DE FORMATO: NO uses encabezados markdown (##, ###). NO uses separadores (---).
El escrito SIEMPRE va dividido en secciones, y CADA título de sección va SOLO en su propia línea, en MAYÚSCULA SOSTENIDA y entre dobles asteriscos: **I. HECHOS**, **II. PRETENSIONES**, **RESUELVE**. Rige tenga o no tenga ficha verificada la actuación: un escrito redactado de corrido, sin títulos de sección, llega al abogado sin una sola negrita.
USA **negritas** ÚNICAMENTE para: títulos de secciones, numerales resolutivos (PRIMERO:, SEGUNDO:), nombres propios de partes y entidades, y términos jurídicos clave como CONCEDER, NEGAR, TUTELAR, ORDENAR. NO pongas **negritas** en párrafos completos ni en texto normal de argumentación.

PERFIL: Abogado litigante senior y redactor judicial de élite en Colombia, 25 años de experiencia ante Corte Constitucional, CSJ, Consejo de Estado y Tribunales.
${continuationBlock}
TAREA: ${existingDraft ? 'Continuar, corregir o proyectar a partir del borrador existente según la indicación del usuario' : 'Redactar ÍNTEGRAMENTE, COMPLETO y listo para firmar'}: ${esTitulo ? `un escrito dirigido a lograr "${encargo}"` : `"${encargo}"`}.

${
  esTitulo
    ? `REGLA DEL ENCARGO — manda sobre cualquier otra consideración de este prompt: el escrito tiene que buscar EXACTAMENTE "${encargo}" y nada distinto. NO TIENE NOMBRE DE ACTUACIÓN Y NO SE LO PONES: no lo llames recurso, acción, incidente, nulidad ni ninguna otra figura del ordenamiento colombiano, ni en el título, ni en el asunto, ni en la referencia, ni en el cuerpo. En el encabezado y en el asunto va LO QUE SE PIDE, con las palabras del encargo. Si los hechos no alcanzan, redáctalo igual y deja entre corchetes lo que falte.`
    : `REGLA DE LA ACTUACIÓN — manda sobre cualquier otra consideración de este prompt: el documento tiene que ser EXACTAMENTE un "${encargo}" y ninguna otra pieza procesal. El abogado ya eligió la actuación; no la sustituyas por la que te parezca más apropiada para los hechos, ni siquiera si otra encaja mejor. Si los hechos no alcanzan, redacta igual el "${encargo}" y deja entre corchetes lo que falte. Su nombre debe leerse en el encabezado o en el asunto del escrito, y la estructura debe ser la de esa clase de escrito.`
}

INDICACIÓN DEL USUARIO: "${prompt}".
${reglaAdjuntos}${lineaNormatividad}${reglaDeCitacion}
${renderJurisprudencia(citations)}

${`ESTRUCTURA ${esTitulo ? `DEL ESCRITO QUE BUSCA "${encargo}"` : `DE "${encargo}"`} — obligatoria. Las secciones marcadas [OBLIGATORIA] no pueden omitirse y la de petición/pretensiones/resuelve JAMÁS se omite. Cada sección abre con su título en su propia línea, en mayúscula sostenida y entre **dobles asteriscos**:\n${estructuraObligatoria}`}
${customFormat ? `\n⚠️ FORMATO DE LA FIRMA — manda sobre la PRESENTACIÓN (numeración, títulos, orden de secciones, bloque de firma). NO autoriza omitir ninguna sección marcada [OBLIGATORIA] arriba: esas las exige la norma, no el estilo de la casa.\n${customFormat}` : ''}
    `;
};

/**
 * Builds Claude's user message.
 *
 * YA NO LLEVA EL ESQUEMA DOGMÁTICO, porque ya no existe quien lo produzca: la
 * etapa de GPT-5.6 Sol se retiró tras medir que cuesta entre 35 y 40 s dentro
 * de una función de 60, y abortaba en 3 de 3 corridas con el plazo que tenía
 * (ver `openrouter.service.ts`, en el sitio donde vivía). La estructura la
 * impone la ficha del catálogo, que además está verificada contra el texto de
 * la norma — cosa que el esquema nunca estuvo.
 */
export const buildClaudeUserMessage = ({
  documentType,
  prompt,
  facts,
  citations,
  existingDraft,
  adjuntos,
  catalogGuidance
}: ClaudeUserMessageInput): string => {
  // After the facts and before the citations: the writer reads the file data
  // next to Gemini's extraction, which already leaned on the same block.
  const adjuntosBlock = adjuntos ? `\n\n${adjuntos}\n` : '';
  const { esTitulo, encargo } = comoSeLlamaElEncargo(documentType);
  const reglaDeCitacion = catalogGuidance?.includes(REGLA_DE_CITACION_REDACCION)
    ? `\n${REGLA_DE_CITACION_REDACCION}\n`
    : '';

  return existingDraft
    ? `Instrucción del usuario: "${prompt}".
Insumos fácticos de Gemini: ${facts}.${adjuntosBlock}
${reglaDeCitacion}
${renderJurisprudencia(citations)}

Toma el borrador existente como base y aplica las correcciones. Entrega el documento COMPLETO resultante.`
    : `${
        esTitulo
          ? `Genera un escrito jurídico dirigido a lograr "${encargo}", COMPLETO hasta la firma y SIN ponerle nombre de figura procesal.`
          : `Genera el documento jurídico "${encargo}" COMPLETO hasta la firma.`
      }
Hechos extraídos por Gemini: ${facts}.${adjuntosBlock}
${reglaDeCitacion}
${renderJurisprudencia(citations)}

El documento debe estar COMPLETO incluyendo PETICIÓN/PRETENSIONES/RESUELVE.`;
};
