import { resolveDocumentStructure } from './documentStructures';
import { buildCatalogGuidance } from './catalogGuidance';

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
  gptSchemaOutput?: string;
  existingDraft?: string;
  adjuntos?: string;
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
  const guidance =
    catalogGuidance === undefined ? buildCatalogGuidance(documentType) : catalogGuidance;
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
  return `
REGLA ABSOLUTA: Responde EXCLUSIVAMENTE con el texto del documento jurídico. Sin comentarios, advertencias, explicaciones ni meta-texto. Comienza directamente con el encabezado del escrito.

REGLA DE COMPLETITUD: El documento DEBE estar COMPLETO de principio a fin hasta la firma. La sección de PETICIÓN/PRETENSIONES/RESUELVE es la MÁS IMPORTANTE — si la omites, el documento es inservible. NUNCA lo dejes incompleto.

REGLA DE FORMATO: NO uses encabezados markdown (##, ###). NO uses separadores (---). USA **negritas** ÚNICAMENTE para: títulos de secciones (I. HECHOS, II. PRETENSIONES, RESUELVE), numerales resolutivos (PRIMERO:, SEGUNDO:), nombres propios de partes y entidades, y términos jurídicos clave como CONCEDER, NEGAR, TUTELAR, ORDENAR. NO pongas **negritas** en párrafos completos ni en texto normal de argumentación.

PERFIL: Abogado litigante senior y redactor judicial de élite en Colombia, 25 años de experiencia ante Corte Constitucional, CSJ, Consejo de Estado y Tribunales.
${continuationBlock}
TAREA: ${existingDraft ? 'Continuar, corregir o proyectar a partir del borrador existente según la indicación del usuario' : 'Redactar ÍNTEGRAMENTE, COMPLETO y listo para firmar'}: "${documentType}".

INDICACIÓN DEL USUARIO: "${prompt}".
${reglaAdjuntos}
NORMATIVIDAD: Cita artículos pertinentes de CGP, CST, CPACA, CP, C. Civil, C. Penal, Ley 1755/2015, Decreto 2591/1991, Ley 906/2004, Ley 472/1998 o la que corresponda.

${renderJurisprudencia(citations)}

${`GUÍA DE REFERENCIA para "${documentType}" (usa tu criterio jurídico para estructurar el documento como mejor corresponda según la práctica procesal colombiana, pero asegúrate de NO OMITIR la sección de petición/pretensiones/resuelve):\n${estructuraObligatoria}`}
${customFormat ? `\n⚠️ FORMATO DE LA FIRMA — manda sobre la PRESENTACIÓN (numeración, títulos, orden de secciones, bloque de firma). NO autoriza omitir ninguna sección marcada [OBLIGATORIA] arriba: esas las exige la norma, no el estilo de la casa.\n${customFormat}` : ''}
    `;
};

/** Builds Claude's user message, carrying GPT's outline so it need not re-derive structure. */
export const buildClaudeUserMessage = ({
  documentType,
  prompt,
  facts,
  citations,
  gptSchemaOutput,
  existingDraft,
  adjuntos
}: ClaudeUserMessageInput): string => {
  const schemaBlock = gptSchemaOutput
    ? `\nESQUEMA DOGMÁTICO (generado por GPT-5.6 Sol — úsalo como guía de estructura):\n${gptSchemaOutput}\n`
    : '';
  // After the facts and before the citations: the writer reads the file data
  // next to Gemini's extraction, which already leaned on the same block.
  const adjuntosBlock = adjuntos ? `\n\n${adjuntos}\n` : '';

  return existingDraft
    ? `Instrucción del usuario: "${prompt}".${schemaBlock}Insumos fácticos de Gemini: ${facts}.${adjuntosBlock}

${renderJurisprudencia(citations)}

Toma el borrador existente como base y aplica las correcciones. Entrega el documento COMPLETO resultante.`
    : `Genera el documento jurídico "${documentType}" COMPLETO hasta la firma.${schemaBlock}Hechos extraídos por Gemini: ${facts}.${adjuntosBlock}

${renderJurisprudencia(citations)}

El documento debe estar COMPLETO incluyendo PETICIÓN/PRETENSIONES/RESUELVE.`;
};
