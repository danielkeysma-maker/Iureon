import { Request, Response } from 'express';
import {
  InvalidAudioError,
  TranscriptionService,
  TranscriptionUnavailableError
} from './transcription.service';
import type { TranscriptionKind } from './types';

const transcriptionService = new TranscriptionService();

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

    res.json({ success: true, result });
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
