import { Request, Response } from 'express';
import {
  InvalidAudioError,
  TranscriptionService,
  TranscriptionUnavailableError
} from './transcription.service';
import { proposeRoles } from './roleProposer';
import { detectVoiceConflicts, proposeSpeakerNames } from './voiceConflicts';
import { BackblazeB2TenantStorageService } from '../documents/b2.service';
import { transcriptionStore } from './transcriptionStore.service';
import { auditService } from '../audit/audit.service';
import {
  BillingError,
  PRICE_COP,
  recordUsage,
  refundReservation,
  reserveForOperation,
  settleOperation
} from '../billing/billing.service';
import { randomUUID } from 'crypto';
import { generarResumen, type ResumenDeTranscripcion } from './resumen.service';
import type { SpeakerRole, TranscriptionKind } from './types';

export const transcriptionService = new TranscriptionService();

/** Reads the uploaded audio and deletes it once transcribed. */
const b2StorageService = new BackblazeB2TenantStorageService();

const VALID_KINDS: TranscriptionKind[] = ['AUDIENCIA', 'ENTREVISTA'];

/**
 * GET /api/transcription/status — Whether the engine can be used.
 *
 * The UI calls this before showing the upload control, so a firm without
 * credentials sees a clear explanation instead of a failing upload.
 */
export const transcriptionStatusController = (_req: Request, res: Response): void => {
  // The size ceiling travels with the status because it belongs to whichever
  // provider is configured — 25 MB on OpenAI, 200 on Deepgram. The browser used
  // to hardcode 25, so after switching provider it would have refused a
  // two-hour hearing before uploading it, with the server perfectly willing.
  res.json({
    success: true,
    available: transcriptionService.isAvailable(),
    // What fits through the API here, which on Vercel is the platform's 4.5 MB
    // and not the provider's 200. The browser validates against this one.
    maxAudioBytes: transcriptionService.maxAudioBytes,
    // What the provider accepts when the audio reaches it via storage instead
    // of through us. The gap between the two is why that path exists.
    maxAudioBytesViaStorage: transcriptionService.providerMaxAudioBytes,
    supportsRemoteAudio: transcriptionService.supportsRemoteAudio
  });
};

/**
 * POST /api/transcription — Transcribes an uploaded hearing or interview.
 *
 * Expects multipart/form-data with an `audio` file and an optional `kind`,
 * `contextPrompt` and `language`.
 */
