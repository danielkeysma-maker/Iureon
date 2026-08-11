/**
 * Mandatory document structures for court-issued rulings (juzgados / despachos):
 * sentencias, autos interlocutorios and admisorios.
 *
 * Keys are lowercased document-type labels as they appear in the frontend
 * dropdown; lookup is exact first, then substring (see documentStructures.ts).
 */
export const JUDICIAL_DOCUMENT_STRUCTURES: Record<string, string> = {
      // ─── CONSTITUCIONAL: DESPACHO ───
      'contestación / informe de respuesta a tutela (juzgado/entidad)': `INFORME DE RESPUESTA A TUTELA (Despacho/Entidad accionada):
1. REPÚBLICA DE COLOMBIA — encabezado institucional
2. Referencia: radicado, accionante, juzgado de conocimiento
3. PRONUNCIAMIENTO SOBRE CADA HECHO (acepta, niega, aclara)
4. RAZONES POR LAS CUALES NO HAY VULNERACIÓN (o las acciones tomadas para subsanar)
5. FUNDAMENTOS NORMATIVOS de la actuación de la entidad
6. PRUEBAS que se aportan
7. PETICIÓN AL JUEZ (negar la tutela / declarar improcedente — OBLIGATORIO)
8. NOTIFICACIONES
9. Firma del representante legal o jefe jurídico`,

      'proyección de sentencia de tutela (concede / niega)': `SENTENCIA DE TUTELA (Despacho judicial):
1. REPÚBLICA DE COLOMBIA — RAMA JUDICIAL
2. JUZGADO ___ [competente] DE ___ [ciudad]
3. Radicado, accionante vs. accionado
4. ASUNTO: Acción de Tutela
5. I. ANTECEDENTES (pretensiones del accionante, respuesta del accionado)
6. II. HECHOS PROBADOS
7. III. PROBLEMA JURÍDICO
8. IV. CONSIDERACIONES (análisis de procedibilidad: legitimación, inmediatez, subsidiariedad; análisis de fondo con normativa y jurisprudencia de la Corte Constitucional)
9. V. DECISIÓN — RESUELVE:
   PRIMERO: CONCEDER/NEGAR la protección del derecho fundamental a ___
   SEGUNDO: ORDENAR a ___ que en el término de 48 horas... (si concede)
   TERCERO: NOTIFÍQUESE esta decisión...
   CUARTO: Si no se impugna, REMÍTASE a la Corte Constitucional para eventual revisión
(PARTE RESOLUTIVA — OBLIGATORIO, NO OMITIR)
10. Cúmplase y notifíquese
11. Firma del Juez`,

      'proyección de auto admisorio & medida cautelar': `AUTO ADMISORIO DE TUTELA CON MEDIDA CAUTELAR (Art. 7 Decreto 2591/1991):
1. REPÚBLICA DE COLOMBIA — RAMA JUDICIAL
2. JUZGADO ___ DE ___
3. Radicado, accionante vs. accionado
4. AUTO INTERLOCUTORIO
5. CONSIDERACIONES: verificación de requisitos de procedibilidad, urgencia
6. RESUELVE:
   PRIMERO: ADMITIR la acción de tutela interpuesta por ___
   SEGUNDO: ORDENAR notificar al accionado para que rinda informe en 2 días (Art. 16 Decreto 2591/1991)
   TERCERO: DECRETAR MEDIDA PROVISIONAL consistente en ___ (Art. 7 Decreto 2591/1991)
   CUARTO: VINCULAR como terceros interesados a ___
(PARTE RESOLUTIVA — OBLIGATORIO)
7. Cúmplase, notifíquese y cúmplase
8. Firma del Juez`,

      'proyección de auto resolutorio de impugnación': `AUTO QUE CONCEDE/NIEGA IMPUGNACIÓN DE TUTELA:
1. REPÚBLICA DE COLOMBIA — RAMA JUDICIAL
2. Despacho judicial
3. Radicado
4. AUTO INTERLOCUTORIO
5. CONSIDERACIONES: oportunidad de la impugnación, legitimación
6. RESUELVE:
   PRIMERO: CONCEDER/NEGAR la impugnación presentada por ___
   SEGUNDO: REMITIR el expediente al superior jerárquico funcional para que resuelva
(PARTE RESOLUTIVA — OBLIGATORIO)
7. Cúmplase y notifíquese
8. Firma del Juez`,

      // ─── LABORAL: DESPACHO ───
      'proyección de sentencia laboral de primera instancia': `SENTENCIA LABORAL DE PRIMERA INSTANCIA:
1. REPÚBLICA DE COLOMBIA — RAMA JUDICIAL
2. JUZGADO ___ LABORAL DEL CIRCUITO DE ___
3. Radicado, demandante vs. demandado
4. ASUNTO: Proceso Ordinario Laboral de Primera Instancia
5. I. ANTECEDENTES (pretensiones, contestación, excepciones)
6. II. HECHOS PROBADOS (valoración probatoria conforme al Art. 61 CPTSS — libre formación del convencimiento)
7. III. PROBLEMA JURÍDICO
8. IV. CONSIDERACIONES (análisis normativo: CST, CPTSS, Ley 100/1993; jurisprudencia de la Sala Laboral de la CSJ)
9. V. CONDENA EN COSTAS (Art. 65 CPTSS)
10. VI. RESUELVE:
   PRIMERO: DECLARAR probada/no probada la excepción de ___
   SEGUNDO: CONDENAR/ABSOLVER al demandado a pagar ___
   TERCERO: CONDENAR/EXONERAR en costas
(PARTE RESOLUTIVA — OBLIGATORIO, NO OMITIR)
11. Cúmplase, notifíquese y cúmplase
12. Firma del Juez Laboral`,

      'proyección de auto interlocutorio / resuelve excepciones': `AUTO INTERLOCUTORIO QUE RESUELVE EXCEPCIONES (Laboral):
1. REPÚBLICA DE COLOMBIA — RAMA JUDICIAL
2. JUZGADO ___ LABORAL DEL CIRCUITO DE ___
3. Radicado, partes
4. AUTO INTERLOCUTORIO
5. CONSIDERACIONES: análisis de cada excepción propuesta (prescripción, inexistencia de la obligación, cobro de lo no debido, compensación, etc.)
6. RESUELVE:
   PRIMERO: DECLARAR probada/no probada la excepción de ___
   SEGUNDO: CONTINUAR con el trámite del proceso / DECLARAR terminado el proceso
(PARTE RESOLUTIVA — OBLIGATORIO)
7. Notifíquese, cúmplase
8. Firma del Juez`,

      'proyección de auto admisorio de demanda laboral': `AUTO ADMISORIO DE DEMANDA LABORAL (Art. 25A CPTSS, Art. 90 CGP):
1. REPÚBLICA DE COLOMBIA — RAMA JUDICIAL
2. JUZGADO ___ LABORAL DEL CIRCUITO DE ___
3. Radicado
4. AUTO ADMISORIO DE DEMANDA
5. CONSIDERACIONES: verificación de requisitos formales (Art. 25 CPTSS), competencia, cuantía
6. RESUELVE:
   PRIMERO: ADMITIR la demanda laboral ordinaria presentada por ___ contra ___
   SEGUNDO: CORRER TRASLADO al demandado por el término de 10 días (Art. 29 CPTSS)
   TERCERO: NOTIFICAR personalmente al demandado
   CUARTO: FIJAR fecha para audiencia obligatoria de conciliación, decisión de excepciones previas, saneamiento y fijación del litigio (Art. 77 CPTSS)
(PARTE RESOLUTIVA — OBLIGATORIO)
7. Notifíquese y cúmplase
8. Firma del Juez`,

      // ─── CIVIL: DESPACHO ───
      'proyección de auto admisorio de demanda civil': `AUTO ADMISORIO DE DEMANDA CIVIL (Art. 90 CGP):
1. REPÚBLICA DE COLOMBIA — RAMA JUDICIAL
2. JUZGADO ___ CIVIL [Municipal/del Circuito] DE ___
3. Radicado
4. AUTO ADMISORIO DE DEMANDA
5. CONSIDERACIONES: requisitos de la demanda (Art. 82-84 CGP), competencia, cuantía
6. RESUELVE:
   PRIMERO: ADMITIR la demanda presentada por ___ contra ___
   SEGUNDO: CORRER TRASLADO al demandado por el término de ___ días (Art. 369/372 CGP según el proceso)
   TERCERO: NOTIFICAR personalmente al demandado (Art. 291 CGP)
   CUARTO: RECONOCER personería jurídica al Dr. ___ como apoderado
(PARTE RESOLUTIVA — OBLIGATORIO)
7. Notifíquese y cúmplase
8. Firma del Juez`,

      'proyección de auto inadmisorio de demanda civil (art. 90 cgp)': `AUTO INADMISORIO DE DEMANDA (Art. 90 CGP):
1. REPÚBLICA DE COLOMBIA — RAMA JUDICIAL
2. JUZGADO ___ CIVIL DE ___
3. Radicado
4. AUTO INADMISORIO
5. CONSIDERACIONES: defectos formales encontrados (falta de requisitos Art. 82 CGP, indebida acumulación, falta de competencia, etc.)
6. RESUELVE:
   PRIMERO: INADMITIR la demanda presentada por ___ contra ___
   SEGUNDO: CONCEDER al demandante el término de 5 días para SUBSANAR los defectos señalados (Art. 90 CGP)
   TERCERO: Advertir que de no subsanarse, se RECHAZARÁ la demanda
(PARTE RESOLUTIVA — OBLIGATORIO)
7. Notifíquese
8. Firma del Juez`,

      'proyección de sentencia civil ordinaria / verbal': `SENTENCIA CIVIL (Proceso Ordinario/Verbal):
1. REPÚBLICA DE COLOMBIA — RAMA JUDICIAL
2. JUZGADO ___ CIVIL [Municipal/del Circuito] DE ___
3. Radicado, demandante vs. demandado
4. ASUNTO: Proceso [Verbal/Verbal Sumario/Declarativo]
5. I. ANTECEDENTES (pretensiones, contestación, excepciones previas y de mérito)
6. II. HECHOS PROBADOS (valoración probatoria: sana crítica, Art. 176 CGP)
7. III. PROBLEMA JURÍDICO
8. IV. CONSIDERACIONES (análisis normativo: Código Civil, CGP, Código de Comercio si aplica; jurisprudencia de la Sala Civil de la CSJ)
9. V. COSTAS (Art. 365 CGP — condena al vencido)
10. VI. RESUELVE:
   PRIMERO: DECLARAR probada/no probada la pretensión de ___
   SEGUNDO: CONDENAR/ABSOLVER al demandado
   TERCERO: CONDENAR en costas a ___
(PARTE RESOLUTIVA — OBLIGATORIO, NO OMITIR)
11. Notifíquese, cúmplase
12. Firma del Juez Civil`,

      'proyección de auto resolutorio de recurso de reposición': `AUTO QUE RESUELVE RECURSO DE REPOSICIÓN (Art. 318 CGP):
1. REPÚBLICA DE COLOMBIA — RAMA JUDICIAL
2. Despacho judicial
3. Radicado, partes
4. AUTO INTERLOCUTORIO — Resuelve recurso de reposición
5. CONSIDERACIONES: providencia recurrida, argumentos del recurrente, análisis jurídico
6. RESUELVE:
   PRIMERO: REPONER/NO REPONER la providencia de fecha ___
   SEGUNDO: [Si tiene subsidiario de apelación] CONCEDER/NEGAR el recurso de apelación en el efecto ___
(PARTE RESOLUTIVA — OBLIGATORIO)
7. Notifíquese
8. Firma del Juez`,

      'proyección de auto mandamiento de pago': `AUTO DE MANDAMIENTO DE PAGO (Art. 430 CGP):
1. REPÚBLICA DE COLOMBIA — RAMA JUDICIAL
2. JUZGADO ___ CIVIL DE ___
3. Radicado
4. AUTO DE MANDAMIENTO DE PAGO — Proceso Ejecutivo
5. CONSIDERACIONES: título ejecutivo, requisitos (Art. 422 CGP: obligación clara, expresa, exigible), liquidación del crédito
6. RESUELVE:
   PRIMERO: LIBRAR mandamiento de pago a favor de ___ y en contra de ___ por las siguientes sumas:
   a) Capital: $___
   b) Intereses moratorios desde ___ hasta ___
   c) Costas del proceso
   SEGUNDO: NOTIFICAR personalmente al ejecutado (Art. 291 CGP)
   TERCERO: Informar que el ejecutado dispone de 10 días para proponer excepciones (Art. 442 CGP)
(PARTE RESOLUTIVA — OBLIGATORIO)
7. Cúmplase, notifíquese
8. Firma del Juez`,

      // ─── ADMINISTRATIVO: DESPACHO ───
      'proyección de sentencia contencioso administrativa': `SENTENCIA CONTENCIOSO ADMINISTRATIVA:
1. REPÚBLICA DE COLOMBIA — RAMA JUDICIAL — JURISDICCIÓN CONTENCIOSO ADMINISTRATIVA
2. TRIBUNAL ADMINISTRATIVO DE ___ / JUZGADO ___ ADMINISTRATIVO DE ___
3. Radicado, demandante vs. demandado (entidad)
4. MEDIO DE CONTROL: Nulidad y Restablecimiento / Reparación Directa / Nulidad Simple
5. I. ANTECEDENTES (pretensiones, contestación, concepto del Ministerio Público si aplica)
6. II. HECHOS PROBADOS
7. III. PROBLEMA JURÍDICO
8. IV. CONSIDERACIONES (CPACA, jurisprudencia del Consejo de Estado por sección)
9. V. COSTAS
10. VI. FALLO — RESUELVE:
   PRIMERO: DECLARAR la nulidad del acto ___ / DECLARAR responsable a ___
   SEGUNDO: A título de restablecimiento del derecho / reparación, CONDENAR a ___ a pagar ___
   TERCERO: COSTAS
(PARTE RESOLUTIVA — OBLIGATORIO)
11. Cúmplase, notifíquese, publíquese
12. Firma del Juez/Magistrado`,

      'proyección de auto de medida cautelar': `AUTO DE MEDIDA CAUTELAR (Art. 229-241 CPACA):
1. REPÚBLICA DE COLOMBIA — JURISDICCIÓN CONTENCIOSO ADMINISTRATIVA
2. Despacho judicial, radicado
3. AUTO INTERLOCUTORIO — Decide solicitud de medida cautelar
4. CONSIDERACIONES: apariencia de buen derecho (fumus boni iuris), peligro en la demora (periculum in mora), ponderación de intereses, caución
5. RESUELVE:
   PRIMERO: DECRETAR/NEGAR la medida cautelar de suspensión provisional del acto ___
   SEGUNDO: Fijar caución de $___
(PARTE RESOLUTIVA — OBLIGATORIO)
6. Notifíquese
7. Firma del Juez/Magistrado`,

      // ─── PENAL: DESPACHO ───
      'proyección de auto de preclusión / control de garantías': `AUTO DE PRECLUSIÓN / CONTROL DE GARANTÍAS (Ley 906/2004):
1. REPÚBLICA DE COLOMBIA — RAMA JUDICIAL
2. JUZGADO ___ PENAL [Municipal/del Circuito] CON FUNCIÓN DE CONTROL DE GARANTÍAS
3. Radicado, intervinientes
4. AUTO INTERLOCUTORIO
5. CONSIDERACIONES: causal de preclusión invocada (Art. 332 Ley 906), análisis probatorio, derechos de la víctima
6. RESUELVE:
   PRIMERO: DECRETAR/NEGAR la preclusión de la investigación adelantada contra ___
   SEGUNDO: ORDENAR la cesación de toda acción penal (si se decreta)
(PARTE RESOLUTIVA — OBLIGATORIO)
7. Notifíquese, cúmplase
8. Firma del Juez Penal`,

      'proyección de sentencia penal de primera instancia': `SENTENCIA PENAL DE PRIMERA INSTANCIA (Ley 906/2004):
1. REPÚBLICA DE COLOMBIA — RAMA JUDICIAL
2. JUZGADO ___ PENAL DEL CIRCUITO DE ___
3. Radicado, procesado, delito(s)
4. ASUNTO: Sentencia de primera instancia — Sistema Penal Acusatorio
5. I. ANTECEDENTES (imputación, acusación, juicio oral)
6. II. HECHOS PROBADOS (valoración probatoria bajo la regla de exclusión y cadena de custodia)
7. III. ANÁLISIS JURÍDICO (tipicidad, antijuridicidad, culpabilidad; Ley 599/2000, Ley 906/2004)
8. IV. DOSIFICACIÓN PUNITIVA (si condena: cuartos, circunstancias de atenuación/agravación)
9. V. RESUELVE:
   PRIMERO: DECLARAR penalmente responsable/ABSOLVER a ___ del delito de ___
   SEGUNDO: IMPONER pena de ___ meses/años de prisión (si condena)
   TERCERO: CONCEDER/NEGAR sustituto de prisión domiciliaria
   CUARTO: CONDENAR al pago de perjuicios a favor de la víctima por $___
(PARTE RESOLUTIVA — OBLIGATORIO)
10. Notifíquese, cúmplase
11. Firma del Juez Penal`,

      'proyección de auto de medida de aseguramiento': `AUTO DE MEDIDA DE ASEGURAMIENTO (Art. 306-316 Ley 906/2004):
1. REPÚBLICA DE COLOMBIA — RAMA JUDICIAL
2. JUZGADO ___ PENAL CON FUNCIÓN DE CONTROL DE GARANTÍAS
3. Radicado, indiciado/imputado
4. AUTO INTERLOCUTORIO — Decide solicitud de medida de aseguramiento
5. CONSIDERACIONES: inferencia razonable de autoría, requisitos (Art. 308: obstrucción de justicia, peligro para la víctima/comunidad, riesgo de no comparecencia), proporcionalidad y necesidad
6. RESUELVE:
   PRIMERO: IMPONER/NEGAR medida de aseguramiento de [detención preventiva/domiciliaria/caución] contra ___
   SEGUNDO: ORDENAR la reclusión en ___
(PARTE RESOLUTIVA — OBLIGATORIO)
7. Notifíquese, cúmplase
8. Firma del Juez Penal`,

      'proyección de auto de legalización de captura': `AUTO DE LEGALIZACIÓN DE CAPTURA (Art. 297-302 Ley 906/2004):
1. REPÚBLICA DE COLOMBIA — RAMA JUDICIAL
2. JUZGADO ___ PENAL CON FUNCIÓN DE CONTROL DE GARANTÍAS
3. Radicado, capturado
4. AUTO INTERLOCUTORIO — Audiencia de legalización de captura
5. CONSIDERACIONES: circunstancias de la captura (flagrancia Art. 301, orden judicial Art. 297, captura excepcional Art. 300), respeto de derechos del capturado, plazo de 36 horas
6. RESUELVE:
   PRIMERO: LEGALIZAR/NO LEGALIZAR la captura de ___
   SEGUNDO: Si no se legaliza, ORDENAR la libertad inmediata
(PARTE RESOLUTIVA — OBLIGATORIO)
7. Notifíquese, cúmplase
8. Firma del Juez Penal`,

      'proyección de auto de formulación de imputación': `AUTO QUE AVALA FORMULACIÓN DE IMPUTACIÓN (Art. 286-289 Ley 906/2004):
1. REPÚBLICA DE COLOMBIA — RAMA JUDICIAL
2. JUZGADO ___ PENAL CON FUNCIÓN DE CONTROL DE GARANTÍAS
3. Radicado, imputado
4. ACTA DE AUDIENCIA DE FORMULACIÓN DE IMPUTACIÓN
5. CONSIDERACIONES: comunicación de hechos jurídicamente relevantes, delito(s) endilgado(s), calificación jurídica provisional
6. RESUELVE:
   PRIMERO: TENER POR FORMULADA la imputación por el delito de ___
   SEGUNDO: Informar al imputado sus derechos (Art. 8 Ley 906)
   TERCERO: FIJAR plazo de 30 días para presentar escrito de acusación (Art. 175 Ley 906)
(PARTE RESOLUTIVA — OBLIGATORIO)
7. Notifíquese
8. Firma del Juez Penal`,

};
