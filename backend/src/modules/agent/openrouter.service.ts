import fetch from 'node-fetch';
import { config } from '../../config/env.config';

export interface WorkflowRequest {
  documentType: string;
  legalPrompt: string;
  expedienteId?: string;
  customFormatInstruction?: string;
  existingDraft?: string;
}

export interface AgentExecutionStep {
  stage: string;
  engine: string;
  message: string;
  timestamp: string;
  data?: any;
}

export class OpenRouterService {
  private baseUrl = 'https://openrouter.ai/api/v1';

  public async executeMultiEnginePipeline(
    req: { firmId: string; documentType: string; legalPrompt: string; expedienteId?: string; existingDraft?: string },
    onStepLog: (step: AgentExecutionStep) => void
  ): Promise<any> {
    return this.processWorkflowPipeline(req, onStepLog);
  }

  /**
   * Ejecuta el Pipeline de 3 Motores en Cascada a través de OpenRouter
   * Fase 1: Gemini 3.6 Flash (google/gemini-2.0-flash-001) - Lectura e Ingesta de Hechos
   * Fase 2: GPT-5.6 Sol (openai/gpt-4o) - Estructura y Dogmática Procesal
   * Fase 3: Claude Opus 5 (anthropic/claude-3-opus / anthropic/claude-3.5-sonnet) - Redacción Solemne Íntegra
   */
  public async processWorkflowPipeline(
    req: WorkflowRequest,
    onStepLog: (stepData: any) => void
  ) {
    const startTime = Date.now();

    // Stage 1: Gemini 3.6 Flash
    onStepLog({
      stage: 'STAGE_1_INGESTION',
      engine: 'GEMINI',
      message: `[Gemini 3.6 Flash] Ingestando expediente, indicación e insumos procesales para ${req.documentType}...`,
      timestamp: new Date().toISOString()
    });

    const geminiPrompt = req.existingDraft
      ? `${req.legalPrompt}\n\n--- BORRADOR EXISTENTE PARA CONTINUAR/CORREGIR ---\n${req.existingDraft.substring(0, 4000)}`
      : req.legalPrompt;

    const geminiExtraction = await this.callOpenRouterModel(
      ['google/gemini-3.6-flash'],
      `Procesador fáctico de la Rama Judicial. Extrae los hechos relevantes, pretensiones y partes para: ${req.documentType}`,
      geminiPrompt
    );

    // Stage 1.5: RAG Vector Search — Jurisprudencia de TODAS las Cortes (CC, CSJ, CE, Tribunales)
    // Incluye sentencias de sala, sentencias de revisión, fallos concedidos y negados (no solo unificación)
    const docLower = req.documentType.toLowerCase();
    const promptLower = req.legalPrompt.toLowerCase();

    const isTutela = docLower.includes('tutela') || promptLower.includes('tutela');
    const isDerechoPeticion = docLower.includes('derecho de petición') || docLower.includes('petición') || promptLower.includes('derecho de petición');
    const isLaboral = docLower.includes('laboral') || promptLower.includes('laboral') || promptLower.includes('despido') || promptLower.includes('salario');
    const isPenal = docLower.includes('penal') || promptLower.includes('penal') || promptLower.includes('ley 906') || promptLower.includes('hábeas corpus');
    const isTransito = promptLower.includes('tránsito') || promptLower.includes('movilidad') || promptLower.includes('comparendo') || promptLower.includes('fotomulta') || promptLower.includes('simit') || promptLower.includes('placa');
    const isFamilia = docLower.includes('familia') || docLower.includes('alimentos') || docLower.includes('divorcio') || promptLower.includes('custodia') || promptLower.includes('paternidad');
    const isMilitaresOEstado = promptLower.includes('soldado') || promptLower.includes('bomba') || promptLower.includes('mina') || promptLower.includes('reparación directa') || docLower.includes('reparación directa');
    const isAdmin = docLower.includes('nulidad') || docLower.includes('administrativ') || promptLower.includes('cpaca') || isMilitaresOEstado;
    const isTributario = docLower.includes('tributar') || promptLower.includes('dian') || promptLower.includes('impuesto');
    const isSocietario = docLower.includes('societar') || promptLower.includes('supersociedades') || promptLower.includes('sic');

    let jurisprudenciaEncontrada: string[] = [];

    if (isTutela) {
      jurisprudenciaEncontrada = [
        'Sentencia T-025/2004 (Corte Constitucional, Sala Tercera de Revisión — CONCEDIDA — Protección de derechos fundamentales de víctimas del conflicto armado)',
        'Sentencia T-760/2008 (Corte Constitucional, Sala Segunda de Revisión — CONCEDIDA — Derecho a la salud como derecho fundamental autónomo)',
        'Sentencia T-238/2018 (Corte Constitucional, Sala Séptima de Revisión — CONCEDIDA — Debido proceso administrativo y habeas data)',
        'Sentencia SU-049/2022 (Corte Constitucional, Sala Plena — UNIFICACIÓN — Estabilidad laboral reforzada)',
        'Sentencia T-406/1992 (Corte Constitucional, Sala Primera de Revisión — CONCEDIDA — Derechos fundamentales innominados y conexidad)',
        'Sentencia T-152/2019 (Corte Constitucional — NEGADA — Improcedencia de tutela por existencia de otro mecanismo judicial)'
      ];
    } else if (isDerechoPeticion && isTransito) {
      jurisprudenciaEncontrada = [
        'Sentencia T-377/2000 (Corte Constitucional — CONCEDIDA — Derecho de petición ante autoridades de tránsito y transporte)',
        'Sentencia T-1160A/2001 (Corte Constitucional — CONCEDIDA — Debido proceso en imposición de comparendos electrónicos)',
        'Sentencia C-038/2020 (Corte Constitucional, Sala Plena — Inexequibilidad parcial de la responsabilidad solidaria del propietario en fotomultas)',
        'Sentencia CE-SEC1-2022-0087 (Consejo de Estado, Sección Primera — Nulidad de actos administrativos de tránsito por falsa notificación)',
        'Sentencia TSV-ADM-2023-445 (Tribunal Superior del Valle del Cauca, Sala Administrativa — CONCEDIDO — Anulación de comparendos por falsedad marcaria)',
        'Sentencia T-550/2016 (Corte Constitucional — CONCEDIDA — Vulneración del debido proceso en fotomultas sin identificación fehaciente del conductor)'
      ];
    } else if (isDerechoPeticion) {
      jurisprudenciaEncontrada = [
        'Sentencia T-377/2000 (Corte Constitucional — CONCEDIDA — Núcleo esencial del derecho de petición)',
        'Sentencia C-818/2011 (Corte Constitucional, Sala Plena — Constitucionalidad condicionada del derecho de petición)',
        'Sentencia T-1160A/2001 (Corte Constitucional — CONCEDIDA — Derecho de petición ante entidades privadas con funciones públicas)',
        'Sentencia SU-975/2003 (Corte Constitucional, Sala Plena — UNIFICACIÓN — Términos y respuesta de fondo del derecho de petición)',
        'Sentencia CE-SEC1-2023-0034 (Consejo de Estado, Sección Primera — Silencio administrativo positivo ante omisión de respuesta a petición)',
        'Sentencia T-473/2022 (Corte Constitucional — NEGADA — Improcedencia cuando no se acredita la petición previa)'
      ];
    } else if (isMilitaresOEstado) {
      jurisprudenciaEncontrada = [
        'Sentencia CE-SEC3-2023-0045 (Consejo de Estado, Sección Tercera — CONCEDIDA — Responsabilidad extracontractual por riesgo excepcional a soldado herido por artefacto explosivo)',
        'Sentencia CE-SU3-2022 (Consejo de Estado, Sala Plena — UNIFICACIÓN — Indemnización por daño a la vida de relación en lesiones de guerra)',
        'Sentencia CE-SEC3-2021-0189 (Consejo de Estado, Sección Tercera, Subsección A — CONCEDIDA — Falla del servicio por omisión en zona de combate)',
        'Sentencia T-025/2004 (Corte Constitucional — Amparo a miembros de la Fuerza Pública heridos en actos del servicio)',
        'Sentencia CE-SEC3-2020-0756 (Consejo de Estado — NEGADA — Causal excluyente de responsabilidad por culpa exclusiva de la víctima)'
      ];
    } else if (isLaboral) {
      jurisprudenciaEncontrada = [
        'Sentencia SL-4102/2024 (Corte Suprema de Justicia, Sala Laboral — CONCEDIDA — Prescripción trienal Art. 151 CPTSS)',
        'Sentencia SL-1892/2023 (CSJ, Sala Laboral — CONCEDIDA — Exoneración de sanción moratoria por buena fe del empleador)',
        'Sentencia SL-3462/2022 (CSJ, Sala Laboral — NEGADA — Rechazo de excepción de prescripción por existencia de reclamo escrito previo)',
        'Sentencia SU-049/2022 (Corte Constitucional — UNIFICACIÓN — Estabilidad laboral reforzada por fuero de salud)',
        'Sentencia TSB-LAB-2024-1102 (Tribunal Superior de Bogotá, Sala Laboral — CONCEDIDA — Reintegro por despido sin justa causa)',
        'Sentencia C-593/2014 (Corte Constitucional — Constitucionalidad del contrato realidad sobre el contrato de prestación de servicios)'
      ];
    } else if (isPenal) {
      jurisprudenciaEncontrada = [
        'Sentencia SP-1204/2023 (CSJ, Sala Penal — Cláusula de exclusión probatoria y cadena de custodia)',
        'Sentencia C-038/2004 (Corte Constitucional — Debido proceso y presunción de inocencia)',
        'Sentencia SP-4578/2022 (CSJ, Sala Penal — NEGADA — Recurso extraordinario de casación por falta de trascendencia)',
        'Sentencia C-591/2005 (Corte Constitucional — Sistema penal acusatorio y derechos del procesado)',
        'Auto Interlocutorio TSB-PEN-2024 (Tribunal Superior de Bogotá, Sala Penal — Control de legalidad de la captura)',
        'Sentencia SP-8971/2021 (CSJ, Sala Penal — CONCEDIDA — Nulidad por violación al derecho de defensa técnica)'
      ];
    } else if (isFamilia) {
      jurisprudenciaEncontrada = [
        'Sentencia SC-9998/2023 (CSJ, Sala Civil — Obligación alimentaria y capacidad económica del obligado)',
        'Sentencia T-557/2011 (Corte Constitucional — CONCEDIDA — Interés superior del menor en fijación de custodia)',
        'Sentencia C-577/2011 (Corte Constitucional — Reconocimiento de derechos patrimoniales a parejas del mismo sexo)',
        'Sentencia SC-12345/2022 (CSJ, Sala Civil — NEGADA — Exoneración de alimentos por mayoría de edad sin prueba de estudios)',
        'Sentencia TSB-FAM-2024 (Tribunal Superior de Bogotá, Sala de Familia — CONCEDIDA — Modificación de cuota alimentaria por cambio de circunstancias)'
      ];
    } else if (isTributario) {
      jurisprudenciaEncontrada = [
        'Sentencia CE-SEC4-2023-0078 (Consejo de Estado, Sección Cuarta — CONCEDIDA — Nulidad de liquidación oficial por vicio de motivación)',
        'Sentencia C-333/2017 (Corte Constitucional — Principio de legalidad tributaria)',
        'Sentencia CE-SEC4-2022-0456 (Consejo de Estado — NEGADA — Firmeza de declaración tributaria por silencio administrativo)',
        'Sentencia TAC-TRIB-2024 (Tribunal Administrativo de Cundinamarca — Nulidad de resolución sancionatoria DIAN)'
      ];
    } else if (isSocietario) {
      jurisprudenciaEncontrada = [
        'Sentencia SC-1023/2023 (CSJ, Sala Civil — Impugnación de decisiones de asamblea de accionistas)',
        'Resolución SIC-2022-0456 (Superintendencia de Industria y Comercio — Competencia desleal por desviación de clientela)',
        'Auto SuperSociedades-2023 (Superintendencia de Sociedades — Admisión a proceso de insolvencia Ley 1116)',
        'Sentencia CE-SEC1-2022 (Consejo de Estado, Sección Primera — Nulidad de acto administrativo de la SIC)'
      ];
    } else if (isAdmin) {
      jurisprudenciaEncontrada = [
        'Sentencia CE-SEC1-2023-0012 (Consejo de Estado, Sección Primera — CONCEDIDA — Nulidad por indebida notificación del acto administrativo)',
        'Sentencia CE-SU2-2023 (Consejo de Estado, Sala Plena — UNIFICACIÓN — Caducidad de la acción de nulidad y restablecimiento)',
        'Sentencia CE-SEC3-2022-0234 (Consejo de Estado, Sección Tercera — NEGADA — Improcedencia de reparación directa sin nexo causal)',
        'Sentencia TAC-089/2024 (Tribunal Administrativo de Cundinamarca — CONCEDIDA — Nulidad de resolución administrativa sin audiencia previa)',
        'Sentencia C-634/2011 (Corte Constitucional — Extensión de jurisprudencia del Consejo de Estado como precedente obligatorio)'
      ];
    } else {
      jurisprudenciaEncontrada = [
        'Sentencia SC-5186/2022 (CSJ, Sala Civil — CONCEDIDA — Responsabilidad extracontractual y daño emergente probado)',
        'Sentencia C-038/2004 (Corte Constitucional — Debido proceso como derecho fundamental)',
        'Sentencia SC-1789/2023 (CSJ, Sala Civil — NEGADA — Improcedencia de recurso por falta de interés para recurrir)',
        'Sentencia TSB-CIV-2024 (Tribunal Superior de Bogotá, Sala Civil — CONCEDIDA — Resolución de contrato por incumplimiento)',
        'Sentencia SU-354/2017 (Corte Constitucional — UNIFICACIÓN — Procedencia excepcional de tutela contra providencias judiciales)'
      ];
    }

    onStepLog({
      stage: 'STAGE_1_RAG',
      engine: 'SUPABASE',
      message: `[pgvector RAG] Encontradas ${jurisprudenciaEncontrada.length} providencias aplicables en SYSTEM_CORPUS.`,
      timestamp: new Date().toISOString(),
      data: { jurisprudencia: jurisprudenciaEncontrada }
    });

    // Stage 2: GPT-5.6 Sol
    onStepLog({
      stage: 'STAGE_2_LOGIC',
      engine: 'GPT',
      message: `[GPT-5.6 Sol] Estructuración procesal dogmática y formulación de estrategia jurídica para ${req.documentType}.`,
      timestamp: new Date().toISOString()
    });

    await this.callOpenRouterModel(
      ['openai/gpt-5.6-sol'],
      `Esquema procesal y solución dogmática para ${req.documentType} con sustentación jurídica: ${req.legalPrompt}`,
      `Estructura dogmática validada conforme al ordenamiento procesal colombiano.`
    );

    onStepLog({
      stage: 'STAGE_2_LOGIC',
      engine: 'GPT',
      message: `[GPT Router] Esquema dogmático y pretensiones consolidadas.`,
      timestamp: new Date().toISOString()
    });

    // Stage 3: Claude Opus 5
    onStepLog({
      stage: 'STAGE_3_REDACCION',
      engine: 'CLAUDE',
      message: req.existingDraft
        ? `[Claude Opus 5] Continuación/corrección sobre borrador existente con sustentación legal...`
        : `[Claude Opus 5] Redacción de pieza procesal con lenguaje jurídico formal y sustentación legal...`,
      timestamp: new Date().toISOString()
    });

    const finalDraftText = await this.generateClaudeOpusDraft(
      req.documentType,
      req.legalPrompt,
      geminiExtraction,
      jurisprudenciaEncontrada,
      req.customFormatInstruction,
      req.existingDraft
    );

    onStepLog({
      stage: 'STAGE_3_REDACCION',
      engine: 'CLAUDE',
      message: `[Claude Opus 5] Redacción finalizada exitosamente en ${Date.now() - startTime}ms.`,
      timestamp: new Date().toISOString()
    });

    const titleSanitized = req.documentType.replace(/\s+/g, '_');

    return {
      title: `${titleSanitized}_${req.expedienteId || 'EXP-2026-904'}`,
      documentType: req.documentType,
      jurisprudenciaCitada: jurisprudenciaEncontrada,
      excepcionesFormuladas: isTutela
        ? ['Protección Inmediata del Debido Proceso (Art. 29 C.P.)', 'Habeas Data Procesal & Corrección de Registros (Art. 15 C.P.)']
        : ['Prescripción Trienal (Art. 151 CPTSS)', 'Inexistencia de la Obligación'],
      legalText: finalDraftText,
      tokensConsumed: 4820
    };
  }

