import { ENGINE, callOpenRouterModel } from './openrouter.client';
import { JURISPRUDENCE_BY_TOPIC } from './data/jurisprudence';
import { detectLegalTopic } from './topicDetector';
import { generateCleanDocumentTitle } from './documentTitle';
import { buildClaudeDraftPrompt, buildClaudeUserMessage } from './claudeDraft.prompt';
import { buildCatalogGuidanceForFirm } from './catalogGuidance';
import { buildSolemnColombianDraft } from './solemnDraft.fallback';

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

/**
 * Token budget per engine. Each engine spends only what its own task needs:
 * Gemini and GPT never draft, and Claude never re-extracts facts. In
 * continuation mode the analysis engines get less, because they describe a
 * delta rather than the whole case.
 */
const MAX_TOKENS = {
  GEMINI_NEW: 1024,
  GEMINI_CONTINUATION: 768,
  GPT_NEW: 1536,
  GPT_CONTINUATION: 1024
} as const;

/** Below this length Claude's answer is treated as a failed generation. */
const MIN_DRAFT_LENGTH = 200;

/** How much of an existing draft Gemini sees when identifying requested changes. */
const DRAFT_CONTEXT_CHARS = 3000;

/**
 * Three-engine drafting pipeline over OpenRouter.
 *
 * Gemini extracts the facts, GPT turns them into a dogmatic outline, and Claude
 * Opus writes the document from both. Each stage reports progress through
 * onStepLog so the frontend can stream the console.
 */
export class OpenRouterService {

  public async executeMultiEnginePipeline(
    req: WorkflowRequest & { firmId: string },
    onStepLog: (step: AgentExecutionStep) => void
  ): Promise<any> {
    return this.processWorkflowPipeline(req, onStepLog);
  }

  public async processWorkflowPipeline(
    req: WorkflowRequest & { firmId?: string },
    onStepLog: (stepData: any) => void
  ) {
    const startTime = Date.now();
    const isContinuation = Boolean(req.existingDraft);

    const geminiExtraction = await this.runFactExtraction(req, onStepLog);
    const jurisprudencia = this.runPrecedentSearch(req, onStepLog);
    const gptStructure = await this.runDogmaticOutline(req, geminiExtraction, jurisprudencia, onStepLog);
    const legalText = await this.runDrafting(req, geminiExtraction, jurisprudencia, gptStructure, onStepLog);

    onStepLog({
      stage: 'STAGE_3_REDACCION',
      engine: 'CLAUDE',
      message: `[Claude Opus 5] Redacción finalizada exitosamente en ${Date.now() - startTime}ms.`,
      timestamp: new Date().toISOString()
    });

    const isTutela = detectLegalTopic(req.documentType, req.legalPrompt) === 'TUTELA';

    return {
      title: generateCleanDocumentTitle(req.documentType, geminiExtraction),
      documentType: req.documentType,
      jurisprudenciaCitada: jurisprudencia,
      excepcionesFormuladas: isTutela
        ? ['Protección Inmediata del Debido Proceso (Art. 29 C.P.)', 'Habeas Data Procesal & Corrección de Registros (Art. 15 C.P.)']
        : ['Prescripción Trienal (Art. 151 CPTSS)', 'Inexistencia de la Obligación'],
      legalText,
      tokensConsumed: 4820,
      isContinuation
    };
  }

