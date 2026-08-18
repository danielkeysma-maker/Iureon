import { NextFunction, Request, Response, Router } from 'express';
import multer, { MulterError } from 'multer';
import {
  assignTranscriptionRolesController,
  deleteTranscriptionController,
  listTranscriptionsController,
  transcribeAudioController,
  transcriptionStatusController
} from './transcription.controller';
import { transcriptionService } from './transcription.controller';

/**
 * Audio is held in memory and forwarded straight to the provider: hearing
 * recordings and client interviews carry privileged material, so nothing is
 * written to the server's disk.
 */
const upload = multer({
  storage: multer.memoryStorage(),
  // Read from the configured provider so multer and the service agree. They
  // must: a mismatch means either an upload rejected twice with two different
  // numbers, or one accepted here and refused a layer deeper.
  limits: { fileSize: transcriptionService.maxAudioBytes, files: 1 }
});

const megabytes = (bytes: number): string => (bytes / (1024 * 1024)).toFixed(1);

/**
 * Turns multer's upload failures into the same JSON contract as the rest of
 * the module. Without this, an oversized upload reaches Express's default
 * handler and returns an HTML stack trace exposing server paths.
 */
const handleUploadErrors = (
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err instanceof MulterError) {
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? `El audio supera el límite de ${megabytes(transcriptionService.maxAudioBytes)} MB por archivo. ` +
          'Divide la grabación en partes y súbelas por separado.'
        : 'No se pudo procesar el archivo enviado.';

    res.status(400).json({ error: 'INVALID_AUDIO', message });
    return;
  }

  next(err);
};

/**
 * Whether the server has a transcription engine, mounted BEFORE the tenant
 * middleware.
 *
 * It answers about the SERVER, not about a firm: the same engine and the same
 * size ceiling for everyone, revealing nothing about any tenant. Behind the
 * middleware it returned 401 to a user with no firm registered, the browser's
 * catch turned that into "unavailable", and the screen reported a missing
 * DEEPGRAM_API_KEY — blaming a key that was correctly configured for a problem
 * that was a missing firm. Same shape as the Buscador defect: the feature was
 * fine, the explanation was not.
 */
const publicRouter = Router();

publicRouter.get('/transcription/status', transcriptionStatusController as any);

export const transcriptionPublicRoutes = publicRouter;

const router = Router();
router.get('/transcription', listTranscriptionsController as any);
router.patch('/transcription/:id/roles', assignTranscriptionRolesController as any);
router.delete('/transcription/:id', deleteTranscriptionController as any);
router.post(
  '/transcription',
  upload.single('audio'),
  handleUploadErrors,
  transcribeAudioController as any
);

export const transcriptionRoutes = router;
