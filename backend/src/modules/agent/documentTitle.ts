const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

/** Patterns that name the initiating party in Gemini's factual extraction. */
const PARTY_PATTERNS = [
  /(?:demandante|accionante|peticionario|solicitante|actor|recurrente|apelante|querellante)\s*[:—\-–]\s*([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){0,3})/i,
  /(?:señor(?:a)?|el ciudadano|la ciudadana)\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){0,3})/i
];

/** Keep filenames short: two names are enough to identify the case. */
const MAX_NAME_WORDS = 2;

/**
 * Strips the noise the dropdown labels carry — parenthesised law citations,
 * drafting verbs and leading articles — so "Redacción de la Acción de Tutela
 * (Art. 86 C.P.)" becomes "Accion_De_Tutela".
 */
const cleanDocumentType = (documentType: string): string =>
  documentType
    .replace(/\s*\(.*?\)\s*/g, '')
    .replace(/^(redacción de|proyección de|elaboración de|formulación de)\s*/i, '')
    .replace(/^(la|el|los|las|un|una|del)\s+/i, '')
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('_');

const extractPartyName = (geminiExtraction: string): string => {
  for (const pattern of PARTY_PATTERNS) {
    const match = geminiExtraction.match(pattern);

    if (match?.[1]) {
      return match[1].trim().split(/\s+/).slice(0, MAX_NAME_WORDS).join('_');
    }
  }

  return '';
};

/**
 * Builds the export filename as TipoActuacion_NombreParte_Fecha,
 * e.g. "Derecho_De_Peticion_Juan_Perez_31-Jul-2026". The party segment is
 * omitted when Gemini's extraction does not name one.
 */
export const generateCleanDocumentTitle = (documentType: string, geminiExtraction: string): string => {
  const now = new Date();
  const date = `${now.getDate()}-${MONTHS_ES[now.getMonth()]}-${now.getFullYear()}`;
  const partyName = geminiExtraction ? extractPartyName(geminiExtraction) : '';

  return [cleanDocumentType(documentType), partyName, date].filter(Boolean).join('_');
};