export const transcribeAudioController = async (req: Request, res: Response): Promise<void> => {
  const file = req.file;

  if (!file) {
    res.status(400).json({
      error: 'MISSING_AUDIO',
      message: 'Se requiere un archivo de audio en el campo "audio".'
    });
    return;
  }

  const kind = (req.body.kind as TranscriptionKind) || 'AUDIENCIA';

  if (!VALID_KINDS.includes(kind)) {
    res.status(400).json({
      error: 'INVALID_KIND',
      message: `El campo "kind" debe ser uno de: ${VALID_KINDS.join(', ')}.`
    });
    return;
  }

  try {
    const result = await transcriptionService.transcribe({
      kind,
      audio: file.buffer,
      fileName: file.originalname,
      mimeType: file.mimetype,
      contextPrompt: req.body.contextPrompt,
      language: req.body.language
    });

    console.log(
      `[TRANSCRIPTION] ${kind} "${file.originalname}" para firma ${req.firmId}: ` +
        `${result.segments.length} intervenciones, ${result.speakerLabels.length} interlocutores.`
    );

    /*
     * Saved HERE, before responding, and that ordering is the whole point.
     *
     * The transcript used to exist only in the browser, so closing the tab lost
     * a two-hour hearing and recovering it meant uploading the audio again and
     * paying for the transcription twice. Writing at this line means the work
     * survives even if the browser is gone by the time we answer.
     *
     * A failed save does not fail the request: the lawyer already paid for this
     * transcription and losing it over a database hiccup would be the worse
     * outcome. It is reported instead, so the UI can warn that this one has to
     * be copied out now.
     */
    /*
     * La hora de la autorizacion viene del CLIENTE porque el clic ocurrio alli,
     * antes de subir. Se registra tal cual: es la constancia que la Ley 1581
     * exige poder mostrar, y una casilla sin hora no es demostrable.
     */
    const autorizoEl =
      typeof req.body.autorizoGrabacionEl === 'string' ? req.body.autorizoGrabacionEl : null;

    const stored = await transcriptionStore.save(
      req.firmId as string,
      req.user?.email ?? 'desconocido',
      (req.body.title as string) || file.originalname,
      file.originalname,
      result,
      autorizoEl
    );

    if (stored) {
      await auditService.record({
        firmId: req.firmId as string,
        userEmail: req.user?.email ?? 'desconocido',
        action: 'TRANSCRIPTION_CREATED',
        resource: `Transcribió ${kind === 'ENTREVISTA' ? 'entrevista' : 'audiencia'} · ${stored.title}`
      });
    }

    /*
     * Proposals, not assignments. The roles are NOT written into the stored
     * segments: diarization knows two voices differ, never that one is the
     * judge, and these come from procedural formulas in the text — which a
     * quotation or counsel reading an order aloud will also trip. Each carries
     * the phrase and second that produced it so the lawyer confirms from
     * evidence rather than from our confidence.
     */

    res.json({
      success: true,
      result,
      id: stored?.id ?? null,
      persisted: Boolean(stored),
      roleProposals: proposeRoles(result.segments),
      // Recomputed fresh on every response: a warning must withdraw itself the
      // moment the lawyer fixes what it pointed at.
      voiceConflicts: detectVoiceConflicts(result.segments),
      nameProposals: proposeSpeakerNames(result.segments)
    });
  } catch (err) {
    if (err instanceof InvalidAudioError) {
      res.status(400).json({ error: 'INVALID_AUDIO', message: err.message });
      return;
    }

    if (err instanceof TranscriptionUnavailableError) {
      res.status(503).json({ error: 'TRANSCRIPTION_UNAVAILABLE', message: err.message });
      return;
    }

    const message = err instanceof Error ? err.message : 'Error desconocido.';
    console.error('[TRANSCRIPTION] Falló la transcripción:', message);

    res.status(502).json({
      error: 'TRANSCRIPTION_FAILED',
      message: 'El motor de transcripción no pudo procesar el audio. Intenta de nuevo.'
    });
  }
};

/**
 * GET /api/transcription — Transcripts already saved for this firm and user.
 *
 * Exists so a closed tab costs nothing: the work is recovered from here instead
 * of by uploading the recording again.
 */
/**
 * El resumen y los hechos relevantes, generados por el motor.
 *
 * SE GENERA UNA VEZ Y SE GUARDA. Reabrirla manana no vuelve a llamar al modelo:
 * devuelve lo guardado, salvo que se pida regenerar (?regenerar=1) — que es lo
 * correcto despues de corregir intervenciones, porque el resumen viejo resume
 * un texto que ya no existe.
 *
 * SE DESCUENTA DEL SALDO. Decision del usuario, 29/08/2026. La historia
 * importa porque explica la forma del codigo: este resumen decia «no se cobra
 * aparte, la transcripcion ya se pago ($3.000)», y eso era falso — ese precio
 * estaba declarado y ningun controlador lo cobraba. Transcribir es hoy gratis
 * por decision; el resumen, que es la UNICA llamada a modelo del modulo
 * (transcribir es Deepgram, no OpenRouter), se cobra como cualquier otra
 * operacion: se reserva el piso ANTES de llamar al modelo, se registra lo que
 * consumio, y se liquida o se devuelve segun haya producido algo.
 *
 * LO GUARDADO NO SE COBRA. Reabrir manana devuelve el resumen almacenado sin
 * tocar el modelo ni el saldo; solo `?regenerar=1` vuelve a pagar, y lo pide un
 * boton que lo dice. `?soloCache=1` nunca cobra: es el modo de la exportacion.
 *
 * CADA GENERACION ES SU PROPIA OPERACION. `settleOperation` suma `ai_usage` por
 * `operation_id`; si el id fuera el de la transcripcion, regenerar sumaria el
 * costo de todas las veces anteriores y las cobraria de nuevo. Un uuid por
 * llamada mantiene cada cobro pegado a su consumo.
 */
