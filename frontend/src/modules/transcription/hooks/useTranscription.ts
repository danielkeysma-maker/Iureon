import { useCallback, useEffect, useState } from 'react';
import { useTenant } from '../../tenant/TenantContext';
import { transcriptionApi } from '../services/transcription.api';
import {
  MAX_AUDIO_BYTES,
  SUPPORTED_AUDIO_EXTENSIONS,
  type SpeakerRole,
  type TranscriptionKind,
  type TranscriptionResult
} from '../types';

const megabytes = (bytes: number): string => (bytes / (1024 * 1024)).toFixed(1);

/**
 * Same rules the backend enforces, applied before upload.
 *
 * Duplicated deliberately: a 25 MB hearing recording takes a long time to
 * upload only to be rejected, so the user is told immediately. The server
 * remains the authority — this is a courtesy, not the guard.
 */
const validate = (file: File): string | null => {
  const extension = (file.name.split('.').pop() ?? '').toLowerCase();

  if (!SUPPORTED_AUDIO_EXTENSIONS.includes(extension)) {
    return `Formato "${extension || 'desconocido'}" no soportado. Usa: ${SUPPORTED_AUDIO_EXTENSIONS.join(', ')}.`;
  }

  if (file.size === 0) {
    return 'El archivo de audio está vacío.';
  }

  if (file.size > MAX_AUDIO_BYTES) {
    return `El audio pesa ${megabytes(file.size)} MB y el límite es ${megabytes(MAX_AUDIO_BYTES)} MB. Divide la grabación en partes y súbelas por separado.`;
  }

  return null;
};

/**
 * Drives one transcription: availability, upload, and the speaker-to-role
 * mapping the lawyer applies afterwards.
 *
 * Roles are assigned locally rather than guessed. The engine can tell that two
 * different people spoke; only someone who was in the room knows which one was
 * the judge.
 */
export const useTranscription = (kind: TranscriptionKind) => {
  const { firmId } = useTenant();

  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [result, setResult] = useState<TranscriptionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    transcriptionApi.isAvailable(firmId).then((available) => {
      if (!cancelled) setIsAvailable(available);
    });

    return () => {
      cancelled = true;
    };
  }, [firmId]);

  const transcribe = useCallback(
    async (file: File, contextPrompt?: string) => {
      const validationError = validate(file);

      if (validationError) {
        setError(validationError);
        return;
      }

      setError(null);
      setIsTranscribing(true);

      try {
        setResult(await transcriptionApi.transcribe(firmId, { file, kind, contextPrompt }));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo transcribir el audio.');
      } finally {
        setIsTranscribing(false);
      }
    },
    [firmId, kind]
  );

  /** Applies a procedural role to every segment of one diarized speaker. */
  const assignRole = useCallback((speakerLabel: string, role: SpeakerRole) => {
    setResult((current) =>
      current
        ? {
            ...current,
            segments: current.segments.map((segment) =>
              segment.speakerLabel === speakerLabel ? { ...segment, role } : segment
            )
          }
        : current
    );
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { isAvailable, isTranscribing, result, error, transcribe, assignRole, reset };
};