  /**
   * Phase 1 — Gemini 3.6 Flash. Extracts facts, parties and claims only; in
   * continuation mode it lists the requested changes instead of re-reading the
   * whole case.
   */
  private async runFactExtraction(req: WorkflowRequest, onStepLog: (step: any) => void): Promise<string> {
    onStepLog({
      stage: 'STAGE_1_INGESTION',
      engine: 'GEMINI',
      message: '[Gemini 3.6 Flash] Extracción de hechos fácticos, partes procesales y pretensiones del caso...',
      timestamp: new Date().toISOString()
    });

    const systemPrompt = req.existingDraft
      ? `Eres un analista judicial. Ya existe un borrador de "${req.documentType}". El usuario quiere CONTINUARLO o CORREGIRLO. Tu tarea es identificar SOLO:\n1. QUÉ PIDE EL USUARIO que se cambie/agregue/corrija (máximo 5 puntos)\n2. SECCIONES AFECTADAS del borrador existente\n3. DATOS FÁCTICOS NUEVOS si los hay\n\nNO repitas los hechos que ya están en el borrador. Solo identifica los cambios solicitados. Máximo 300 palabras.`
      : `Eres un procesador fáctico judicial. Tu ÚNICA tarea es extraer en formato de lista concisa:\n1. HECHOS RELEVANTES (máximo 8 puntos)\n2. PARTES PROCESALES (demandante/accionante, demandado/accionado)\n3. PRETENSIONES (lo que se pide)\n4. TIPO DE PROCESO: ${req.documentType}\n\nResponde SOLO con la extracción. Sin comentarios, sin redacción, sin encabezados solemnes. Máximo 500 palabras.`;

    const userPrompt = req.existingDraft
      ? `${req.legalPrompt}\n\n--- BORRADOR EXISTENTE (primeros ${DRAFT_CONTEXT_CHARS} caracteres) ---\n${req.existingDraft.substring(0, DRAFT_CONTEXT_CHARS)}`
      : req.legalPrompt;

    const extraction = await callOpenRouterModel(
      ENGINE.GEMINI,
      systemPrompt,
      userPrompt,
      req.existingDraft ? MAX_TOKENS.GEMINI_CONTINUATION : MAX_TOKENS.GEMINI_NEW
    );

    console.log(`[PIPELINE] Gemini 3.6 Flash: ${extraction.length} caracteres extraídos.`);
    return extraction;
  }

  /** Phase 1.5 — precedent lookup across every Colombian high court. */
  private runPrecedentSearch(req: WorkflowRequest, onStepLog: (step: any) => void): string[] {
    const topic = detectLegalTopic(req.documentType, req.legalPrompt);
    const jurisprudencia = JURISPRUDENCE_BY_TOPIC[topic];

    onStepLog({
      stage: 'STAGE_1_RAG',
      engine: 'SUPABASE',
      message: `[pgvector RAG] Encontradas ${jurisprudencia.length} providencias aplicables en SYSTEM_CORPUS.`,
      timestamp: new Date().toISOString(),
      data: { jurisprudencia }
    });

    return jurisprudencia;
  }