export const transcriptionResumenController = async (req: Request, res: Response): Promise<void> => {
  const firmId = req.firmId as string;
  const id = String(req.params.id);

  const transcripcion = await transcriptionStore.get(firmId, id);
  if (!transcripcion) {
    res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'No se encontro esa transcripcion.' });
    return;
  }

  const regenerar = req.query.regenerar === '1';
  const guardado = transcripcion.resumen as ResumenDeTranscripcion | null | undefined;

  if (guardado && !regenerar) {
    res.json({ success: true, resumen: guardado, desdeCache: true });
    return;
  }

  /*
   * SOLO CACHE: responde lo guardado o nada, sin tocar el modelo. Es el modo
   * de la exportacion — un clic en "PDF" no puede colgarse veinte segundos
   * esperando a Gemini, ni disparar una llamada paga que nadie pidio. El acta
   * sale sin hechos clave si nunca se generaron, y eso es lo honesto.
   */
  if (req.query.soloCache === '1') {
    res.json({ success: true, resumen: null, desdeCache: true });
    return;
  }

  const userEmail = req.user?.email ?? 'desconocido';
  const operationId = randomUUID();

  let reservado = 0;
  try {
    ({ reserved: reservado } = await reserveForOperation({ firmId, userEmail, operation: 'RESUMEN' }));
  } catch (error) {
    if (error instanceof BillingError) {
      // 402 y no 500: es una puerta con precio, no una puerta rota.
      res.status(402).json({
        success: false,
        error: 'SALDO_INSUFICIENTE',
        message:
          `El resumen cuesta $${PRICE_COP.RESUMEN.toLocaleString('es-CO')} COP y la firma no tiene saldo. ` +
          'Recargue para generarlo; la transcripcion sigue disponible completa.'
      });
      return;
    }
    throw error;
  }

  const { resumen, usage } = await generarResumen(transcripcion.segments ?? [], transcripcion.kind);

  /*
   * Se registra ANTES de mirar si el resumen sirve: una llamada que respondio
   * ilegible se pago igual. Contar solo los aciertos subestimaria el costo justo
   * en los dias en que el motor anda mal, que es cuando mas importa verlo.
   */
  await recordUsage({ firmId, userEmail, operation: 'RESUMEN', operationId, usage });

  if (!resumen) {
    // Nadie paga por un resumen que no recibio. El consumo queda registrado
    // igual: eso lo pago la plataforma, y debe verlo.
    await refundReservation({
      firmId,
      userEmail,
      operation: 'RESUMEN',
      reason: 'el motor no produjo resumen'
    });

    // El motor no respondio o respondio ilegible. Se dice tal cual: un resumen
    // inventado por el servidor seria peor que ninguno.
    res.status(502).json({
      success: false,
      error: 'SIN_RESUMEN',
      message: 'El motor no pudo generar el resumen en este momento. Intente de nuevo. No se le cobro.'
    });
    return;
  }

  await transcriptionStore.saveResumen(firmId, id, resumen);

  /*
   * Al libro ANTES de responder: serverless se congela al responder y un cobro
   * «para despues» no ocurre. Es la misma regla que el guardado del transcrito.
   */
  await settleOperation({
    firmId,
    userEmail,
    operation: 'RESUMEN',
    operationId,
    reserved: reservado,
    description: `Resumen de ${transcripcion.kind === 'ENTREVISTA' ? 'entrevista' : 'audiencia'} · ${transcripcion.title}`
  });

  res.json({ success: true, resumen, desdeCache: false });
};

/** PATCH /transcription/:id/segmento-revisado — la marca fina de lectura humana. */
export const marcarSegmentoRevisadoController = async (req: Request, res: Response): Promise<void> => {
  const segmentIndex = Number(req.body?.segmentIndex);
  const revisada = req.body?.revisada;

  if (!Number.isInteger(segmentIndex) || segmentIndex < 0 || typeof revisada !== 'boolean') {
    res.status(400).json({ success: false, error: 'BAD_REQUEST', message: 'Se requieren segmentIndex (entero) y revisada (booleano).' });
    return;
  }

  const item = await transcriptionStore.marcarSegmentoRevisado(
    req.firmId as string,
    String(req.params.id),
    segmentIndex,
    revisada
  );

  if (!item) {
    res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'No se encontró esa intervención.' });
    return;
  }
  res.json({ success: true, item });
};

