import { ENGINE, callOpenRouterWithUsage } from './openrouter.client';
import {
  PLAZO_ESQUEMA_MS,
  PLAZO_HECHOS_MS,
  PLAZO_JURISPRUDENCIA_MS,
  PLAZO_REDACCION_MS,
  PLAZO_GLOSA_MS,
  PLAZO_VIGENCIA_MS,
  conPresupuesto,
  relojDeEtapa
} from './presupuestoDeTiempo';
import { recordUsage } from '../billing/billing.service';
import { vectorSearchService } from '../search/vectorSearch.service';
import { discoverRulings } from '../jurisprudence/discovery.service';
import { discoverCsjRulings } from '../jurisprudence/csjRuling.service';
import { indexFetchedRulings } from '../jurisprudence/autoIngest.service';
import { detectLegalTopic } from './topicDetector';
import { generateCleanDocumentTitle } from './documentTitle';
import {
  MARCA_DE_ESQUEMA_CORTADO,
  buildClaudeDraftPrompt,
  buildClaudeUserMessage,
  renderJurisprudencia
} from './claudeDraft.prompt';
import { buildCatalogGuidanceForFirm, resolverProcedencia } from './catalogGuidance';
import { revisarCitacionNormativa } from './citacionNormativa';
import {
  SEPARADOR_DE_AVISOS,
  bloquesDeVigencia,
  marcarVigenciaEnLinea,
  resumenDeVigencia,
  verificarVigenciaDelEscrito
} from './review/verificarVigencia';
import {
  bloquesDeGlosa,
  marcarGlosaEnLinea,
  resumenDeGlosa,
  verificarGlosaDelEscrito
} from './review/verificarGlosa';
import type { LegalBranch } from '../catalog/types';

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
  /**
   * How long a document this firm's balance can pay for, in output tokens.
   *
   * Undefined when the balance covers more than any sane filing, which is the
   * ordinary case. Present it caps the drafting model — so a firm can never
   * generate a document it cannot pay for, and a truncated draft always has a
   * reason the lawyer can see and fix: they ran out of credit.
   */
  maxDraftTokens?: number;
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
  customFormatInstruction?: string;
  existingDraft?: string;
  /**
   * What was read from the files the lawyer attached, already rendered as the
   * «DATOS DE LOS ADJUNTOS» block (see `adjuntos/renderBloqueAdjuntos`).
   * Appended to the material EVERY stage receives: Gemini extracts facts from
   * it and Opus writes from it. Passing it to one stage only was the tempting
   * shortcut, and it is how a plate number read by Gemini would still come out
   * as [•] from Opus. Empty when nothing was read.
   */
  bloqueAdjuntos?: string;
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
  /** Facts from the prompt AND from the attached files: a comparendo alone is thirty data points. */
  GEMINI_CON_ADJUNTOS: 2048,
  /*
   * ─── 4.096, Y EL NÚMERO SALE DE LO MEDIDO, NO DE UN REDONDEO ─────────────
   *
   * Con 1.536 el esquema salía CORTADO. Medido el 10 de septiembre de 2026:
   * `finish_reason: 'length'` a los 1.536 tokens, 2.917 caracteres producidos y
   * la ESTRATEGIA DE SUSTENTACIÓN —el último de los cuatro puntos que el prompt
   * pide— cortada a media frase. Se pagaban US$0,017 por un documento
   * incompleto, y lo incompleto viajaba al redactor como si estuviera entero.
   *
   * ARITMÉTICA: 2.917 caracteres en 1.536 tokens son 1,9 caracteres por token
   * —bajo, porque el razonamiento del motor también consume de este tope—. El
   * prompt pide «máximo 600 palabras», que en español son unos 4.200
   * caracteres, y a 1,9 caracteres por token eso son ~2.210 tokens SOLO para
   * llegar al límite pedido. 4.096 deja casi el doble de ese mínimo, que es lo
   * que hace falta para que el motor cierre su última sección en vez de que se
   * la corten. No es gratis en teoría, pero sí en la práctica: el motor para en
   * `stop` cuando termina el esquema, así que el tope solo se paga si de verdad
   * hacía falta.
   */
  GPT_NEW: 4096,
  /*
   * La continuación pide «máximo 400 palabras» (~2.800 caracteres), dos tercios
   * de lo anterior. Mismo cálculo, misma proporción: 2.560.
   */
  GPT_CONTINUATION: 2560
} as const;

/**
 * Appends the attachments block to the material a stage receives.
 *
 * One helper so the three stages cannot disagree about where the block goes
 * or whether an empty block leaves a dangling header — it never does: with
 * nothing read the material is returned untouched.
 */
