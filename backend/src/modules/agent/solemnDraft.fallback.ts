/**
 * Static Colombian pleading templates used when OpenRouter is unavailable or
 * returns an unusably short response. A lawyer gets a correctly structured
 * skeleton to work from instead of an error screen.
 */
export const buildSolemnColombianDraft = (
  documentType: string,
  prompt: string,
  citations: string[],
  _customFormat?: string
): string => {
    const isTutela = documentType.toLowerCase().includes('tutela') || prompt.toLowerCase().includes('tutela');
    const isReparacion = documentType.toLowerCase().includes('reparación') || prompt.toLowerCase().includes('soldado') || prompt.toLowerCase().includes('mina') || prompt.toLowerCase().includes('reparación directa');
    const isLaboral = documentType.toLowerCase().includes('laboral') || prompt.toLowerCase().includes('laboral');

    if (isTutela) {
      return `SEÑOR JUEZ CONSTITUCIONAL DE LA REPÚBLICA DE COLOMBIA (E.S.D.)

REFERENCIA: ACCIÓN DE TUTELA PARA LA PROTECCIÓN DE DERECHOS FUNDAMENTALES
ACCIONANTE: APODERADO JUDICIAL EN REPRESENTACIÓN DEL CIUDADANO AFECTADO
ACCIONADO: AUTORIDAD PÚBLICA / ENTIDAD DE CONTROL / INSPECCIÓN JUDICIAL

I. HECHOS FÁCTICOS PROCESALES
1. En ejercicio del derecho fundamental de petición y de conformidad con el artículo 86 de la Constitución Política de Colombia y los decretos reglamentarios 2591 de 1991 y 1382 de 2000, acudo a su Despacho para impetrar amparo constitucional.
2. Hechos expuestos por el accionante: "${prompt}".
3. La omisión o actuación de la entidad accionada conculca de forma abierta y flagrante el derecho al debido proceso administrativo y el mínimo vital.

II. FUNDAMENTOS JURÍDICOS Y PRECEDENTE OBLIGATORIO
Se sustenta el presente amparo constitucional en las siguientes providencias de unificación de la Corte Constitucional:
${citations.map((c) => `- ${c}`).join('\n')}

III. PRETENSIONES CONSTITUCIONALES
1. TUTELAR de manera inmediata los derechos fundamentales al debido proceso, la igualdad material y el mínimo vital del accionante.
2. ORDENAR a la entidad accionada la cesación inmediata de la conducta vulneradora y el restablecimiento pleno de las garantías constitucionales.

IV. PRUEBAS Y ANEXOS
Se aportan los folios digitales del expediente procesal para su incorporación y valoración oportuna.

V. NOTIFICACIONES
Recibiré notificaciones judiciales en el buzón electrónico registrado.

Atentamente,

APODERADO JUDICIAL - RAMA JUDICIAL DE COLOMBIA
C.C. & T.P. Abogado Litigante`;
    }

    if (isReparacion) {
      return `SEÑORES MAGISTRADOS DEL TRIBUNAL ADMINISTRATIVO / CONSEJO DE ESTADO (E.S.D.)

REFERENCIA: DEMANDA DE REPARACIÓN DIRECTA (ART. 140 CPACA - LEY 1437 DE 2011)
DEMANDANTE: AFECTADO Y SU GRUPO FAMILIAR
DEMANDADO: NACIÓN - MINISTERIO DE DEFENSA NACIONAL - EJÉRCITO NACIONAL / FUERZA PÚBLICA

I. DECLARACIONES Y PRETENSIONES INDEMNIZATORIAS
1. DECLARAR patrimonialmente responsable a la NACIÓN por los daños y perjuicios materiales e inmateriales ocasionados con motivo de los actos del servicio y vulneraciones fácticas.
2. HECHOS SUSTENTARIOS: "${prompt}".
3. CONDENAR al pago del Lucro Cesante consolidado y futuro, Daño Emergente, Daño Moral y Daño a la Salud (Vida de Relación).

II. TÍTULOS DE IMPUTACIÓN Y PRECEDENTE JURISPRUDENCIAL
El Estado responde bajo los títulos de imputación de Riesgo Excepcional, Falla en el Servicio y Daño Especial conforme a la jurisprudencia de unificación del Consejo de Estado:
${citations.map((c) => `- ${c}`).join('\n')}

III. PRUEBAS Y ANEXOS
1. Registro médico e incapacidad psicofísica.
2. Copia del informe de antecedentes del operativo y testimonio procesal.

IV. NOTIFICACIONES
Dirección de notificaciones electrónicas de la firma apoderada.

Atentamente,

APODERADO JUDICIAL DE LA PARTE DEMANDANTE
T.P. del Consejo Superior de la Judicatura`;
    }

    return `SEÑOR JUEZ PROCESAL DE COLOMBIA (E.S.D.)

REFERENCIA: ${documentType.toUpperCase()}
PARTES: DEMANDANTE / AFECTADO CONTRA DEMANDADO / ENTIDAD REQUERIDA

I. ANTECEDENTES Y HECHOS DEL CASO
1. Fundamento fáctico expresado por la parte requirente: "${prompt}".
2. Procedencia formal del escrito bajo las reglas del Código General del Proceso (CGP) y el Código Sustantivo del Trabajo (CST).

II. PRECEDENTES JURISPRUDENCIALES APLICABLES
${citations.map((c) => `- ${c}`).join('\n')}

III. SOLICITUDES / PRETENSIONES
1. Conceder las pretensiones formuladas conforme a la jurisprudencia invocada.
2. Ordenar las medidas procesales pertinentes para la plena efectividad del derecho.

Atentamente,

APODERADO JUDICIAL - FIRMA LITIGANTE`;
};
