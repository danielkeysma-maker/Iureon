import { ENGINE, callOpenRouterWithUsage } from './openrouter.client';
import { recordUsage } from '../billing/billing.service';
import { vectorSearchService } from '../search/vectorSearch.service';
import { detectLegalTopic } from './topicDetector';
import { generateCleanDocumentTitle } from './documentTitle';
import { buildClaudeDraftPrompt, buildClaudeUserMessage } from './claudeDraft.prompt';
import { buildCatalogGuidanceForFirm } from './catalogGuidance';
import type { LegalBranch } from '../catalog/types';
import { buildSolemnColombianDraft } from './solemnDraft.fallback';

/**
 * Precedents come from the shared corpus, never from a firm's own files: a
 * draft must cite published jurisprudence, not another client's document.
 */
const SHARED_CORPUS = 'SYSTEM_CORPUS';

/**
 * A workflow request with the billing context attached.
 *
 * The firm, the user and the operation id travel through every stage so each
 * model call records what it cost against the document being written. Without
 * them the ledger could say what the platform spent but not on whose behalf,
 * which is the same as not knowing.
 */
export type PipelineRequest = WorkflowRequest & {
  firmId: string;
  userEmail: string;
  operationId: string;
};

export interface WorkflowRequest {
  documentType: string;
  /**
   * Branch the filing belongs to. Optional because older callers omit it, but
   * without it the catalogue cannot resolve a name shared by two branches —
   * "recurso de reposición" is 3 days in civil and 10 in administrativo — and
   * correctly declines to answer rather than pick one.
   */
  legalBranch?: string;
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
    req: PipelineRequest,
    onStepLog: (step: AgentExecutionStep) => void
  ): Promise<any> {
    return this.processWorkflowPipeline(req, onStepLog);
  }

  public async processWorkflowPipeline(
    req: PipelineRequest,
    onStepLog: (stepData: any) => void
  ) {
    const startTime = Date.now();
    const isContinuation = Boolean(req.existingDraft);

    const geminiExtraction = await this.runFactExtraction(req, onStepLog);
    const jurisprudencia = await this.runPrecedentSearch(req, onStepLog);
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
      /*
       * Zero, not 4820.
       *
       * That number was hardcoded and reported for every draft the pipeline had
       * ever produced — a fabricated figure in the one place a client is
       * charged money. The real consumption now lives in `ai_usage`, one row
       * per model call, so this field has nothing true to say and says nothing.
       */
      tokensConsumed: 0,
      isContinuation
    };
  }

  /**
   * Phase 1 — Gemini 3.6 Flash. Extracts facts, parties and claims only; in
   * continuation mode it lists the requested changes instead of re-reading the
   * whole case.
   */
  private async runFactExtraction(req: PipelineRequest, onStepLog: (step: any) => void): Promise<string> {
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

    const { text: extraction, usage } = await callOpenRouterWithUsage(
      ENGINE.GEMINI,
      systemPrompt,
      userPrompt,
      req.existingDraft ? MAX_TOKENS.GEMINI_CONTINUATION : MAX_TOKENS.GEMINI_NEW
    );

    // Recorded per stage, charged once for the document: three engines produce
    // one draft, and a firm should see one price, not three line items.
    await recordUsage({
      firmId: req.firmId,
      userEmail: req.userEmail,
      operation: 'BORRADOR',
      operationId: req.operationId,
      usage
    });

    console.log(`[PIPELINE] Gemini 3.6 Flash: ${extraction.length} caracteres extraídos.`);
    return extraction;
  }

  /**
   * Phase 1.5 — precedent lookup in SYSTEM_CORPUS.
   *
   * This step used to read a hardcoded array and then TELL the user it had run
   * a vector search: the log said "[pgvector RAG] Encontradas N providencias
   * aplicables en SYSTEM_CORPUS", naming Supabase, pgvector and the corpus, none
   * of which were touched. Twenty of the fifty-seven citations in that array
   * used dockets no Colombian court issues — TSB-LAB-2024-1102, CE-SEC3-2020-0756,
   * TAC-089/2024 — templates of an acronym, a branch, a year and a sequence. One
   * more, SU-049 de 2022, named a providencia that does not exist at all.
   *
   * The corpus is real now, so the step does what its log always claimed. When
   * the search finds nothing it returns nothing: the drafting phases receive an
   * empty list and say so, because inventing a precedent is the one failure this
   * pipeline cannot be allowed to have.
   */
  private async runPrecedentSearch(
    req: PipelineRequest,
    onStepLog: (step: any) => void
  ): Promise<string[]> {
    const query = [req.documentType, req.legalPrompt].filter(Boolean).join('. ').trim();
    const result = await vectorSearchService.search(SHARED_CORPUS, query, 12);

    if (result.status !== 'OK') {
      onStepLog({
        stage: 'STAGE_1_RAG',
        engine: 'SUPABASE',
        message: `[RAG] Sin precedentes: ${result.reason ?? result.status}. La redacción continúa sin jurisprudencia.`,
        timestamp: new Date().toISOString(),
        data: { jurisprudencia: [] }
      });
      return [];
    }

    // Chunks, not rulings: one providencia usually matches several times. The
    // model needs each ruling once, and the URL travels with it so the lawyer
    // can open what was cited.
    const byProvidencia = new Map<string, string>();

    for (const match of result.matches) {
      const meta = (match.metadata ?? {}) as Record<string, unknown>;
      const providencia = typeof meta.providencia === 'string' ? meta.providencia : match.fileName;
      if (!providencia || byProvidencia.has(providencia)) continue;

      const parts = [
        typeof meta.corporacion === 'string' ? meta.corporacion.replace(/_/g, ' ') : null,
        typeof meta.magistradoPonente === 'string' ? `M.P. ${meta.magistradoPonente}` : null,
        typeof meta.resuelveOutcome === 'string' ? meta.resuelveOutcome : null,
        typeof meta.sourceUrl === 'string' ? meta.sourceUrl : null
      ].filter(Boolean);

      byProvidencia.set(providencia, `${providencia} (${parts.join(' — ')})`);
    }

    const jurisprudencia = [...byProvidencia.values()];

    onStepLog({
      stage: 'STAGE_1_RAG',
      engine: 'SUPABASE',
      message: jurisprudencia.length
        ? `[pgvector RAG] ${jurisprudencia.length} providencia(s) recuperadas de SYSTEM_CORPUS.`
        : '[pgvector RAG] El corpus no devolvió providencias para esta consulta.',
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
    req: PipelineRequest,
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

    const { text: structure, usage } = await callOpenRouterWithUsage(
      ENGINE.GPT,
      systemPrompt,
      userPrompt,
      req.existingDraft ? MAX_TOKENS.GPT_CONTINUATION : MAX_TOKENS.GPT_NEW
    );

    await recordUsage({
      firmId: req.firmId,
      userEmail: req.userEmail,
      operation: 'BORRADOR',
      operationId: req.operationId,
      usage
    });

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
    req: PipelineRequest,
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
      ? await buildCatalogGuidanceForFirm(
          req.firmId,
          req.documentType,
          req.legalBranch as LegalBranch | undefined
        )
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

    const { text: draft, usage } = await callOpenRouterWithUsage(
      ENGINE.OPUS,
      systemPrompt,
      userMessage
    );

    await recordUsage({
      firmId: req.firmId,
      userEmail: req.userEmail,
      operation: 'BORRADOR',
      operationId: req.operationId,
      usage
    });

    if (draft.length > MIN_DRAFT_LENGTH) {
      return draft;
    }

    console.warn('[PIPELINE] Claude Opus 5 returned no usable draft; using the static template.');
    return buildSolemnColombianDraft(req.documentType, req.legalPrompt, jurisprudencia, req.customFormatInstruction);
  }
}

export { OpenRouterService as OpenRouterMultiEngineService };