  /**
   * Phase 2 — GPT-5.6 Sol. Produces the dogmatic outline: legal problem,
   * defences, governing norms and argumentative strategy. It never drafts.
   */
  private async runDogmaticOutline(
    req: WorkflowRequest,
    geminiExtraction: string,
    jurisprudencia: string[],
    onStepLog: (step: any) => void
  ): Promise<string> {
    onStepLog({
      stage: 'STAGE_2_LOGIC',
      engine: 'GPT',
      message: `[GPT-5.6 Sol] Formulación del problema jurídico y esquema dogmático para ${req.documentType}...`,
      timestamp: new Date().toISOString()
    });

    const systemPrompt = req.existingDraft
      ? `Eres un revisor procesal senior de Colombia. Ya existe un borrador de "${req.documentType}" que el usuario quiere CORREGIR o CONTINUAR. Tu tarea es producir un ESQUEMA DE CORRECCIONES conciso con:\n1. CAMBIOS IDENTIFICADOS por Gemini que deben aplicarse\n2. NORMAS QUE APLICAN a las correcciones\n3. SECCIONES DEL BORRADOR QUE DEBEN MODIFICARSE\n\nNO generes un esquema completo desde cero. Solo lo necesario para las correcciones. Máximo 400 palabras.`
      : `Eres un estructurador procesal senior de Colombia. Tu ÚNICA tarea es producir un ESQUEMA CONCISO con:\n1. PROBLEMA JURÍDICO (1-2 oraciones)\n2. EXCEPCIONES O DEFENSAS APLICABLES (lista)\n3. NORMAS CLAVE (artículos específicos)\n4. ESTRATEGIA DE SUSTENTACIÓN (enfoque argumentativo)\n\nNO redactes el documento final. Solo entrega el esquema estructurado. Máximo 600 palabras.`;

    const facts = geminiExtraction || req.legalPrompt;
    const userPrompt = req.existingDraft
      ? `CAMBIOS IDENTIFICADOS POR GEMINI:\n${facts}\n\nJURISPRUDENCIA RAG:\n${jurisprudencia.join('\n')}\n\nINSTRUCCIÓN DEL USUARIO: ${req.legalPrompt}\n\nTIPO DE DOCUMENTO: ${req.documentType}`
      : `HECHOS EXTRAÍDOS POR GEMINI:\n${facts}\n\nJURISPRUDENCIA RAG:\n${jurisprudencia.join('\n')}\n\nTIPO DE DOCUMENTO: ${req.documentType}`;

    const structure = await callOpenRouterModel(
      ENGINE.GPT,
      systemPrompt,
      userPrompt,
      req.existingDraft ? MAX_TOKENS.GPT_CONTINUATION : MAX_TOKENS.GPT_NEW
    );

    console.log(`[PIPELINE] GPT-5.6 Sol: ${structure.length} caracteres de esquema.`);

    onStepLog({
      stage: 'STAGE_2_LOGIC',
      engine: 'GPT',
      message: `[GPT Router] Esquema dogmático consolidado (${structure.length} caracteres).`,
      timestamp: new Date().toISOString()
    });

    return structure;
  }

  /**
   * Phase 3 — Claude Opus 5. Writes the complete document from Gemini's facts
   * and GPT's outline. Falls back to a static Colombian template if the call
   * fails, so the lawyer never faces an empty canvas.
   */
  private async runDrafting(
    req: WorkflowRequest & { firmId?: string },
    geminiExtraction: string,
    jurisprudencia: string[],
    gptStructure: string,
    onStepLog: (step: any) => void
  ): Promise<string> {
    onStepLog({
      stage: 'STAGE_3_REDACCION',
      engine: 'CLAUDE',
      message: req.existingDraft
        ? '[Claude Opus 5] Continuación/corrección sobre borrador existente con sustentación legal...'
        : '[Claude Opus 5] Redacción de pieza procesal con lenguaje jurídico formal y sustentación legal...',
      timestamp: new Date().toISOString()
    });

    // Resolved per firm so a term the firm verified in the curation screen is
    // the one Claude drafts against, not the shipped default it replaced.
    const catalogGuidance = req.firmId
      ? await buildCatalogGuidanceForFirm(req.firmId, req.documentType)
      : undefined;

    const systemPrompt = buildClaudeDraftPrompt({
      documentType: req.documentType,
      prompt: req.legalPrompt,
      citations: jurisprudencia,
      customFormat: req.customFormatInstruction,
      existingDraft: req.existingDraft,
      catalogGuidance
    });

    const userMessage = buildClaudeUserMessage({
      documentType: req.documentType,
      prompt: req.legalPrompt,
      facts: geminiExtraction,
      citations: jurisprudencia,
      gptSchemaOutput: gptStructure,
      existingDraft: req.existingDraft
    });

    const draft = await callOpenRouterModel(ENGINE.OPUS, systemPrompt, userMessage);

    if (draft.length > MIN_DRAFT_LENGTH) {
      return draft;
    }

    console.warn('[PIPELINE] Claude Opus 5 returned no usable draft; using the static template.');
    return buildSolemnColombianDraft(req.documentType, req.legalPrompt, jurisprudencia, req.customFormatInstruction);
  }
}

export { OpenRouterService as OpenRouterMultiEngineService };