/** PATCH /transcription/:id/revision — el acto humano que da o quita "Acta lista". */
export const marcarRevisionController = async (req: Request, res: Response): Promise<void> => {
  const estado = req.body?.estado as string;

  if (estado !== 'POR_REVISAR' && estado !== 'ACTA_LISTA') {
    res.status(400).json({ success: false, error: 'ESTADO_INVALIDO', message: 'El estado debe ser POR_REVISAR o ACTA_LISTA.' });
    return;
  }

  const item = await transcriptionStore.marcarRevision(
    req.firmId as string,
    String(req.params.id),
    estado,
    req.user?.email ?? 'desconocido'
  );

  if (!item) {
    res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'No se encontró esa transcripción.' });
    return;
  }

  // El acto que convierte la transcripcion en acta merece rastro con nombre.
  await auditService.record({
    firmId: req.firmId as string,
    userEmail: req.user?.email ?? 'desconocido',
    action: 'ACTA_LISTA',
    resource: `${estado === 'ACTA_LISTA' ? 'Marcó acta lista' : 'Devolvió a revisión'} · ${item.title}`
  });

  res.json({ success: true, item });
};

/** PATCH /transcription/:id/decision — cierra una entrevista: tomar, declinar con motivo, o reabrir. */
export const decidirEntrevistaController = async (req: Request, res: Response): Promise<void> => {
  const decision = req.body?.decision as string;
  const motivo = typeof req.body?.motivo === 'string' ? req.body.motivo.trim() || null : null;

  if (decision !== 'SIN_DECIDIR' && decision !== 'TOMADO' && decision !== 'DECLINADO') {
    res.status(400).json({ success: false, error: 'DECISION_INVALIDA', message: 'La decisión debe ser SIN_DECIDIR, TOMADO o DECLINADO.' });
    return;
  }

  try {
    const item = await transcriptionStore.decidir(
      req.firmId as string,
      String(req.params.id),
      decision,
      motivo,
      req.user?.email ?? 'desconocido'
    );

    if (!item) {
      res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'No se encontró esa entrevista.' });
      return;
    }

    await auditService.record({
      firmId: req.firmId as string,
      userEmail: req.user?.email ?? 'desconocido',
      action: 'INTERVIEW_DECIDED',
      resource:
        decision === 'TOMADO'
          ? `Tomó el caso · ${item.title}`
          : decision === 'DECLINADO'
          ? `Declinó el caso (${motivo}) · ${item.title}`
          : `Reabrió la decisión · ${item.title}`
    });

    res.json({ success: true, item });
  } catch (err) {
    // El unico throw del servicio: declinar sin motivo. Mensaje en espanol tal cual.
    res.status(400).json({ success: false, error: 'MOTIVO_REQUERIDO', message: err instanceof Error ? err.message : 'Declinar exige un motivo.' });
  }
};

export const listTranscriptionsController = async (req: Request, res: Response): Promise<void> => {
  /*
   * The author comes from the token, like the firm.
   *
   * It used to be a query parameter defaulting to 'desconocido', so a lawyer
   * could list a colleague's transcripts by naming their address — a smaller
   * version of the same defect as the tenant header, and pointless now that the
   * session carries a verified e-mail.
   */
  // An unknown kind lists nothing rather than everything: a typo in the query
  // must not turn a filtered screen into an unfiltered one.
  const kind = VALID_KINDS.includes(req.query.kind as TranscriptionKind)
    ? (req.query.kind as TranscriptionKind)
    : undefined;

  // De la firma entera: quien subio cada una viaja en la fila, no como filtro.
  const items = await transcriptionStore.list(req.firmId as string, kind);

  /*
   * Each transcript carries its own proposals and warnings.
   *
   * They used to travel only on the response that CREATED a transcript, so
   * reopening a saved one showed neither: the app had read the names out of the
   * hearing and then forgotten them the moment the tab was closed. Both are
   * pure functions of the segments the list already holds, so recomputing here
   * costs one pass over text that is in memory anyway — and recomputing is the
   * correct behaviour regardless, since editing a name changes what the text
   * says about itself.
   */
  res.json({
    success: true,
    items: items.map((item) => ({
      ...item,
      voiceConflicts: detectVoiceConflicts(item.segments),
      nameProposals: proposeSpeakerNames(item.segments)
    }))
  });
};

/**
 * PATCH /api/transcription/:id/roles — Maps anonymous voices to procedural roles.
 *
 * The half diarization cannot do. `speaker_0` is a cluster, not a person; only
 * someone who was in the room knows which one is the judge. Persisting the
 * mapping keeps that work from being redone on every visit.
 */
