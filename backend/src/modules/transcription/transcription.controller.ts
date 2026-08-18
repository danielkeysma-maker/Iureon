import { Request, Response } from 'express';
import {
  InvalidAudioError,
  TranscriptionService,
  TranscriptionUnavailableError
} from './transcription.service';
import { transcriptionStore } from './transcriptionStore.service';
import type { SpeakerRole, TranscriptionKind } from './types';

export const transcriptionService = new TranscriptionService();

const VALID_KINDS: TranscriptionKind[] = ['AUDIENCIA', 'ENTREVISTA'];

/**
 * GET /api/transcription/status — Whether the engine can be used.
 *
 * The UI calls this before showing the upload control, so a firm without
 * credentials sees a clear explanation instead of a failing upload.
 */
export const transcriptionStatusController = (_req: Request, res: Response): void => {
  res.json({ success: true, available: transcriptionService.isAvailable() });
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

    res.json({ success: true, result, id: stored?.id ?? null, persisted: Boolean(stored) });
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
