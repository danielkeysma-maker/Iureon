import { NextFunction, Request, Response, Router } from 'express';
import multer, { MulterError } from 'multer';
import {
  transcribeAudioController,
  transcriptionStatusController
} from './transcription.controller';
import { MAX_AUDIO_BYTES } from './types';

/**
 * Audio is held in memory and forwarded straight to the provider: hearing
 * recordings and client interviews carry privileged material, so nothing is
 * written to the server's disk.
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_AUDIO_BYTES, files: 1 }
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
        ? `El audio supera el límite de ${megabytes(MAX_AUDIO_BYTES)} MB por archivo. ` +
          'Divide la grabación en partes (por ejemplo, por bloques de la audiencia) y súbelas por separado.'
        : 'No se pudo procesar el archivo enviado.';

    res.status(400).json({ error: 'INVALID_AUDIO', message });
    return;
  }

  next(err);
};

const router = Router();

router.get('/transcription/status', transcriptionStatusController as any);
router.post(
  '/transcription',
  upload.single('audio'),
  handleUploadErrors,
  transcribeAudioController as any
);

export const transcriptionRoutes = router;