export const assignTranscriptionRolesController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const roles = req.body.roles as Record<string, SpeakerRole> | undefined;

  if (!roles || typeof roles !== 'object') {
    res.status(400).json({
      error: 'MISSING_ROLES',
      message: 'Se requiere un objeto "roles" que asocie cada interlocutor con su rol procesal.'
    });
    return;
  }

  const updated = await transcriptionStore.assignRoles(req.firmId as string, String(req.params.id), roles);

  if (!updated) {
    res.status(404).json({ error: 'NOT_FOUND', message: 'No se encontró el transcrito.' });
    return;
  }

  res.json({
    success: true,
    item: updated,
    voiceConflicts: detectVoiceConflicts(updated.segments),
    nameProposals: proposeSpeakerNames(updated.segments)
  });
};

/**
 * DELETE /api/transcription/:id — The firm disposes of its own privileged material.
 */
export const deleteTranscriptionController = async (req: Request, res: Response): Promise<void> => {
  /*
   * Se lee ANTES de borrar: despues ya no hay titulo que registrar. Pero SOLO
   * el titulo — esto llamaba a `get()`, que es `select('*')`, y descargaba la
   * audiencia entera (texto, intervenciones y resumen) desde Postgres hasta
   * esta funcion para quedarse con una cadena. Borrar tardaba en proporcion a
   * lo que duraba la audiencia, que es exactamente al reves de lo que se
   * espera.
   */
  const titulo = await transcriptionStore.titleOf(req.firmId as string, String(req.params.id));
  const removed = await transcriptionStore.remove(req.firmId as string, String(req.params.id));

  if (removed) {
    await auditService.record({
      firmId: req.firmId as string,
      userEmail: req.user?.email ?? 'desconocido',
      action: 'TRANSCRIPTION_DELETED',
      resource: `Eliminó transcripción · ${titulo ?? String(req.params.id)}`
    });
  }

  if (!removed) {
    res.status(404).json({ error: 'NOT_FOUND', message: 'No se encontró el transcrito.' });
    return;
  }

  res.json({ success: true });
};

/**
 * POST /api/transcription/from-storage — Transcribes audio already in B2.
 *
 * THE PATH A REAL HEARING TAKES. Vercel functions reject request bodies over
 * 4.5 MB and a two-hour recording is around 50, so the audio cannot travel
 * through the API at all. The browser uploads it straight to B2 with a signed
 * URL, sends only the resulting key here, and Deepgram fetches it from a
 * temporary link. Nothing large crosses this function.
 *
 * The recording is DELETED once transcribed. That matters: the upload path
 * keeps audio in memory precisely so privileged material never persists, and
 * routing it through storage would quietly undo that if the object stayed. The
 * detour is acceptable only because it ends.
 */