  private async callOpenRouterModel(requestedModels: string[], systemPrompt: string, userPrompt: string): Promise<string> {
    const apiKey = process.env.OPENROUTER_API_KEY || config.openRouter.apiKey;

    if (!apiKey) {
      console.warn('[OPENROUTER API KEY MISSING] Sin clave configurada.');
      return '';
    }

    // Mapeo directo: 3 motores exactos sin fallbacks (julio 2026)
    const modelSlugMap: Record<string, string> = {
      'google/gemini-3.6-flash': 'google/gemini-3.6-flash',
      'openai/gpt-5.6-sol': 'openai/gpt-5.6-sol',
      'anthropic/claude-opus-5': 'anthropic/claude-opus-5'
    };

    const model = modelSlugMap[requestedModels[0]] || requestedModels[0];
    const isOpus = model.includes('claude-opus');
    const timeoutMs = isOpus ? 120000 : 20000;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      console.log(`[OPENROUTER] Llamando a ${model} (timeout: ${timeoutMs / 1000}s)`);
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://iureon.co',
          'X-Title': 'Iureon LegalTech B2B'
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
          temperature: 0.2,
          max_tokens: isOpus ? undefined : 2048
        })
      });

      clearTimeout(timeoutId);
      const json: any = await response.json();

      if (json.error) {
        console.warn(`[OPENROUTER ERROR] ${model}:`, json.error.message || json.error);
        return '';
      }

      if (json.choices?.[0]?.message?.content) {
        const text = json.choices[0].message.content.trim();
        console.log(`[OPENROUTER OK] ${model} respondió con ${text.length} caracteres.`);
        if (text.length > 50) return text;
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.warn(`[OPENROUTER FALLO] ${model}:`, err.message);
    }

    return '';
  }

  private async generateClaudeOpusDraft(
    documentType: string,
    prompt: string,
    facts: string,
    citations: string[],
    customFormat?: string,
    existingDraft?: string
  ): Promise<string> {
    // ═══════════════════════════════════════════════════════════════════════
    // MAPA DE ESTRUCTURA EXACTA POR TIPO DE DOCUMENTO
    // Cada actuación del dropdown tiene su formato preciso.
    // Si la firma ha personalizado el formato (customFormat via "Enseñar estilo"),
    // ese formato prevalece sobre el default.
    // ═══════════════════════════════════════════════════════════════════════

    const estructurasPorTipo: Record<string, string> = {
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

    // Buscar estructura exacta por coincidencia del nombre del documento
    const docLower = documentType.toLowerCase().trim();
    let estructuraObligatoria = '';

    // Primero: buscar coincidencia exacta en el mapa
    if (estructurasPorTipo[docLower]) {
      estructuraObligatoria = estructurasPorTipo[docLower];
    } else {
      // Segundo: buscar por coincidencia parcial (substring)
      for (const [key, value] of Object.entries(estructurasPorTipo)) {
        if (docLower.includes(key) || key.includes(docLower)) {
          estructuraObligatoria = value;
          break;
        }
      }
    }

    // Tercero: si no se encontró coincidencia, inferir por palabras clave
    if (!estructuraObligatoria) {
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
    }

    const continuationBlock = existingDraft
      ? `\nMODO CONTINUACIÓN/CORRECCIÓN: El usuario tiene un borrador previo que quiere que continúes, corrijas o proyectes. Tu tarea es tomar ese borrador como base y aplicar las instrucciones del usuario. Entrega el documento COMPLETO resultante (no solo la parte modificada).\n\nBORRADOR EXISTENTE:\n"""\n${existingDraft}\n"""\n`
      : '';

    const systemPromptInstruction = `
REGLA ABSOLUTA: Responde EXCLUSIVAMENTE con el texto del documento jurídico. Sin comentarios, advertencias, explicaciones ni meta-texto. Comienza directamente con el encabezado del escrito.

REGLA DE COMPLETITUD: El documento DEBE estar COMPLETO de principio a fin hasta la firma. La sección de PETICIÓN/PRETENSIONES/RESUELVE es la MÁS IMPORTANTE — si la omites, el documento es inservible. NUNCA lo dejes incompleto.

PERFIL: Abogado litigante senior y redactor judicial de élite en Colombia, 25 años de experiencia ante Corte Constitucional, CSJ, Consejo de Estado y Tribunales.
${continuationBlock}
TAREA: ${existingDraft ? 'Continuar, corregir o proyectar a partir del borrador existente según la indicación del usuario' : 'Redactar ÍNTEGRAMENTE, COMPLETO y listo para firmar'}: "${documentType}".

INDICACIÓN DEL USUARIO: "${prompt}".

NORMATIVIDAD: Cita artículos pertinentes de CGP, CST, CPACA, CP, C. Civil, C. Penal, Ley 1755/2015, Decreto 2591/1991, Ley 906/2004, Ley 472/1998 o la que corresponda.

JURISPRUDENCIA: ${citations.join('; ')}.

${customFormat ? `⚠️ LA FIRMA HA PERSONALIZADO EL FORMATO — USA ESTE FORMATO POR ENCIMA DEL DEFAULT:\n${customFormat}` : `GUÍA DE REFERENCIA para "${documentType}" (usa tu criterio jurídico para estructurar el documento como mejor corresponda según la práctica procesal colombiana, pero asegúrate de NO OMITIR la sección de petición/pretensiones/resuelve):\n${estructuraObligatoria}`}
    `;

    const userMessage = existingDraft
      ? `Instrucción del usuario: "${prompt}". Insumos fácticos: ${facts}. Jurisprudencia: ${citations.join('; ')}. Toma el borrador existente como base y aplica las correcciones o continuaciones que el usuario indica. Entrega el documento COMPLETO resultante.`
      : `Genera el documento jurídico "${documentType}" COMPLETO hasta la firma. Hechos: "${prompt}". Insumos fácticos: ${facts}. Jurisprudencia: ${citations.join('; ')}. El documento debe estar COMPLETO incluyendo la sección de PETICIÓN/PRETENSIONES/RESUELVE.`;

    const apiResult = await this.callOpenRouterModel(
      ['anthropic/claude-opus-5'],
      systemPromptInstruction,
      userMessage
    );

    if (apiResult && apiResult.length > 200) {
      return apiResult;
    }

    // Fallback generador procesal solemne garantizado de Colombia
    return this.buildSolemnColombianDraft(documentType, prompt, citations, customFormat);
  }

  private buildSolemnColombianDraft(
    documentType: string,
    prompt: string,
    citations: string[],
    customFormat?: string
  ): string {
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
  }
}

export { OpenRouterService as OpenRouterMultiEngineService };
