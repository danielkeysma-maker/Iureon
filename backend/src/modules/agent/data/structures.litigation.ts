/**
 * Mandatory document structures for filings drafted by litigating firms:
 * demandas, tutelas, recursos, peticiones and conciliation requests.
 *
 * Keys are lowercased document-type labels as they appear in the frontend
 * dropdown; lookup is exact first, then substring (see documentStructures.ts).
 */
export const LITIGATION_DOCUMENT_STRUCTURES: Record<string, string> = {
      // ─── CONSTITUCIONAL: LITIGANTE ───
      'redacción de acción de tutela': `ACCIÓN DE TUTELA (Art. 86 C.P., Decreto 2591/1991):
1. Encabezado: ciudad, fecha
2. Señor Juez (competencia por factor territorial)
3. ACCIONANTE: nombre completo, cédula, domicilio
4. ACCIONADO: entidad/persona contra quien se dirige
5. DERECHOS FUNDAMENTALES VULNERADOS O AMENAZADOS
6. HECHOS (numerados, detallados, cronológicos)
7. FUNDAMENTOS DE DERECHO (Art. 86 C.P., Decreto 2591/1991, jurisprudencia de la Corte Constitucional)
8. PRETENSIONES (numeradas — lo que se pide al juez: ORDENAR, TUTELAR, PROTEGER — OBLIGATORIO)
9. MEDIDA PROVISIONAL (si aplica, Art. 7 Decreto 2591/1991)
10. PRUEBAS que se aportan y solicitan
11. JURAMENTO Art. 37 Decreto 2591/1991 (no se ha interpuesto otra tutela por los mismos hechos)
12. NOTIFICACIONES (dirección, correo, teléfono)
13. Firma del accionante o apoderado`,

      'acción de tutela por vía de hecho judicial': `ACCIÓN DE TUTELA CONTRA PROVIDENCIA JUDICIAL (Sentencia C-590/2005):
1. Encabezado: ciudad, fecha
2. Señor Juez de superior jerarquía funcional
3. ACCIONANTE y ACCIONADO (despacho judicial que profirió la providencia)
4. PROVIDENCIA CUESTIONADA (fecha, radicado, despacho)
5. CAUSALES ESPECÍFICAS DE PROCEDIBILIDAD (defecto orgánico, fáctico, material, procedimental, decisión sin motivación, desconocimiento del precedente, violación directa de la Constitución)
6. HECHOS (numerados)
7. FUNDAMENTOS (Sentencia C-590/2005, SU-813/2007, SU-556/2014)
8. PRETENSIONES (que se deje sin efectos la providencia — OBLIGATORIO)
9. PRUEBAS
10. JURAMENTO Art. 37 Decreto 2591/1991
11. NOTIFICACIONES
12. Firma`,

      'impugnación de sentencia de tutela': `IMPUGNACIÓN DE SENTENCIA DE TUTELA (Art. 31 Decreto 2591/1991):
1. Encabezado: ciudad, fecha, juez de primera instancia (para envío al superior)
2. Referencia: radicado, sentencia impugnada, fecha del fallo
3. LEGITIMACIÓN del impugnante
4. SENTENCIA QUE SE IMPUGNA (transcripción de la parte resolutiva)
5. RAZONES DE LA IMPUGNACIÓN (por qué el fallo es equivocado — OBLIGATORIO)
6. FUNDAMENTOS DE DERECHO y jurisprudencia
7. PETICIÓN AL AD QUEM (revocar / modificar / adicionar — OBLIGATORIO)
8. PRUEBAS adicionales (si aplica)
9. NOTIFICACIONES
10. Firma`,

      'acción popular / acción de grupo': `ACCIÓN POPULAR (Art. 88 C.P., Ley 472/1998):
1. Encabezado: ciudad, fecha, juez administrativo o civil de circuito
2. ACTOR POPULAR: identificación
3. DEMANDADO: entidad o persona que vulnera el derecho colectivo
4. DERECHO O INTERÉS COLECTIVO VULNERADO (Art. 4 Ley 472/1998)
5. HECHOS (numerados)
6. FUNDAMENTOS (Ley 472/1998, Art. 88 C.P.)
7. PRETENSIONES (que se ordene cesar la vulneración, indemnizar, restituir — OBLIGATORIO)
8. PACTO DE CUMPLIMIENTO (indicar disponibilidad, Art. 27 Ley 472/1998)
9. PRUEBAS
10. NOTIFICACIONES
11. Firma`,

      'acción de cumplimiento': `ACCIÓN DE CUMPLIMIENTO (Art. 87 C.P., Ley 393/1997):
1. Encabezado: ciudad, fecha, juez administrativo
2. ACCIONANTE: identificación
3. AUTORIDAD RENUENTE: la que incumple la ley o acto administrativo
4. NORMA O ACTO ADMINISTRATIVO INCUMPLIDO (identificación precisa)
5. RENUENCIA PREVIA (Art. 8 Ley 393/1997 — prueba de que se constituyó en renuencia)
6. HECHOS (numerados)
7. FUNDAMENTOS (Art. 87 C.P., Ley 393/1997)
8. PRETENSIONES (que se ordene cumplir — OBLIGATORIO)
9. PRUEBAS
10. NOTIFICACIONES
11. Firma`,

      // ─── LABORAL: LITIGANTE ───
      'demanda laboral ordinaria': `DEMANDA LABORAL ORDINARIA (Art. 25 CPTSS):
1. Encabezado: ciudad, fecha
2. Señor Juez Laboral del Circuito de ___
3. DEMANDANTE: nombre, cédula, domicilio, apoderado judicial
4. DEMANDADO: razón social/nombre, NIT, domicilio, representante legal
5. CLASE DE PROCESO: Ordinario Laboral de Primera Instancia
6. PRETENSIONES (numeradas — OBLIGATORIO):
   Primera: Que se declare la existencia del contrato de trabajo...
   Segunda: Que se condene al pago de...
7. HECHOS (numerados, cronológicos, probados)
8. FUNDAMENTOS DE DERECHO (CST Arts. 22-64, CPTSS, Ley 100/1993, jurisprudencia Sala Laboral CSJ)
9. COMPETENCIA Y CUANTÍA
10. PRUEBAS (documentales, testimoniales, interrogatorio de parte, exhibición)
11. ANEXOS (poder, pruebas, copia demanda)
12. NOTIFICACIONES
13. Firma del apoderado`,

      'solicitud de conciliación extrajudicial laboral': `SOLICITUD DE CONCILIACIÓN EXTRAJUDICIAL LABORAL (Art. 28 Ley 640/2001):
1. Encabezado: ciudad, fecha
2. Destinatario: Inspector de Trabajo / Centro de Conciliación autorizado
3. SOLICITANTE: nombre, cédula, domicilio
4. CONVOCADO: empleador, razón social, representante legal
5. HECHOS (numerados — relación laboral, fecha de ingreso, cargo, salario, circunstancias del conflicto)
6. PRETENSIONES CONCILIATORIAS (lo que se busca conciliar — OBLIGATORIO)
7. FUNDAMENTOS (Art. 28 Ley 640/2001, Art. 65 CST)
8. PRUEBAS que se aportan
9. NOTIFICACIONES
10. Firma`,

      // ─── ADMINISTRATIVO: EXTRAS ───
      'proyección de auto admisorio de demanda administrativa': `AUTO ADMISORIO DE DEMANDA ADMINISTRATIVA (Art. 171 CPACA):
1. REPÚBLICA DE COLOMBIA — JURISDICCIÓN CONTENCIOSO ADMINISTRATIVA
2. JUZGADO ___ ADMINISTRATIVO DE ___ / TRIBUNAL ADMINISTRATIVO DE ___
3. Radicado
4. AUTO ADMISORIO DE DEMANDA
5. CONSIDERACIONES: medio de control invocado, requisitos (Art. 162-166 CPACA), competencia, caducidad
6. RESUELVE:
   PRIMERO: ADMITIR la demanda de ___ presentada por ___ contra ___
   SEGUNDO: CORRER TRASLADO por el término de 30 días (Art. 172 CPACA)
   TERCERO: NOTIFICAR personalmente a la entidad demandada
   CUARTO: DAR TRASLADO al Ministerio Público
(PARTE RESOLUTIVA — OBLIGATORIO)
7. Notifíquese y cúmplase
8. Firma del Juez/Magistrado`,

      'proyección de auto resolutorio de recurso administrativo': `AUTO QUE RESUELVE RECURSO EN LO CONTENCIOSO ADMINISTRATIVO:
1. REPÚBLICA DE COLOMBIA — JURISDICCIÓN CONTENCIOSO ADMINISTRATIVA
2. Despacho judicial, radicado
3. AUTO INTERLOCUTORIO — Resuelve recurso de reposición/apelación
4. CONSIDERACIONES: providencia recurrida, argumentos, análisis jurídico (CPACA)
5. RESUELVE:
   PRIMERO: REPONER/NO REPONER / CONCEDER/NEGAR la apelación
(PARTE RESOLUTIVA — OBLIGATORIO)
6. Notifíquese
7. Firma del Juez/Magistrado`,

      // ─── FAMILIA: LITIGANTE Y DESPACHO ───
      'demanda de fijación de cuota alimentaria': `DEMANDA DE FIJACIÓN DE CUOTA ALIMENTARIA (Art. 411-427 C. Civil, Ley 1098/2006):
1. Encabezado: ciudad, fecha
2. Señor Juez de Familia / Promiscuo de ___
3. DEMANDANTE: representante legal del menor / beneficiario
4. DEMANDADO: obligado alimentario
5. CLASE DE PROCESO: Verbal Sumario de Fijación de Alimentos
6. PRETENSIONES (OBLIGATORIO):
   Primera: Fijar cuota alimentaria mensual de $___
   Segunda: Retroactividad desde ___
7. HECHOS (necesidad del alimentario, capacidad del alimentante, parentesco)
8. FUNDAMENTOS (Arts. 411-427 C. Civil, Ley 1098/2006 Art. 24, 111 y 129)
9. PRUEBAS
10. NOTIFICACIONES
11. Firma`,

      'demanda de divorcio contencioso': `DEMANDA DE DIVORCIO CONTENCIOSO (Art. 154 C. Civil, Art. 390 CGP):
1. Encabezado: ciudad, fecha
2. Señor Juez de Familia de ___
3. DEMANDANTE y DEMANDADO (cónyuges)
4. CLASE DE PROCESO: Verbal de Divorcio
5. PRETENSIONES (OBLIGATORIO):
   Primera: DECRETAR la disolución y liquidación del vínculo matrimonial
   Segunda: FIJAR cuota alimentaria a favor de ___
   Tercera: ASIGNAR custodia de los hijos menores a ___
6. CAUSAL INVOCADA (Art. 154 C. Civil)
7. HECHOS (numerados, cronológicos)
8. FUNDAMENTOS (Art. 154-162 C. Civil, Art. 390 CGP)
9. PRUEBAS
10. NOTIFICACIONES
11. Firma del apoderado`,

      'proyección de sentencia de familia (alimentos)': `SENTENCIA DE FAMILIA — FIJACIÓN DE ALIMENTOS:
1. REPÚBLICA DE COLOMBIA — RAMA JUDICIAL
2. JUZGADO ___ DE FAMILIA DE ___
3. Radicado, demandante vs. demandado
4. ASUNTO: Fijación de Cuota Alimentaria
5. I. ANTECEDENTES
6. II. HECHOS PROBADOS (necesidad, capacidad, parentesco)
7. III. CONSIDERACIONES (Arts. 411-427 C. Civil, Ley 1098/2006, jurisprudencia CSJ Sala Civil)
8. IV. RESUELVE:
   PRIMERO: FIJAR la cuota alimentaria mensual en $___
   SEGUNDO: ORDENAR el pago dentro de los primeros 5 días de cada mes
   TERCERO: COSTAS
(PARTE RESOLUTIVA — OBLIGATORIO)
9. Cúmplase y notifíquese
10. Firma del Juez de Familia`,

      'proyección de sentencia de familia (divorcio)': `SENTENCIA DE FAMILIA — DIVORCIO:
1. REPÚBLICA DE COLOMBIA — RAMA JUDICIAL
2. JUZGADO ___ DE FAMILIA DE ___
3. Radicado, demandante vs. demandado
4. ASUNTO: Proceso de Divorcio
5. I. ANTECEDENTES
6. II. CAUSAL PROBADA (Art. 154 C. Civil)
7. III. CONSIDERACIONES (Art. 154-162 C. Civil, régimen de sociedad conyugal, custodia)
8. IV. RESUELVE:
   PRIMERO: DECRETAR el divorcio / la cesación de efectos civiles del matrimonio
   SEGUNDO: DISOLVER la sociedad conyugal
   TERCERO: ASIGNAR custodia de los menores a ___
   CUARTO: FIJAR régimen de visitas
   QUINTO: COSTAS
(PARTE RESOLUTIVA — OBLIGATORIO)
9. Cúmplase, notifíquese, inscríbase en el Registro Civil
10. Firma del Juez de Familia`,

      'proyección de sentencia de familia (custodia)': `SENTENCIA DE FAMILIA — CUSTODIA Y REGULACIÓN DE VISITAS:
1. REPÚBLICA DE COLOMBIA — RAMA JUDICIAL
2. JUZGADO ___ DE FAMILIA DE ___
3. Radicado, demandante vs. demandado
4. ASUNTO: Custodia y Cuidado Personal / Regulación de Visitas
5. I. ANTECEDENTES
6. II. INTERÉS SUPERIOR DEL MENOR (Ley 1098/2006 Art. 8)
7. III. CONSIDERACIONES (concepto del equipo psicosocial, pruebas, conveniencia)
8. IV. RESUELVE:
   PRIMERO: ASIGNAR la custodia y cuidado personal del menor ___ a ___
   SEGUNDO: FIJAR régimen de visitas para el progenitor no custodio
   TERCERO: COSTAS
(PARTE RESOLUTIVA — OBLIGATORIO)
9. Cúmplase y notifíquese
10. Firma del Juez de Familia`,

      'proyección de auto admisorio de demanda de familia': `AUTO ADMISORIO DE DEMANDA DE FAMILIA:
1. REPÚBLICA DE COLOMBIA — RAMA JUDICIAL
2. JUZGADO ___ DE FAMILIA DE ___
3. Radicado
4. AUTO ADMISORIO
5. CONSIDERACIONES: requisitos de la demanda, competencia, legitimación
6. RESUELVE:
   PRIMERO: ADMITIR la demanda de ___ presentada por ___ contra ___
   SEGUNDO: CORRER TRASLADO al demandado
   TERCERO: NOTIFICAR personalmente
   CUARTO: FIJAR fecha para audiencia de conciliación
(PARTE RESOLUTIVA — OBLIGATORIO)
7. Notifíquese
8. Firma del Juez de Familia`,

      // ─── PEQUEÑAS CAUSAS ───
      'demanda de proceso monitorio (art. 419 cgp)': `DEMANDA DE PROCESO MONITORIO (Art. 419 CGP):
1. Encabezado: ciudad, fecha
2. Señor Juez Civil Municipal de Pequeñas Causas de ___
3. DEMANDANTE: acreedor
4. DEMANDADO: deudor
5. PRETENSIONES (OBLIGATORIO): que se libre requerimiento de pago por $___
6. DECLARACIÓN BAJO JURAMENTO de que no se posee título ejecutivo (Art. 420 CGP)
7. HECHOS (origen de la deuda, monto, mora)
8. FUNDAMENTOS (Art. 419-421 CGP)
9. PRUEBAS documentales de la deuda
10. NOTIFICACIONES
11. Firma`,

      'proyección de auto admisorio de proceso verbal sumario': `AUTO ADMISORIO — PROCESO VERBAL SUMARIO:
1. REPÚBLICA DE COLOMBIA — RAMA JUDICIAL
2. JUZGADO ___ CIVIL MUNICIPAL DE PEQUEÑAS CAUSAS
3. Radicado
4. AUTO ADMISORIO
5. CONSIDERACIONES: requisitos formales, cuantía mínima, competencia
6. RESUELVE:
   PRIMERO: ADMITIR la demanda verbal sumaria
   SEGUNDO: CORRER TRASLADO por 10 días (Art. 394 CGP)
   TERCERO: FIJAR fecha para audiencia única (Art. 392 CGP)
(PARTE RESOLUTIVA — OBLIGATORIO)
7. Notifíquese
8. Firma del Juez`,

      'proyección de auto de requerimiento de pago monitorio': `AUTO DE REQUERIMIENTO DE PAGO — PROCESO MONITORIO (Art. 421 CGP):
1. REPÚBLICA DE COLOMBIA — RAMA JUDICIAL
2. JUZGADO ___ CIVIL MUNICIPAL DE PEQUEÑAS CAUSAS
3. Radicado
4. AUTO INTERLOCUTORIO
5. CONSIDERACIONES: declaración jurada, documentos soporte, monto reclamado
6. RESUELVE:
   PRIMERO: REQUERIR al deudor ___ para que pague la suma de $___
   SEGUNDO: CONCEDER 10 días para pagar o formular oposición (Art. 421 CGP)
   TERCERO: Advertir que si no paga ni se opone, se dictará sentencia que presta mérito ejecutivo
(PARTE RESOLUTIVA — OBLIGATORIO)
7. Notifíquese personalmente
8. Firma del Juez`,

      // ─── TRIBUTARIO ───
      'proyección de sentencia de nulidad tributaria': `SENTENCIA DE NULIDAD Y RESTABLECIMIENTO DEL DERECHO TRIBUTARIO:
1. REPÚBLICA DE COLOMBIA — JURISDICCIÓN CONTENCIOSO ADMINISTRATIVA
2. TRIBUNAL ADMINISTRATIVO DE ___ / JUZGADO ADMINISTRATIVO
3. Radicado, demandante vs. DIAN/entidad territorial
4. MEDIO DE CONTROL: Nulidad y Restablecimiento del Derecho (Art. 138 CPACA)
5. I. ACTO DEMANDADO (liquidación oficial, resolución sancionatoria, acto de cobro)
6. II. HECHOS PROBADOS
7. III. CONSIDERACIONES (Estatuto Tributario, CPACA, jurisprudencia CE Sección Cuarta)
8. IV. RESUELVE:
   PRIMERO: DECLARAR la nulidad del acto administrativo ___
   SEGUNDO: A título de restablecimiento, ORDENAR la devolución de $___
   TERCERO: COSTAS
(PARTE RESOLUTIVA — OBLIGATORIO)
9. Cúmplase, notifíquese
10. Firma del Juez/Magistrado`,

      'proyección de auto admisorio de demanda tributaria': `AUTO ADMISORIO DE DEMANDA TRIBUTARIA:
1. REPÚBLICA DE COLOMBIA — JURISDICCIÓN CONTENCIOSO ADMINISTRATIVA
2. Despacho judicial, radicado
3. AUTO ADMISORIO
4. CONSIDERACIONES: acto demandado, agotamiento de vía gubernativa (recursos ante la DIAN), caducidad (4 meses Art. 164 CPACA)
5. RESUELVE:
   PRIMERO: ADMITIR la demanda de nulidad y restablecimiento
   SEGUNDO: CORRER TRASLADO a la DIAN por 30 días
   TERCERO: DAR TRASLADO al Ministerio Público
(PARTE RESOLUTIVA — OBLIGATORIO)
6. Notifíquese
7. Firma del Juez/Magistrado`,

      // ─── SOCIETARIO ───
      'proyección de auto de admisión a insolvencia ley 1116': `AUTO DE ADMISIÓN A PROCESO DE REORGANIZACIÓN (Ley 1116/2006):
1. REPÚBLICA DE COLOMBIA — SUPERINTENDENCIA DE SOCIEDADES
2. Radicado, sociedad solicitante
3. AUTO INTERLOCUTORIO
4. CONSIDERACIONES: verificación de supuestos de admisión (Art. 9 Ley 1116: cesación de pagos / incapacidad inminente), documentación aportada
5. RESUELVE:
   PRIMERO: ADMITIR al proceso de reorganización a ___
   SEGUNDO: DESIGNAR promotor
   TERCERO: INSCRIBIR el auto en el registro mercantil
   CUARTO: FIJAR el plazo para presentar créditos (Art. 21 Ley 1116)
(PARTE RESOLUTIVA — OBLIGATORIO)
6. Notifíquese, publíquese
7. Firma del Superintendente Delegado`,

      'proyección de auto de calificación de créditos': `AUTO DE CALIFICACIÓN Y GRADUACIÓN DE CRÉDITOS (Ley 1116/2006):
1. REPÚBLICA DE COLOMBIA — SUPERINTENDENCIA DE SOCIEDADES
2. Radicado, sociedad en reorganización
3. AUTO INTERLOCUTORIO
4. CONSIDERACIONES: créditos presentados, objeciones, prelación legal (Arts. 2495-2511 C. Civil)
5. RESUELVE:
   PRIMERO: RECONOCER como créditos de primera clase a ___
   SEGUNDO: RECONOCER como créditos de segunda clase a ___
   TERCERO: RECONOCER como créditos de quinta clase (quirografarios) a ___
   CUARTO: RECHAZAR los créditos objetados de ___
(PARTE RESOLUTIVA — OBLIGATORIO)
6. Notifíquese
7. Firma del Superintendente Delegado`,

      'proyección de sentencia de competencia desleal (sic)': `SENTENCIA DE COMPETENCIA DESLEAL (Ley 256/1996):
1. REPÚBLICA DE COLOMBIA — SUPERINTENDENCIA DE INDUSTRIA Y COMERCIO
2. Radicado, demandante vs. demandado
3. ASUNTO: Acción de competencia desleal
4. I. ANTECEDENTES (pretensiones, contestación)
5. II. ACTOS DE COMPETENCIA DESLEAL ACREDITADOS (Art. 7-19 Ley 256/1996)
6. III. CONSIDERACIONES (buena fe comercial, usos honestos, daño probado)
7. IV. RESUELVE:
   PRIMERO: DECLARAR que el demandado incurrió en actos de competencia desleal de ___
   SEGUNDO: ORDENAR cesar el acto desleal
   TERCERO: CONDENAR a indemnizar perjuicios por $___
(PARTE RESOLUTIVA — OBLIGATORIO)
8. Notifíquese
9. Firma del Superintendente Delegado`,

      // ─── INTERNACIONAL ───
      'proyección de auto de reconocimiento de laudo extranjero': `AUTO DE RECONOCIMIENTO DE LAUDO ARBITRAL EXTRANJERO (Ley 1563/2012, Convención de Nueva York 1958):
1. REPÚBLICA DE COLOMBIA — CORTE SUPREMA DE JUSTICIA / TRIBUNAL SUPERIOR
2. Radicado, solicitante
3. AUTO INTERLOCUTORIO
4. CONSIDERACIONES: verificación de requisitos (Art. V Convención de Nueva York), no contrariedad al orden público colombiano, debido proceso
5. RESUELVE:
   PRIMERO: RECONOCER/NEGAR el reconocimiento del laudo arbitral proferido por ___
   SEGUNDO: ORDENAR su ejecución en Colombia (si se reconoce)
(PARTE RESOLUTIVA — OBLIGATORIO)
6. Notifíquese
7. Firma del Magistrado`,
};