export const transcribeFromStorageController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const fileKey = String(req.body.fileKey ?? '').trim();
  const kind = (req.body.kind as TranscriptionKind) || 'AUDIENCIA';

  if (!fileKey) {
    res.status(400).json({
      error: 'MISSING_FILE_KEY',
      message: 'Se requiere "fileKey": la ruta del audio ya subido a almacenamiento.'
    });
    return;
  }

  if (!VALID_KINDS.includes(kind)) {
    res.status(400).json({
      error: 'INVALID_KIND',
      message: `El campo "kind" debe ser uno de: ${VALID_KINDS.join(', ')}.`
    });
    return;
  }

  const firmId = req.firmId as string;

  // The firm prefix is checked before anything else. Without it, a caller could
  // name another firm's object and have us transcribe — and store — a hearing
  // that is not theirs.
  if (!fileKey.startsWith(`${firmId}/`)) {
    res.status(403).json({
      error: 'FORBIDDEN',
      message: 'Ese archivo no pertenece a la firma autenticada.'
    });
    return;
  }

  /*
   * The recording is deleted BEFORE responding, in both outcomes.
   *
   * Two placements failed before this one. Deleting after the transcription
   * inside the `try` left the audio behind whenever transcription threw — a
   * first test proved it, Deepgram answering 404 and the file staying in B2
   * forever. Moving it to `finally` fixed that locally and still failed in
   * production, which is the interesting part: a serverless function is frozen
   * once its response is sent, so work scheduled after `res.json()` may simply
   * never run. The local server kept going and did the delete; Vercel did not.
   *
   * So it happens inside the request, before the reply. Deleted whether or not
   * the transcript succeeded: the recording is a transient artefact of an
   * upload limit, a failed transcription costs a re-upload, and privileged
   * audio nobody can account for costs more.
   */
  const discardAudio = async (): Promise<boolean> => {
    const removed = await b2StorageService.deleteObject(firmId, fileKey).catch(() => false);

    if (!removed) {
      // Worded for both cases: the delete returns false for "failed" and for
      // "was not there" alike, and b2.service already logged which. Claiming
      // privileged audio is sitting in storage when the object never existed is
      // a false alarm, and false alarms are how real ones get ignored.
      console.warn(`[TRANSCRIPTION] El audio ${fileKey} no se borró (falló o no existía).`);
    }

    return removed;
  };

  try {
    const audioUrl = await b2StorageService.generateDownloadPresignedUrl(firmId, fileKey);

    const result = await transcriptionService.transcribeFromUrl(audioUrl, {
      kind,
      contextPrompt: req.body.contextPrompt,
      language: req.body.language
    });

    const stored = await transcriptionStore.save(
      firmId,
      req.user?.email ?? 'desconocido',
      (req.body.title as string) || fileKey.split('/').pop() || 'Transcripción',
      fileKey,
      result,
      typeof req.body.autorizoGrabacionEl === 'string' ? req.body.autorizoGrabacionEl : null
    );

    const audioDeleted = await discardAudio();

    res.json({
      success: true,
      result,
      id: stored?.id ?? null,
      persisted: Boolean(stored),
      audioDeleted,
      roleProposals: proposeRoles(result.segments),
      // Recomputed fresh on every response: a warning must withdraw itself the
      // moment the lawyer fixes what it pointed at.
      voiceConflicts: detectVoiceConflicts(result.segments),
      nameProposals: proposeSpeakerNames(result.segments)
    });
  } catch (err) {
    // Discarded here too, and awaited before the error reply for the same
    // reason: after the response there may be no process left to do it.
    await discardAudio();

    if (err instanceof TranscriptionUnavailableError) {
      res.status(503).json({ error: 'TRANSCRIPTION_UNAVAILABLE', message: err.message });
      return;
    }

    console.error('[TRANSCRIPTION] Error transcribiendo desde almacenamiento:', err);
    res.status(502).json({
      error: 'TRANSCRIPTION_FAILED',
      message: err instanceof Error ? err.message : 'No se pudo transcribir el audio.'
    });
  }
};

/**
 * PATCH /api/transcription/:id/segment — Corrects the text of one intervention.
 *
 * A transcript is a draft until a lawyer reads it: the model wrote "desembarco"
 * for DESEMBARGO and "con recámaras" for CONFECÁMARAS, both fluent and both
 * wrong in a way only someone who knows the field catches. Key terms make that
 * rarer, never impossible.
 *
 * Only the text changes. Speaker, role and timestamps are not editable here —
 * this corrects what was said, never who said it or when.
 */
export const editTranscriptionSegmentController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const index = Number(req.body.segmentIndex);
  const text = typeof req.body.text === 'string' ? req.body.text : null;

  if (!Number.isInteger(index) || index < 0 || text === null) {
    res.status(400).json({
      error: 'INVALID_EDIT',
      message: 'Se requieren "segmentIndex" (entero) y "text".'
    });
    return;
  }

  const updated = await transcriptionStore.editSegment(
    req.firmId as string,
    String(req.params.id),
    index,
    text
  );

  if (!updated) {
    res.status(404).json({ error: 'NOT_FOUND', message: 'No se encontró la intervención.' });
    return;
  }

  res.json({
    success: true,
    item: updated,
    voiceConflicts: detectVoiceConflicts(updated.segments),
    nameProposals: proposeSpeakerNames(updated.segments)
  });
};

/**
 * PATCH /api/transcription/:id/speaker-name — Names a voice.
 *
 * The name can come from the proposal the transcript itself produced, or from a
 * lawyer who was in the room and simply knows. Either way a human sets it: a
 * name the app assigned on its own would be a fabricated attribution in a
 * document meant to be quoted.
 */
export const assignSpeakerNameController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const speakerLabel = String(req.body.speakerLabel ?? '').trim();
  const name = typeof req.body.name === 'string' ? req.body.name : '';

  if (!speakerLabel) {
    res.status(400).json({
      error: 'MISSING_SPEAKER',
      message: 'Se requiere "speakerLabel".'
    });
    return;
  }

  const updated = await transcriptionStore.assignSpeakerName(
    req.firmId as string,
    String(req.params.id),
    speakerLabel,
    name
  );

  if (!updated) {
    res.status(404).json({ error: 'NOT_FOUND', message: 'No se encontró el transcrito.' });
    return;
  }

  res.json({
    success: true,
    item: updated,
    voiceConflicts: detectVoiceConflicts(updated.segments),
    nameProposals: proposeSpeakerNames(updated.segments)
  });
};

