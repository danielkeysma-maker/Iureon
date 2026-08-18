import { useCallback, useEffect, useState } from 'react';
import { useTenant } from '../../tenant/TenantContext';
import { transcriptionApi } from '../services/transcription.api';
import {
  FALLBACK_MAX_AUDIO_BYTES,
  SUPPORTED_AUDIO_EXTENSIONS,
  type RoleProposal,
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
const validate = (file: File, limit: number): string | null => {
  const extension = (file.name.split('.').pop() ?? '').toLowerCase();

  if (!SUPPORTED_AUDIO_EXTENSIONS.includes(extension)) {
    return `Formato "${extension || 'desconocido'}" no soportado. Usa: ${SUPPORTED_AUDIO_EXTENSIONS.join(', ')}.`;
  }

  if (file.size === 0) {
    return 'El archivo de audio está vacío.';
  }

  if (file.size > limit) {
    return `El audio pesa ${megabytes(file.size)} MB y el límite es ${megabytes(limit)} MB. Divide la grabación en partes y súbelas por separado.`;
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
  const [roleProposals, setRoleProposals] = useState<RoleProposal[]>([]);
  /**
   * False after a transcription that could not be stored. The lawyer is about
   * to close a tab holding the only copy, so the screen has to say so.
   */
  const [persisted, setPersisted] = useState(true);
  /**
   * Comes from the server, because the ceiling is the provider's: 25 MB on
   * OpenAI, 200 on Deepgram. Hardcoding it here refused two-hour hearings the
   * backend was willing to accept.
   */
  const [maxAudioBytes, setMaxAudioBytes] = useState<number>(FALLBACK_MAX_AUDIO_BYTES);

  useEffect(() => {
    let cancelled = false;

    transcriptionApi.status().then((status) => {
      if (cancelled) return;
      setIsAvailable(status.available);
      if (status.maxAudioBytes) setMaxAudioBytes(status.maxAudioBytes);
    });

    return () => {
      cancelled = true;
    };
  }, [firmId]);

  const transcribe = useCallback(
    async (file: File, contextPrompt?: string) => {
      const validationError = validate(file, maxAudioBytes);

      if (validationError) {
        setError(validationError);
        return;
      }

      setError(null);
      setIsTranscribing(true);

      try {
        const outcome = await transcriptionApi.transcribe(firmId, { file, kind, contextPrompt });
        setResult(outcome.result);
        setRoleProposals(outcome.roleProposals);
        setPersisted(outcome.persisted);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo transcribir el audio.');
      } finally {
        setIsTranscribing(false);
      }
    },
    [firmId, kind, maxAudioBytes]
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
    setRoleProposals([]);
    setPersisted(true);
  }, []);

  return {
    /** False while no firm is registered: the transcript could not be saved. */
    hasFirm: Boolean(firmId),
    isAvailable,
    isTranscribing,
    result,
    error,
    roleProposals,
    persisted,
    maxAudioBytes,
    transcribe,
    assignRole,
    reset
  };
};
