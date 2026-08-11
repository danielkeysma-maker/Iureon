import { resolveDocumentStructure } from './documentStructures';
import { buildCatalogGuidance } from './catalogGuidance';

interface ClaudePromptInput {
  documentType: string;
  prompt: string;
  citations: string[];
  customFormat?: string;
  existingDraft?: string;
}

interface ClaudeUserMessageInput {
  documentType: string;
  prompt: string;
  facts: string;
  citations: string[];
  gptSchemaOutput?: string;
  existingDraft?: string;
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
export const buildClaudeDraftPrompt = ({
  documentType,
  prompt,
  citations,
  customFormat,
  existingDraft
}: ClaudePromptInput): string => {
  // A catalogued actuación supplies the article, the deadline and the
  // norm-mandated sections. Only when the actuación is not catalogued yet does
  // the older free-text reference structure apply.
  const catalogGuidance = buildCatalogGuidance(documentType);
  const estructuraObligatoria = catalogGuidance ?? resolveDocumentStructure(documentType);
  const continuationBlock = existingDraft
    ? `\nMODO CONTINUACIÓN/CORRECCIÓN: El usuario tiene un borrador previo que quiere que continúes, corrijas o proyectes. Tu tarea es tomar ese borrador como base y aplicar las instrucciones del usuario. Entrega el documento COMPLETO resultante (no solo la parte modificada).\n\nBORRADOR EXISTENTE:\n"""\n${existingDraft}\n"""\n`
    : '';
  return `
REGLA ABSOLUTA: Responde EXCLUSIVAMENTE con el texto del documento jurídico. Sin comentarios, advertencias, explicaciones ni meta-texto. Comienza directamente con el encabezado del escrito.

REGLA DE COMPLETITUD: El documento DEBE estar COMPLETO de principio a fin hasta la firma. La sección de PETICIÓN/PRETENSIONES/RESUELVE es la MÁS IMPORTANTE — si la omites, el documento es inservible. NUNCA lo dejes incompleto.

REGLA DE FORMATO: NO uses encabezados markdown (##, ###). NO uses separadores (---). USA **negritas** ÚNICAMENTE para: títulos de secciones (I. HECHOS, II. PRETENSIONES, RESUELVE), numerales resolutivos (PRIMERO:, SEGUNDO:), nombres propios de partes y entidades, y términos jurídicos clave como CONCEDER, NEGAR, TUTELAR, ORDENAR. NO pongas **negritas** en párrafos completos ni en texto normal de argumentación.

PERFIL: Abogado litigante senior y redactor judicial de élite en Colombia, 25 años de experiencia ante Corte Constitucional, CSJ, Consejo de Estado y Tribunales.
${continuationBlock}
TAREA: ${existingDraft ? 'Continuar, corregir o proyectar a partir del borrador existente según la indicación del usuario' : 'Redactar ÍNTEGRAMENTE, COMPLETO y listo para firmar'}: "${documentType}".

INDICACIÓN DEL USUARIO: "${prompt}".

NORMATIVIDAD: Cita artículos pertinentes de CGP, CST, CPACA, CP, C. Civil, C. Penal, Ley 1755/2015, Decreto 2591/1991, Ley 906/2004, Ley 472/1998 o la que corresponda.

JURISPRUDENCIA: ${citations.join('; ')}.

${customFormat ? `⚠️ LA FIRMA HA PERSONALIZADO EL FORMATO — USA ESTE FORMATO POR ENCIMA DEL DEFAULT:\n${customFormat}` : `GUÍA DE REFERENCIA para "${documentType}" (usa tu criterio jurídico para estructurar el documento como mejor corresponda según la práctica procesal colombiana, pero asegúrate de NO OMITIR la sección de petición/pretensiones/resuelve):\n${estructuraObligatoria}`}
    `;
};

/** Builds Claude's user message, carrying GPT's outline so it need not re-derive structure. */
export const buildClaudeUserMessage = ({
  documentType,
  prompt,
  facts,
  citations,
  gptSchemaOutput,
  existingDraft
}: ClaudeUserMessageInput): string => {
  const schemaBlock = gptSchemaOutput
    ? `\nESQUEMA DOGMÁTICO (generado por GPT-5.6 Sol — úsalo como guía de estructura):\n${gptSchemaOutput}\n`
    : '';

  return existingDraft
    ? `Instrucción del usuario: "${prompt}".${schemaBlock}Insumos fácticos de Gemini: ${facts}. Jurisprudencia: ${citations.join('; ')}. Toma el borrador existente como base y aplica las correcciones. Entrega el documento COMPLETO resultante.`
    : `Genera el documento jurídico "${documentType}" COMPLETO hasta la firma.${schemaBlock}Hechos extraídos por Gemini: ${facts}. Jurisprudencia: ${citations.join('; ')}. El documento debe estar COMPLETO incluyendo PETICIÓN/PRETENSIONES/RESUELVE.`;
};