const conAdjuntos = (material: string, bloque?: string): string =>
  bloque && bloque.trim() ? `${material}\n\n${bloque}` : material;

/** Below this length Claude's answer is treated as a failed generation. */
const MIN_DRAFT_LENGTH = 200;

/** How much of an existing draft Gemini sees when identifying requested changes. */
const DRAFT_CONTEXT_CHARS = 3000;

/**
 * Three-engine drafting pipeline over OpenRouter.
 *
 * Gemini reads the facts and the attachments, GPT-5.6 Sol structures them into
 * a dogmatic outline, and Claude Opus writes the document from both plus the
 * catalogue ficha and the verified jurisprudence. Each stage reports progress
 * through onStepLog so the frontend can stream the console.
 */
/**
 * The precedent search runs on borrowed time, and the draft owns the clock.
 *
 * WHY A DEADLINE AND NOT A RETRY. This phase reaches the open network — a search
 * engine, then up to six downloads from the Court's relatoría — inside a request
 * that already spends three model calls and streams to a lawyer who is waiting.
 * A relatoría having a slow afternoon must not be able to cost somebody their
 * document.
 *
 * FAILING OPEN IS SAFE HERE, and that is not true of every timeout. Giving up on
 * discovery yields an empty citation list, and an empty list is now an explicit
 * instruction not to cite anything rather than a blank the model would fill. So
 * the degraded path is the honest one: the draft comes out without precedent and
 * says so, instead of not coming out at all.
 *
 * The promise is abandoned, not cancelled. Whatever it was doing finishes or
 * dies with the invocation; nothing downstream reads it either way.
 */
/**
 * DEJARON DE SER FIJOS. Eran 20 s de descubrimiento y 15 s de indexado: 35 s
 * dentro de una etapa que hoy tiene un presupuesto de 8 s, y dentro de una
 * función que tiene 60. Ahora cada paso recibe lo que quede del presupuesto de
 * su etapa, y el indexado —que es un regalo al corpus, no parte del escrito—
 * solo corre si sobra tiempo de verdad.
 */
const MINIMO_PARA_INDEXAR_MS = 2_000;

