import { JUDICIAL_DOCUMENT_STRUCTURES } from './data/structures.judicial';
import { LITIGATION_DOCUMENT_STRUCTURES } from './data/structures.litigation';

const DOCUMENT_STRUCTURES: Record<string, string> = {
  ...LITIGATION_DOCUMENT_STRUCTURES,
  ...JUDICIAL_DOCUMENT_STRUCTURES
};

/**
 * Resolves the reference structure for a document type.
 *
 * Lookup runs in three passes, widest confidence first: an exact key match,
 * then a substring match in either direction (the dropdown label and the map
 * key rarely agree verbatim), and finally a keyword inference that yields a
 * generic skeleton. The last pass matters because an unmatched type would
 * otherwise leave Claude with no structural guidance at all.
 */
export const resolveDocumentStructure = (documentType: string): string => {
  const docLower = documentType.toLowerCase().trim();

  if (DOCUMENT_STRUCTURES[docLower]) {
    return DOCUMENT_STRUCTURES[docLower];
  }

  for (const [key, value] of Object.entries(DOCUMENT_STRUCTURES)) {
    if (docLower.includes(key) || key.includes(docLower)) {
      return value;
    }
  }

  let estructuraObligatoria = '';
  const estructurasPorTipo = DOCUMENT_STRUCTURES;

  if (docLower.includes('tutela') && !docLower.includes('contestación') && !docLower.includes('sentencia')) {
        estructuraObligatoria = estructurasPorTipo['redacción de acción de tutela'];
      } else if (docLower.includes('contestación') || docLower.includes('contestacion')) {
        estructuraObligatoria = `CONTESTACIÓN DE DEMANDA:\n1. Encabezado (ciudad, fecha, despacho)\n2. Referencia (radicado, partes)\n3. Pronunciamiento sobre CADA HECHO (acepta, niega, no le consta)\n4. EXCEPCIONES DE MÉRITO (OBLIGATORIO)\n5. FUNDAMENTOS DE DERECHO\n6. OPOSICIÓN A LAS PRETENSIONES punto por punto (OBLIGATORIO)\n7. PRUEBAS\n8. NOTIFICACIONES\n9. Firma del apoderado`;
      } else if (docLower.includes('petición') || docLower.includes('peticion')) {
        estructuraObligatoria = estructurasPorTipo['acción de cumplimiento']?.replace('ACCIÓN DE CUMPLIMIENTO', 'DERECHO DE PETICIÓN') || `DERECHO DE PETICIÓN (Ley 1755/2015):\n1. Encabezado\n2. Destinatario\n3. Ref: DERECHO DE PETICIÓN\n4. Peticionario\n5. HECHOS numerados\n6. FUNDAMENTOS DE DERECHO\n7. PETICIÓN CONCRETA (OBLIGATORIO — NO OMITIR)\n8. Pruebas\n9. Notificaciones\n10. Firma`;
      } else if (docLower.includes('demanda') || docLower.includes('ejecutiva')) {
        estructuraObligatoria = `DEMANDA:\n1. Encabezado\n2. Juez competente\n3. Demandante y demandado\n4. Clase de proceso y cuantía\n5. PRETENSIONES numeradas (OBLIGATORIO)\n6. HECHOS numerados\n7. FUNDAMENTOS DE DERECHO\n8. PRUEBAS\n9. CUANTÍA\n10. ANEXOS\n11. NOTIFICACIONES\n12. Firma`;
      } else if (docLower.includes('recurso') || docLower.includes('apelación') || docLower.includes('casación') || docLower.includes('impugnación')) {
        estructuraObligatoria = `RECURSO/IMPUGNACIÓN:\n1. Encabezado\n2. Referencia (providencia impugnada)\n3. Legitimación\n4. CARGOS/AGRAVIOS numerados (OBLIGATORIO)\n5. FUNDAMENTOS DE DERECHO\n6. PETICIÓN AL SUPERIOR (OBLIGATORIO)\n7. NOTIFICACIONES\n8. Firma`;
      } else if (docLower.includes('sentencia')) {
        estructuraObligatoria = `SENTENCIA:\n1. REPÚBLICA DE COLOMBIA — RAMA JUDICIAL\n2. Despacho, radicado, partes\n3. ANTECEDENTES\n4. HECHOS PROBADOS\n5. PROBLEMA JURÍDICO\n6. CONSIDERACIONES\n7. RESUELVE: PRIMERO, SEGUNDO, TERCERO... (OBLIGATORIO)\n8. Cúmplase y notifíquese\n9. Firma del Juez`;
      } else if (docLower.includes('auto')) {
        estructuraObligatoria = `AUTO INTERLOCUTORIO:\n1. REPÚBLICA DE COLOMBIA — RAMA JUDICIAL\n2. Despacho, radicado, partes\n3. CONSIDERACIONES (fundamento fáctico y jurídico)\n4. RESUELVE: PRIMERO, SEGUNDO... (OBLIGATORIO)\n5. Cúmplase y notifíquese\n6. Firma del Juez`;
      } else {
        estructuraObligatoria = `ESTRUCTURA PROCESAL GENERAL:\n1. Encabezado (ciudad, fecha, destinatario/juez)\n2. Referencia\n3. Partes\n4. HECHOS numerados\n5. FUNDAMENTOS DE DERECHO\n6. PETICIÓN / PRETENSIONES / RESUELVE (OBLIGATORIO — NO OMITIR)\n7. PRUEBAS\n8. NOTIFICACIONES\n9. Firma`;
  }

  return estructuraObligatoria;
};
