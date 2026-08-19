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
  /** Id of the stored transcript. Null when it could not be saved. */
  const [transcriptionId, setTranscriptionId] = useState<string | null>(null);
  /**
   * Whether the recording can go straight to storage instead of through the
   * API. It is what makes a two-hour hearing possible: the deployment rejects
   * request bodies over 4.5 MB, and 50 MB of audio has no other way in.
   */
  const [viaStorage, setViaStorage] = useState(false);
  /** Shown while the recording travels to storage, which is the slow part. */
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    transcriptionApi.status().then((status) => {
      if (cancelled) return;
      setIsAvailable(status.available);
      setViaStorage(status.supportsRemoteAudio);
      // The storage path is not bound by the API's ceiling, so the limit shown
      // and enforced is the provider's whenever that path is available.
      const limit = status.supportsRemoteAudio
        ? status.maxAudioBytesViaStorage ?? status.maxAudioBytes
        : status.maxAudioBytes;
      if (limit) setMaxAudioBytes(limit);
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
        /*
         * Two routes, and the choice is not an optimisation. Through the API the
         * recording dies at 4.5 MB on this deployment; through storage it never
         * touches the function at all. The direct route stays for providers that
         * cannot fetch remote audio.
         */
        let outcome;

        if (viaStorage) {
          setIsUploading(true);
          try {
            const fileKey = await transcriptionApi.uploadAudioToStorage(firmId, file);
            outcome = await transcriptionApi.transcribeFromStorage(firmId, fileKey, { kind, contextPrompt });
          } finally {
            setIsUploading(false);
          }
        } else {
          outcome = await transcriptionApi.transcribe(firmId, { file, kind, contextPrompt });
        }

        setResult(outcome.result);
        setRoleProposals(outcome.roleProposals);
        setPersisted(outcome.persisted);
        setTranscriptionId(outcome.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo transcribir el audio.');
      } finally {
        setIsTranscribing(false);
      }
    },
    [firmId, kind, maxAudioBytes, viaStorage]
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

  /**
   * Corrects one intervention, on screen and in the database.
   *
   * Applied locally first so the reader is not left waiting on a round trip for
   * a word they just typed, and persisted because the alternative is retyping
   * "desembargo" every time the transcript is opened.
   */
  const editSegment = useCallback(
    async (segmentIndex: number, text: string) => {
      setResult((current) =>
        current
          ? {
              ...current,
              segments: current.segments.map((segment, i) =>
                i === segmentIndex ? { ...segment, text } : segment
              )
            }
          : current
      );

      if (!transcriptionId) return;

      try {
        await transcriptionApi.editSegment(firmId, transcriptionId, segmentIndex, text);
      } catch (err) {
        // Surfaced, not swallowed: a correction the lawyer believes was saved
        // and was not is worse than one they know to redo.
        setError(err instanceof Error ? err.message : 'La corrección no se pudo guardar.');
      }
    },
    [firmId, transcriptionId]
  );

  /**
   * Cuts an intervention in two because two people are inside it.
   *
   * Diarization cannot separate speech that overlaps, and a hearing is full of
   * it — the judge greets counsel and counsel answers mid-sentence, so both land
   * in one block under one voice. No role assignment fixes that, because roles
   * attach to the diarization label: the block has to be cut first.
   *
   * The new voice gets a label that does not collide with the existing ones. It
   * starts as DESCONOCIDO on purpose — it was cut off precisely because nobody
   * knows yet whose it is.
   */
  const splitSegment = useCallback(
    async (segmentIndex: number, charOffset: number, speakerLabel: string) => {
      if (!transcriptionId || !result) return;

      // "__nueva__" is the UI's way of saying "nobody here": mint a label that
      // does not collide. Anything else is a voice already in the transcript,
      // and the server gives the cut half that voice's role — which is what
      // keeps an interrupted judge from coming back as a second judge.
      const destino =
        speakerLabel === '__nueva__' ? `speaker_${result.speakerLabels.length}` : speakerLabel;

      try {
        const { item } = await transcriptionApi.splitSegment(
          firmId,
          transcriptionId,
          segmentIndex,
          charOffset,
          destino
        );

        // Taken from the server rather than patched here: a split shifts every
        // index after it, and recomputing that on the client is how two views of
        // one transcript drift apart.
        setResult((current) =>
          current
            ? { ...current, segments: item.segments, speakerLabels: item.speaker_labels }
            : current
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo dividir la intervención.');
      }
    },
    [firmId, transcriptionId, result]
  );

  const reset = useCallback(() => {
    setResult(null);
    setTranscriptionId(null);
    setError(null);
    setRoleProposals([]);
    setPersisted(true);
  }, []);

  return {
    /** False while no firm is registered: the transcript could not be saved. */
    hasFirm: Boolean(firmId),
    isAvailable,
    isUploading,
    isTranscribing,
    result,
    error,
    roleProposals,
    persisted,
    maxAudioBytes,
    transcribe,
    assignRole,
    editSegment,
    splitSegment,
    canEdit: Boolean(transcriptionId),
    reset
  };
};