const conPlazo = async <T>(trabajo: Promise<T>, ms: number, alVencer: T): Promise<T> => {
  let reloj: NodeJS.Timeout | undefined;
  const plazo = new Promise<T>((resolve) => {
    reloj = setTimeout(() => resolve(alVencer), ms);
  });

  try {
    return await Promise.race([trabajo, plazo]);
  } finally {
    // Sin esto el temporizador sostiene el event loop hasta vencer, y una
    // función serverless que ya respondió se queda viva pagando por nada.
    if (reloj) clearTimeout(reloj);
  }
};


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

    /*
     * CADA ETAPA CON SU PRESUPUESTO, Y LA SUMA POR DEBAJO DEL TOPE DE LA
     * FUNCION. Ver `presupuestoDeTiempo.ts`: agotar uno lanza
     * `TiempoDeRedaccionAgotado`, que el controlador convierte en devolucion de
     * la reserva y en un mensaje que el abogado lee. Antes cortaba la
     * plataforma, que no devuelve nada ni dice nada.
     */
    const geminiExtraction = await conPresupuesto(
      this.runFactExtraction(req, onStepLog),
      PLAZO_HECHOS_MS,
      'extraccion de hechos'
    );
    const jurisprudencia = await conPresupuesto(
      this.runPrecedentSearch(req, onStepLog),
      PLAZO_JURISPRUDENCIA_MS,
      'busqueda de jurisprudencia'
    );
    /*
     * ─── LA ETAPA 2 CORRE CON `conPlazo`, NO CON `conPresupuesto` ───────────
     *
     * Y esa es toda la diferencia entre una etapa que MEJORA el escrito y una
     * sin la cual no hay escrito. `conPresupuesto` RECHAZA al vencer, que es lo
     * correcto para los hechos o la redacción; aquí sería tumbar un borrador
     * caro por perder una ayuda. Al vencer, el esquema queda vacío y
     * `runDrafting` sigue con los hechos, la ficha y la jurisprudencia,
     * exactamente como corría el pipeline de dos motores.
     */
    const gptStructure = await conPlazo(
      this.runDogmaticOutline(req, geminiExtraction, jurisprudencia, onStepLog),
      PLAZO_ESQUEMA_MS,
      ''
    );
    const legalText = await conPresupuesto(
      this.runDrafting(req, geminiExtraction, jurisprudencia, gptStructure, onStepLog),
      PLAZO_REDACCION_MS,
      'redaccion del escrito'
    );

    onStepLog({
      stage: 'STAGE_3_REDACCION',
      engine: 'CLAUDE',
      message: `[Claude Opus 5] Redacción finalizada exitosamente en ${Date.now() - startTime}ms.`,
      timestamp: new Date().toISOString()
    });

    /*
     * LA PROCEDENCIA VIAJA CON EL BORRADOR. `runDrafting` ya resolvió esta misma
     * ficha para instruir al modelo y la descartó; se resuelve otra vez aquí en
     * vez de arrastrarla por la firma de tres funciones. Es el catálogo en
     * memoria más una lectura de curaduría por firma — y a cambio, el visor
     * puede decir contra qué ficha se redactó y si su término está comprobado,
     * que es lo que 5a necesita revisar ANTES de exportar.
     */
    const procedencia = await resolverProcedencia(
      req.firmId,
      req.documentType,
      req.legalBranch as LegalBranch | undefined
    );

    /*
     * ─── EL CEDAZO CORRE EN LA MISMA PASADA QUE EL PROMPT ────────────────────
     *
     * Los tres jueces impusieron la misma condición de entrada: una instrucción
     * de prompt sin cedazo en código es exactamente lo que llevábamos un mes
     * teniendo. Aquí está, sobre el texto que salió, contra el universo
     * autorizado que `procedencia` acaba de traer.
     *
     * SE DECLARA, NO SE EDITA. Recortar citas del escrito a espaldas del abogado
     * sería peor que el defecto: quedaría un párrafo argumentando sobre un
     * artículo que ya no está. Lo que hace es dejar constancia en el registro de
     * la corrida, que es donde se mide, y dar la CIFRA REAL —producida por el
     * código y no por la introspección del propio redactor, que es la razón por
     * la que la propuesta del anexo se descartó.
     */
    /*
     * ─── Y LA VIGENCIA SE COMPRUEBA CONTRA EL TEXTO OFICIAL ─────────────────
     *
     * El cedazo de arriba mide si una cita está DENTRO DE LO QUE ESTA CASA HA
     * LEÍDO. Esto de aquí mide otra cosa, y es la que hacía falta para poder
     * volver a abrir la mano: si lo que el escrito citó por su cuenta SIGUE
     * VIVO. Se midió que el motor no inventa artículos, pero sí cita muertos —el
     * art. 2035 del Código Civil, derogado en 2003, invocado como fundamento de
     * la pretensión— y un artículo muerto es peor que uno inventado, porque el
     * juez sí lo encuentra.
     *
     * VA AQUÍ, DESPUÉS DE REDACTAR, con su propio presupuesto: lo que comprueba
     * son las citas que el borrador ya trae. Y NO usa `conPresupuesto`, que
     * rechaza, sino el tope interno del propio verificador, que devuelve
     * NO_VERIFICABLE: llegados a este punto el escrito ya está escrito y ya se
     * pagó, así que una mala tarde del Senado no puede costar el borrador.
     */
    const vigencia = await verificarVigenciaDelEscrito(
      legalText,
      procedencia?.articulosAutorizados ?? [],
      PLAZO_VIGENCIA_MS
    );
    if (vigencia.resultados.length > 0) {
      onStepLog({
        stage: 'STAGE_3_REDACCION',
        engine: 'CLAUDE',
        message: `[Vigencia] ${resumenDeVigencia(vigencia)}`,
        timestamp: new Date().toISOString()
      });
    }

    /*
     * ─── Y LO QUE EL ESCRITO AFIRMA DE CADA ARTÍCULO, CONTRA SU TEXTO ───────
     *
     * Tercera comprobación, tercer defecto distinto. La primera mira si la cita
     * está DENTRO DE LO QUE ESTA CASA HA LEÍDO (el cedazo); la segunda, si el
     * artículo sigue vivo (la vigencia). Esta mira si el escrito dice bien lo
     * que ese artículo dice, que es lo único que ninguna de las dos podía ver:
     * el art. 8 de la Ley 820 sale VIGENTE —lo está— mientras la frase «sobre
     * las obligaciones del arrendatario» es su reverso exacto, porque son las
     * del ARRENDADOR.
     *
     * NO DESCARGA NADA NUEVO: se le pasan los resultados de la vigencia, que ya
     * traen el texto oficial de esos mismos artículos. Lo que añade son hasta
     * ocho llamadas al motor barato, en paralelo, con el texto delante.
     *
     * Y como la vigencia, NO usa `conPresupuesto`: agotar el plazo aquí
     * significa DUDOSA declarada, nunca un borrador perdido.
     *
     * SE JUZGA SOBRE `legalText`, el escrito tal como salió del motor. Pasarle
     * el texto ya anotado le daría a juzgar las frases de la propia advertencia
     * de vigencia — el sistema comprobando lo que el sistema acaba de escribir.
     */
    const glosa = await verificarGlosaDelEscrito(legalText, vigencia.resultados, PLAZO_GLOSA_MS);

    /*
     * ─── Y SE REGISTRA LO QUE ESTA ETAPA GASTO, QUE ANTES ERA INVISIBLE ────
     *
     * Hasta el 10 de septiembre de 2026 estas hasta ocho llamadas al motor
     * barato no dejaban una sola fila en `ai_usage`. No era un informe que
     * faltara: `settleOperation` calcula el excedente SUMANDO
     * `ai_usage.cost_usd` por `operation_id`, asi que el costo de cada
     * borrador quedaba subestimado en ocho llamadas y el margen que `MARKUP`
     * promete se media sobre un costo que no era el real.
     *
     * El dueno lo vio antes que la tabla: «no costo 40 centavos, costo casi 3
     * dolares porque el saldo se bajo abruptamente». Parte de esa diferencia
     * se gastaba aqui, sin rastro.
     *
     * Van con la MISMA `operation` y el MISMO `operationId` que las otras tres
     * etapas, y eso es deliberado: el precio que ve la firma sigue siendo uno
     * por documento —cuatro motores, un borrador, una linea— y lo que cambia
     * es que el costo contra el que se liquida por fin incluye todo.
     *
     * En serie y no con `Promise.all` porque son escrituras a la misma tabla
     * al final de una funcion que ya gasto su presupuesto de reloj; y si una
     * falla, `recordUsage` lo dice por consola y no tumba el borrador, que a
     * estas alturas ya esta escrito y pagado.
     */
    for (const usage of glosa.usos) {
      await recordUsage({
        firmId: req.firmId,
        userEmail: req.userEmail,
        operation: 'BORRADOR',
        operationId: req.operationId,
        usage
      });
    }

    if (glosa.resultados.length > 0) {
      onStepLog({
        stage: 'STAGE_3_REDACCION',
        engine: 'GEMINI',
        message: `[Glosa] ${resumenDeGlosa(glosa)}`,
        timestamp: new Date().toISOString()
      });
    }

    /*
     * ─── LAS DOS COMPROBACIONES SE COMPONEN AQUÍ, Y EN ESTE ORDEN ───────────
     *
     * El CUERPO se marca una vez con cada una, y solo después se apilan las
     * cabeceras. Anotar por separado —cada comprobación con su marcado y su
     * cabecera— hacía que la segunda pegara sus corchetes DENTRO del aviso de
     * la primera, que escribe citas («Ley 820 de 2003, art. 8») indistinguibles
     * de las del escrito. Un aviso anotando a otro aviso es la forma más rápida
     * de que el abogado deje de leer los dos.
     */
    let textoEntregado = legalText;
    const avisos = [...bloquesDeVigencia(vigencia), ...bloquesDeGlosa(glosa)];
    if (avisos.length > 0) {
      const cuerpo = marcarGlosaEnLinea(marcarVigenciaEnLinea(legalText, vigencia), glosa);
      textoEntregado = `${avisos.join('\n\n')}\n\n${SEPARADOR_DE_AVISOS}\n\n${cuerpo}`;
    }

    if (procedencia && procedencia.articulosAutorizados.length > 0) {
      const cedazo = revisarCitacionNormativa(legalText, procedencia.articulosAutorizados);
      if (cedazo.hallazgos.length > 0) {
        onStepLog({
          stage: 'STAGE_3_REDACCION',
          engine: 'CLAUDE',
          message: `[Cedazo de citación] ${cedazo.articulosCitados} artículos citados, ${cedazo.citasFueraDeLaLista} fuera de lo verificado. ${cedazo.hallazgos
            .slice(0, 8)
            .map((h) => `${h.clase}: ${h.fragmento}`)
            .join(' | ')}`,
          timestamp: new Date().toISOString()
        });
      }
    }

    const isTutela = detectLegalTopic(req.documentType, req.legalPrompt) === 'TUTELA';

    return {
      title: generateCleanDocumentTitle(req.documentType, geminiExtraction),
      documentType: req.documentType,
      jurisprudenciaCitada: jurisprudencia,
      excepcionesFormuladas: isTutela
        ? ['Protección Inmediata del Debido Proceso (Art. 29 C.P.)', 'Habeas Data Procesal & Corrección de Registros (Art. 15 C.P.)']
        : ['Prescripción Trienal (Art. 151 CPTSS)', 'Inexistencia de la Obligación'],
      /*
       * EL TEXTO QUE SALE ES EL ANOTADO. Si la comprobación de vigencia
       * encontró un artículo derogado, la advertencia viaja DENTRO del escrito
       * —en el párrafo y en la cabecera— y no en un metadato que el visor
       * podría no mostrar y la exportación a Word perdería. Cuando no hubo nada
       * que comprobar, es el mismo texto del motor, carácter por carácter.
       */
      legalText: textoEntregado,
      /*
       * Zero, not 4820.
       *
       * That number was hardcoded and reported for every draft the pipeline had
       * ever produced — a fabricated figure in the one place a client is
       * charged money. The real consumption now lives in `ai_usage`, one row
       * per model call, so this field has nothing true to say and says nothing.
       */
      tokensConsumed: 0,
      procedencia,
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

    const base = req.existingDraft
      ? `${req.legalPrompt}\n\n--- BORRADOR EXISTENTE (primeros ${DRAFT_CONTEXT_CHARS} caracteres) ---\n${req.existingDraft.substring(0, DRAFT_CONTEXT_CHARS)}`
      : req.legalPrompt;
    const userPrompt = conAdjuntos(base, req.bloqueAdjuntos);

    /*
     * With attachments the extraction has more to carry — every number, date,
     * name and place read from the files must survive into the fact list, or
     * the next two stages never see them — so the budget grows with them.
     */
    const maxTokens = req.bloqueAdjuntos
      ? MAX_TOKENS.GEMINI_CON_ADJUNTOS
      : req.existingDraft
        ? MAX_TOKENS.GEMINI_CONTINUATION
        : MAX_TOKENS.GEMINI_NEW;

    /*
     * RAZONAMIENTO MINIMO, Y NO ES UN AHORRO: ES LA DIFERENCIA ENTRE EXTRAER
     * LOS HECHOS Y NO EXTRAERLOS.
     *
     * Medido el 9 de septiembre de 2026 con el mismo caso. Con el razonamiento
     * por defecto la llamada gastaba 981 de sus 1.024 tokens razonando, el
     * proveedor cortaba por longitud (`finish_reason: length`) y la etapa
     * entregaba entre 89 y 168 caracteres de «hechos» — un encabezado y media
     * frase— en 7,6-8,6 s. Con `minimal`: 5,4 s, 1.733 caracteres, extraccion
     * completa, y la mitad del costo (US$0,0023 contra US$0,0041).
     *
     * Pasaba desapercibido porque Opus recibe ademas la indicacion literal del
     * abogado, asi que el escrito salia bien igual y nadie notaba que la etapa
     * que lo precede estaba entregando basura.
     */
    const { text: extraction, usage } = await callOpenRouterWithUsage(
      ENGINE.GEMINI,
      systemPrompt,
      userPrompt,
      maxTokens,
      undefined,
      { reasoningEffort: 'minimal', timeoutMs: PLAZO_HECHOS_MS }
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
    const reloj = relojDeEtapa(PLAZO_JURISPRUDENCIA_MS);
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

    if (jurisprudencia.length > 0) return jurisprudencia;

    return this.runPrecedentDiscovery(query, reloj, onStepLog);
  }

  /**
   * Phase 1.6 — what happens when the corpus has nothing.
   *
   * WHY THIS EXISTS. The corpus holds 62 curated providencias against a national
   * body of tens of thousands. For most matters it will return nothing, and
   * until now that silence went straight into the prompt as an empty field — two
   * lines under an instruction to cite. That is the precise condition under
   * which a model fills the blank, and this codebase already shipped one draft
   * citing SU-049 de 2022, a providencia that does not exist.
   *
   * WHAT THIS IS NOT. It is not "let the model look things up". A search engine
   * never decides what a ruling says, or that it exists. It is restricted to the
   * Court's own domain and produces nothing but citation strings, and each one
   * then passes through `fetchOfficialRuling` — the same door a citation typed
   * by hand goes through, where the State's register confirms it and the
   * relatoría supplies the text. What the search engine believes never reaches
   * the draft.
   *
   * WHAT IT DOES NOT COVER. Corte Constitucional only. A labour or contentious
   * matter still finds nothing here, and gets the honest empty-handed prompt
   * rather than a search over blogs.
   */
  private async runPrecedentDiscovery(
    query: string,
    reloj: { restante: () => number },
    onStepLog: (step: any) => void
  ): Promise<string[]> {
    /*
     * Las dos cortes se consultan a la vez, y no es solo por velocidad.
     *
     * Llegan por caminos distintos a propósito. La Corte Constitucional no
     * publica un índice consultable, así que hay que entrar por un buscador web
     * restringido a su dominio y confirmar cada cita contra el registro del
     * Estado. La Corte Suprema sí busca sobre sus propias providencias y
     * responde con los nombres de archivo que guardó, así que el resultado ES la
     * confirmación — no hay tercero de quien desconfiar, ni llave que pedir.
     *
     * Consecuencia práctica que vale escribir: sin BRAVE_API_KEY la Corte
     * Suprema sigue funcionando. Antes, sin llave no había descubrimiento
     * ninguno, y toda la materia laboral, civil y penal se quedaba sin
     * precedente aunque las providencias estuvieran a una consulta de distancia.
     */
    const plazoDescubrimiento = reloj.restante();
    const [discovery, csj] = await Promise.all([
      conPlazo(discoverRulings(query), plazoDescubrimiento, {
        status: 'FAILED' as const,
        found: [],
        descartadas: [],
        reason: 'la búsqueda tardó más de lo que el borrador puede esperar'
      }),
      conPlazo(discoverCsjRulings(query), plazoDescubrimiento, [])
    ]);

    const halladas = [
      ...discovery.found.map((f) => f.ruling),
      ...csj.map((c) => c.ruling)
    ];

    if (halladas.length === 0) {
      onStepLog({
        stage: 'STAGE_1_RAG',
        engine: 'SUPABASE',
        message:
          discovery.status === 'NO_PROVIDER'
            ? '[Descubrimiento] No configurado. La redacción continúa sin jurisprudencia y se le prohíbe al modelo citar de memoria.'
            : `[Descubrimiento] Ni la Corte Constitucional ni la Corte Suprema tienen providencias verificables para esta consulta (${discovery.descartadas.length} candidata(s) descartada(s)). La redacción continúa sin jurisprudencia.`,
        timestamp: new Date().toISOString(),
        data: { jurisprudencia: [], descartadas: discovery.descartadas }
      });
      return [];
    }

    const jurisprudencia = [
      ...discovery.found.map(
        ({ ruling }) =>
          `${ruling.citation} (CORTE CONSTITUCIONAL — M.P. ${ruling.magistrado} — ${ruling.sourceUrl})`
      ),
      ...csj.map(
        ({ ruling }) => `${ruling.citation} (CORTE SUPREMA DE JUSTICIA, ${ruling.sala} — M.P. ${ruling.magistrado})`
      )
    ];

    onStepLog({
      stage: 'STAGE_1_RAG',
      engine: 'SUPABASE',
      message:
        `[Descubrimiento] ${jurisprudencia.length} providencia(s) confirmadas — ` +
        `${discovery.found.length} de la Corte Constitucional, ${csj.length} de la Corte Suprema.`,
      timestamp: new Date().toISOString(),
      data: { jurisprudencia, descartadas: discovery.descartadas }
    });

    /*
     * Lo encontrado se queda, y por eso se espera en vez de dispararse al aire.
     *
     * Una función serverless se congela al responder: nada lanzado sin await
     * después de `res.json()` tiene garantía de correr. Un `void indexar()` aquí
     * parecería que hace crecer el corpus y no lo haría nunca.
     *
     * Y falla en silencio a propósito: que el índice no acepte una sentencia no
     * es razón para tumbarle el borrador al abogado que ya la tiene confirmada.
     */
    const paraIndexar = reloj.restante();
    if (paraIndexar < MINIMO_PARA_INDEXAR_MS) {
      console.log(
        `[PIPELINE] No se indexa lo descubierto: quedan ${paraIndexar} ms del presupuesto de la etapa y el escrito manda.`
      );
      return jurisprudencia;
    }

    try {
      const indexado = await conPlazo(indexFetchedRulings(halladas), paraIndexar, []);
      const nuevas = indexado.filter((r) => r.status === 'INDEXED').length;
      if (nuevas > 0) {
        console.log(`[PIPELINE] ${nuevas} providencia(s) incorporadas al corpus por descubrimiento.`);
      }
    } catch (error) {
      console.warn(`[PIPELINE] El corpus no aceptó lo descubierto: ${(error as Error).message}`);
    }

    return jurisprudencia;
  }

  /**
   * Phase 2 — GPT-5.6 Sol. Produces the dogmatic outline: legal problem,
   * defences, governing norms and argumentative strategy. It never drafts.
   *
   * ─── SE RETIRÓ EL 9 DE SEPTIEMBRE DE 2026 Y SE REPUSO EL 10 ───────────────
   *
   * Aquí decía que la etapa estaba retirada. HOY ESA AFIRMACIÓN SERÍA FALSA, y
   * conviene que quede escrito por qué, porque el motivo de la retirada era
   * real y caducó por una razón concreta.
   *
   * SE RETIRÓ porque costaba 35–40 s dentro de una función que tenía 60 —con su
   * plazo de entonces (20 s) abortaba en 3 de 3 corridas y entregaba cero
   * caracteres—, y porque se supuso que la ficha del catálogo hacía su trabajo.
   * Ese mismo día el plan pasó a Pro y el tope de la función a 300 s, así que
   * la mitad aritmética del motivo dejó de existir.
   *
   * SE REPUSO porque la otra mitad resultó falsa, y se midió: un caso por
   * brazo, con los tres motores reales, el 10 de septiembre de 2026.
   *
   *   · SIN esquema, el escrito SE NIEGA A NOMBRAR LA CAUSAL SUSTANCIAL.
   *     Escribe, tres veces, «el fundamento sustancial relativo a la obligación
   *     del arrendatario de pagar el precio… no está verificado en este escrito
   *     y debe comprobarse antes de radicar» — y el artículo 22, numeral 1, de
   *     la Ley 820 de 2003 estaba autorizado en la ficha TODO EL TIEMPO. La
   *     ficha imponía la norma; lo que faltaba era quien decidiera que ESA era
   *     la causal del caso, y eso es exactamente el trabajo de esta etapa.
   *   · CON esquema la invoca por su artículo, produce además un hecho que
   *     anticipa la excepción de contrato no cumplido, y ordena las
   *     pretensiones declarando primero la existencia del contrato.
   *
   * Precio de la mejora, medido: US$0,2285 → US$0,2997 (+31%) y +56 s.
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
    const userPrompt = conAdjuntos(
      req.existingDraft
        ? `CAMBIOS IDENTIFICADOS POR GEMINI:\n${facts}\n\n${renderJurisprudencia(jurisprudencia)}\n\nINSTRUCCIÓN DEL USUARIO: ${req.legalPrompt}\n\nTIPO DE DOCUMENTO: ${req.documentType}`
        : `HECHOS EXTRAÍDOS POR GEMINI:\n${facts}\n\n${renderJurisprudencia(jurisprudencia)}\n\nTIPO DE DOCUMENTO: ${req.documentType}`,
      req.bloqueAdjuntos
    );

    /*
     * El plazo de la llamada es el presupuesto de la etapa, igual que en la
     * redacción: quien corta es este código, por debajo del tope de la
     * plataforma. Sin esto la llamada usaría los 20 s fijos del cliente, que
     * son precisamente los que la abortaban en 3 de 3 corridas.
     */
    const {
      text: structure,
      usage,
      truncated
    } = await callOpenRouterWithUsage(
      ENGINE.GPT,
      systemPrompt,
      userPrompt,
      req.existingDraft ? MAX_TOKENS.GPT_CONTINUATION : MAX_TOKENS.GPT_NEW,
      undefined,
      { timeoutMs: PLAZO_ESQUEMA_MS }
    );

    await recordUsage({
      firmId: req.firmId,
      userEmail: req.userEmail,
      operation: 'BORRADOR',
      operationId: req.operationId,
      usage
    });

    console.log(
      `[PIPELINE] GPT-5.6 Sol: ${structure.length} caracteres de esquema.` +
        (truncated ? ' CORTADO POR LONGITUD.' : '')
    );

    /*
     * ─── UN ESQUEMA CORTADO SE DECLARA, NO SE DISIMULA ──────────────────────
     *
     * Con el tope viejo esto pasaba SIEMPRE y no se veía en ninguna parte: el
     * registro anunciaba «esquema consolidado (2.917 caracteres)» y el trozo
     * incompleto viajaba al redactor como si estuviera entero, con la
     * estrategia de sustentación cortada a media frase. El tope nuevo debería
     * bastar; si aun así se corta, quien lee el registro tiene que enterarse
     * aquí, y el redactor recibe el bloque rotulado como incompleto (ver
     * `buildClaudeUserMessage`).
     */
    onStepLog({
      stage: 'STAGE_2_LOGIC',
      engine: 'GPT',
      message: truncated
        ? `[GPT Router] Esquema dogmático INCOMPLETO: el proveedor lo cortó por longitud a los ${structure.length} caracteres. Viaja al redactor rotulado como incompleto.`
        : `[GPT Router] Esquema dogmático consolidado (${structure.length} caracteres).`,
      timestamp: new Date().toISOString()
    });

    return truncated && structure ? `${structure}\n\n${MARCA_DE_ESQUEMA_CORTADO}` : structure;
  }

  /**
   * Phase 3 — Claude Opus 5. Writes the complete document from Gemini's facts,
   * GPT's dogmatic outline, the catalogue ficha and the verified
   * jurisprudence. When the call yields
   * nothing usable the stage FAILS: the empty canvas is honest, and the static
   * template that used to fill it was a document of another kind wearing the
   * lawyer's request as a title.
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
          req.legalBranch as LegalBranch | undefined,
          /*
           * REDACCION cierra la lista de artículos y añade el andamiaje de la
           * rama. Es la única superficie donde se cierra: la revisión, el chat
           * y las preguntas de audiencia siguen con la lista abierta, porque
           * señalar lo que a un escrito ajeno le falta exige nombrar normas que
           * no están en su ficha. Ver `SuperficieDelBloque`.
           */
          'REDACCION'
        )
      : undefined;

    const systemPrompt = buildClaudeDraftPrompt({
      documentType: req.documentType,
      prompt: req.legalPrompt,
      citations: jurisprudencia,
      customFormat: req.customFormatInstruction,
      existingDraft: req.existingDraft,
      catalogGuidance,
      adjuntos: req.bloqueAdjuntos
    });

    const userMessage = buildClaudeUserMessage({
      documentType: req.documentType,
      prompt: req.legalPrompt,
      facts: geminiExtraction,
      citations: jurisprudencia,
      gptSchemaOutput: gptStructure,
      existingDraft: req.existingDraft,
      adjuntos: req.bloqueAdjuntos,
      catalogGuidance
    });

    /*
     * `low` EN VEZ DE `medium`, Y ES UN CAMBIO MEDIDO, NO UNA CORAZONADA.
     *
     * Con el mismo caso y el mismo prompt, el 9 de septiembre de 2026:
     *
     *   · `medium`: 124,7 s · 21.399 caracteres · 106 negritas · 27 títulos · US$0,2506
     *   · `low`:     84,8 s · 14.636 caracteres ·  81 negritas · 21 títulos · US$0,1829
     *
     * Los dos terminan el escrito (`finish_reason: stop`), los dos traen sus
     * títulos de sección en negrita y su petición. `medium` compra un escrito
     * más largo por cuarenta segundos más y un 37% más de costo, y cuarenta
     * segundos es la mitad del reloj entero de la función. Se toma `low`.
     *
     * El plazo de la llamada es el presupuesto de la etapa: quien corta es este
     * código, y por debajo del tope de la plataforma.
     */
    const { text: draft, usage } = await callOpenRouterWithUsage(
      ENGINE.OPUS,
      systemPrompt,
      userMessage,
      req.maxDraftTokens,
      undefined,
      { reasoningEffort: 'low', timeoutMs: PLAZO_REDACCION_MS }
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

    /*
     * SIN BORRADOR SE FALLA. NO SE FABRICA UNO.
     *
     * ─── LO QUE HABIA AQUI, Y POR QUE ERA LOS DOS DEFECTOS REPORTADOS ────────
     *
     * Esta rama devolvia una plantilla estatica (`solemnDraft.fallback`, ya
     * borrado): un texto escrito en el codigo que NO conoce la actuacion pedida,
     * y que elegia entre tres
     * textos fijos olfateando palabras —«tutela» en el tipo O EN LA INDICACION
     * DEL ABOGADO, «soldado» o «mina» para reparacion directa— y, si ninguna
     * casaba, entregaba un escrito generico encabezado «SEÑOR JUEZ PROCESAL DE
     * COLOMBIA» con partes «DEMANDANTE / AFECTADO CONTRA DEMANDADO».
     *
     * Medido el 9 de septiembre de 2026 contra el motor real, en el mismo caso
     * y con la misma ficha:
     *
     *   - un borrador de Opus trae entre 56 y 99 pares de `**` (129 a 184
     *     capas de negrita para el lienzo), y su encabezado nombra la actuacion
     *     pedida;
     *   - la plantilla estatica trae CERO pares de `**`, y el visor de
     *     Redaccion pinta en negrita UNICAMENTE lo que viene entre `**`.
     *
     * Es decir: la unica ruta del motor que entrega un escrito de otro tipo es
     * exactamente la misma que lo entrega sin una sola negrita. Los dos
     * sintomas que reporto el titular son un solo defecto, y es este.
     *
     * Y se cobraba: `settleOperation` corre igual, porque desde fuera esta
     * rama era indistinguible de un exito — el registro de ejecucion decia
     * «Redaccion finalizada exitosamente» y el aviso de la plantilla solo
     * existia en la consola del servidor.
     *
     * Fallar aqui devuelve la reserva (el controlador ya lo hace en su catch) y
     * le dice al abogado que no hubo escrito. Es la misma doctrina que ya rige
     * en el navegador, donde se borraron 116 lineas que fabricaban una tutela
     * completa cuando la llamada real fallaba: un error cuesta reintentar; un
     * documento inventado, indistinguible de uno real, cuesta el caso.
     */
    throw new Error(
      `El motor de redacción no devolvió el escrito de "${req.documentType}". No se entrega ningún documento: ` +
        'un borrador fabricado por la aplicación no sería de la actuación que usted pidió. Vuelva a intentarlo.'
    );
  }
}

export { OpenRouterService as OpenRouterMultiEngineService };