/**
 * PATCH /api/transcription/:id/speaker — Moves one intervention to another voice.
 *
 * The companion of /split, for the other way diarization fails: two people under
 * one label across SEPARATE interventions. Cutting cannot express that, because
 * a cut that leaves an empty half is refused, and assigning roles cannot either,
 * because a role attaches to the label and would name both people at once.
 */
export const reassignTranscriptionSpeakerController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const index = Number(req.body.segmentIndex);
  const speakerLabel = String(req.body.speakerLabel ?? '').trim();

  if (!Number.isInteger(index) || index < 0) {
    res.status(400).json({
      error: 'INVALID_REASSIGN',
      message: 'Se requiere "segmentIndex" como entero válido.'
    });
    return;
  }

  if (!speakerLabel) {
    res.status(400).json({
      error: 'MISSING_SPEAKER',
      message: 'Se requiere "speakerLabel" para la intervención.'
    });
    return;
  }

  const updated = await transcriptionStore.reassignSpeaker(
    req.firmId as string,
    String(req.params.id),
    index,
    speakerLabel
  );

  if (!updated) {
    res.status(404).json({ error: 'NOT_FOUND', message: 'No se encontró la intervención.' });
    return;
  }

  res.json({
    success: true,
    item: updated,
    voiceConflicts: detectVoiceConflicts(updated.segments),
    nameProposals: proposeSpeakerNames(updated.segments)
  });
};

/**
 * PATCH /api/transcription/:id/split — Cuts one intervention in two.
 *
 * Exists because diarization cannot separate people who talk over each other,
 * and a hearing is full of that. When two real voices share one label, no role
 * assignment can fix it — the block has to be cut first.
 */
export const splitTranscriptionSegmentController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const index = Number(req.body.segmentIndex);
  const offset = Number(req.body.charOffset);
  const speakerLabel = String(req.body.speakerLabel ?? '').trim();

  if (!Number.isInteger(index) || index < 0 || !Number.isInteger(offset) || offset <= 0) {
    res.status(400).json({
      error: 'INVALID_SPLIT',
      message: 'Se requieren "segmentIndex" y "charOffset" como enteros válidos.'
    });
    return;
  }

  if (!speakerLabel) {
    res.status(400).json({
      error: 'MISSING_SPEAKER',
      message: 'Se requiere "speakerLabel" para la segunda mitad.'
    });
    return;
  }

  const updated = await transcriptionStore.splitSegment(
    req.firmId as string,
    String(req.params.id),
    index,
    offset,
    speakerLabel
  );

  if (!updated) {
    res.status(400).json({
      error: 'SPLIT_FAILED',
      message: 'No se pudo dividir la intervención. Revisa que el punto de corte deje texto a ambos lados.'
    });
    return;
  }

  res.json({
    success: true,
    item: updated,
    voiceConflicts: detectVoiceConflicts(updated.segments),
    nameProposals: proposeSpeakerNames(updated.segments)
  });
};

/**
 * PATCH /transcription/:id/hecho-clave — la marca del abogado, no la del modelo.
 *
 * Misma forma que la de revisión a propósito: son dos marcas del mismo grano
 * sobre la misma intervención, y darles cuerpos distintos solo obligaría a
 * recordar cuál es cuál.
 */
export const marcarHechoClaveController = async (req: Request, res: Response): Promise<void> => {
  const segmentIndex = Number(req.body?.segmentIndex);
  const hechoClave = req.body?.hechoClave;

  if (!Number.isInteger(segmentIndex) || segmentIndex < 0 || typeof hechoClave !== 'boolean') {
    res.status(400).json({
      success: false,
      error: 'BAD_REQUEST',
      message: 'Se requieren segmentIndex (entero) y hechoClave (booleano).'
    });
    return;
  }

  const item = await transcriptionStore.marcarHechoClave(
    req.firmId as string,
    String(req.params.id),
    segmentIndex,
    hechoClave
  );

  if (!item) {
    res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'No se encontró esa intervención.' });
    return;
  }
  res.json({ success: true, item });
};
