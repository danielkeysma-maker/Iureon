import { Request, Response } from 'express';
import {
  InvalidAudioError,
  TranscriptionService,
  TranscriptionUnavailableError
} from './transcription.service';
import { proposeRoles } from './roleProposer';
import { BackblazeB2TenantStorageService } from '../documents/b2.service';
import { transcriptionStore } from './transcriptionStore.service';
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
    const stored = await transcriptionStore.save(
      req.firmId as string,
      (req.body.userEmail as string) || 'desconocido',
      (req.body.title as string) || file.originalname,
      file.originalname,
      result
    );

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
      roleProposals: proposeRoles(result.segments)
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
export const listTranscriptionsController = async (req: Request, res: Response): Promise<void> => {
  const items = await transcriptionStore.list(
    req.firmId as string,
    (req.query.userEmail as string) || 'desconocido'
  );

  res.json({ success: true, items });
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

  res.json({ success: true, item: updated });
};

/**
 * DELETE /api/transcription/:id — The firm disposes of its own privileged material.
 */
export const deleteTranscriptionController = async (req: Request, res: Response): Promise<void> => {
  const removed = await transcriptionStore.remove(req.firmId as string, String(req.params.id));

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
      (req.body.userEmail as string) || 'desconocido',
      (req.body.title as string) || fileKey.split('/').pop() || 'Transcripción',
      fileKey,
      result
    );

    const audioDeleted = await discardAudio();

    res.json({
      success: true,
      result,
      id: stored?.id ?? null,
      persisted: Boolean(stored),
      audioDeleted,
      roleProposals: proposeRoles(result.segments)
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

  res.json({ success: true, item: updated });
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

  res.json({ success: true, item: updated });
};
