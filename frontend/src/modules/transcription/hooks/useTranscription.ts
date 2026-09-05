import { useCallback, useEffect, useState } from 'react';
import { useTenant } from '../../tenant/TenantContext';
import { PANTALLAS, recordar } from '../../tenant/pantallaRecordada';
import { textoDe, transcriptionApi, type StoredTranscription } from '../services/transcription.api';
import {
  FALLBACK_MAX_AUDIO_BYTES,
  SUPPORTED_AUDIO_EXTENSIONS,
  type RoleProposal,
  type SpeakerRole,
  type TranscriptionKind,
  type TranscriptionResult,
  type SpeakerNameProposal,
  type VoiceConflict
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
/**
 * Names a voice that is not in the hearing yet.
 *
 * Counting the voices and calling the new one `speaker_<count>` looked safe and
 * was not: moving a voice's last intervention away retires it, so the count
 * stops matching the highest number in use. With speaker_1 retired, three voices
 * remain — 0, 2, 3 — and a count of three names the new one `speaker_3`, which
 * already belongs to somebody. The intervention would be filed under that
 * person and inherit their procedural role, silently, which is the very defect
 * this pair of tools exists to undo.
 *
 * So the first free number wins, whatever the count says.
 */
const nextSpeakerLabel = (existing: string[]): string => {
  const taken = new Set(existing);

  for (let n = 0; ; n += 1) {
    const label = `speaker_${n}`;
    if (!taken.has(label)) return label;
  }
};

export const useTranscription = (kind: TranscriptionKind) => {
  const { firmId } = useTenant();

  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [result, setResult] = useState<TranscriptionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [roleProposals, setRoleProposals] = useState<RoleProposal[]>([]);
  /**
   * Labels whose own words claim two different people. Replaced wholesale on
   * every server response so a warning withdraws itself the moment the lawyer
   * fixes what it pointed at — a stale warning teaches them to ignore all of
   * them.
   */
  const [voiceConflicts, setVoiceConflicts] = useState<VoiceConflict[]>([]);

  /**
   * The name each voice gave for itself, read out of the transcript.
   *
   * Proposed, never applied: a name the app assigned on its own would be a
   * fabricated attribution in a document that gets quoted in court. The lawyer
   * accepts it, edits it, or types one from having been in the room.
   */
  const [nameProposals, setNameProposals] = useState<SpeakerNameProposal[]>([]);
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
  /**
   * Cuanto de la grabacion va enviado, de 0 a 99.
   *
   * EL TAMAÑO NO SE PUEDE BAJAR; LA INCERTIDUMBRE SI. Una audiencia de 10 MB
   * por el enlace de subida de una oficina son decenas de segundos, y hasta
   * ahora el boton decia «Enviando la grabacion...» sin moverse — indistinguible
   * de estar colgado. Se queda en 99 a proposito: los bytes salieron pero B2
   * aun verifica el SHA-1, y clavarse en 100 repite el defecto en el ultimo
   * tramo.
   */
  const [uploadProgress, setUploadProgress] = useState(0);

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
    async (file: File, contextPrompt?: string, autorizoGrabacionEl?: string) => {
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
          setUploadProgress(0);
          try {
            const fileKey = await transcriptionApi.uploadAudioToStorage(file, setUploadProgress);
            outcome = await transcriptionApi.transcribeFromStorage(fileKey, {
              kind,
              contextPrompt,
              autorizoGrabacionEl
            });
          } finally {
            setIsUploading(false);
          }
        } else {
          outcome = await transcriptionApi.transcribe({ file, kind, contextPrompt, autorizoGrabacionEl });
        }

        setResult(outcome.result);
        setRoleProposals(outcome.roleProposals);
        setVoiceConflicts(outcome.voiceConflicts);
        setNameProposals(outcome.nameProposals);
        setPersisted(outcome.persisted);
        setTranscriptionId(outcome.id);
        recordar(PANTALLAS.transcripcion(kind), outcome.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo transcribir el audio.');
      } finally {
        setIsTranscribing(false);
      }
    },
    [firmId, kind, maxAudioBytes, viaStorage]
  );

  /** Applies a procedural role to every segment of one diarized speaker. */
  /**
   * Records who a voice is, on screen and in the database.
   *
   * IT ONLY LIVED ON SCREEN, AND THAT DESTROYED THE LAWYER'S WORK. The endpoint
   * existed from the first day and nothing ever called it, so identifying the
   * judge never left the browser. Every operation that reads the transcript back
   * from the server — a cut, a reassignment, a correction — replaces the
   * segments with the stored ones, and the stored ones still said DESCONOCIDO.
   * Naming the voices and then cutting an intervention silently undid the
   * naming, which read as the app refusing to let it be changed.
   *
   * Applied locally first so the choice lands immediately, then persisted. If
   * the write fails the roles are put back as the server has them rather than
   * left looking saved.
   */
  const assignRole = useCallback(
    async (speakerLabel: string, role: SpeakerRole) => {
      // Captured BEFORE the optimistic apply, because reverting is a promise
      // this comment used to make and the code did not keep: review found the
      // catch only set an error message, leaving the role on screen looking
      // saved after a failed write.
      const before = result?.segments;

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

      if (!transcriptionId) return;

      try {
        const { item, voiceConflicts: fresh, nameProposals: frescos } = await transcriptionApi.assignRoles(transcriptionId, {
          [speakerLabel]: role
        });

        setResult((current) =>
          current
            ? { ...current, segments: item.segments, speakerLabels: item.speaker_labels }
            : current
        );
        setVoiceConflicts(fresh ?? []);
        setNameProposals(frescos ?? []);
        setError(null);
      } catch (err) {
        setResult((current) => (current && before ? { ...current, segments: before } : current));
        setError(err instanceof Error ? err.message : 'No se pudo guardar el rol del interlocutor.');
      }
    },
    [transcriptionId, result]
  );

  /**
   * Corrects one intervention, on screen and in the database.
   *
   * Applied locally first so the reader is not left waiting on a round trip for
   * a word they just typed, and persisted because the alternative is retyping
   * "desembargo" every time the transcript is opened.
   */
  /*
   * La marca de revision se refleja al instante y el servidor confirma detras;
   * si el servidor no pudo, la marca se revierte — una fila que se ve revisada
   * sin estarlo en la base es exactamente la mentira que la fraccion evita.
   */
  /**
   * La marca del abogado sobre una intervención decisiva. Artboard 2a.
   *
   * Optimista con reversión, igual que `marcarRevisada`: se pinta al instante
   * y si el servidor no pudo se deshace. Una marca que se queda puesta sin
   * guardarse haría que el acta prometa un hecho clave que no está en ninguna
   * parte — y quien lo descubriría es quien lea el acta, no quien la marcó.
   */
  const marcarHechoClave = useCallback(
    async (segmentIndex: number, hechoClave: boolean) => {
      setResult((current) =>
        current
          ? {
              ...current,
              segments: current.segments.map((segment, i) =>
                i === segmentIndex ? { ...segment, hechoClave } : segment
              )
            }
          : current
      );

      if (!transcriptionId) return;

      const item = await transcriptionApi.marcarHechoClave(transcriptionId, segmentIndex, hechoClave);
      if (!item) {
        setResult((current) =>
          current
            ? {
                ...current,
                segments: current.segments.map((segment, i) =>
                  i === segmentIndex ? { ...segment, hechoClave: !hechoClave } : segment
                )
              }
            : current
        );
      }
    },
    [transcriptionId]
  );

  const marcarRevisada = useCallback(
    async (segmentIndex: number, revisada: boolean) => {
      setResult((current) =>
        current
          ? {
              ...current,
              segments: current.segments.map((segment, i) =>
                i === segmentIndex ? { ...segment, revisada } : segment
              )
            }
          : current
      );

      if (!transcriptionId) return;

      const item = await transcriptionApi.marcarSegmentoRevisado(transcriptionId, segmentIndex, revisada);
      if (!item) {
        setResult((current) =>
          current
            ? {
                ...current,
                segments: current.segments.map((segment, i) =>
                  i === segmentIndex ? { ...segment, revisada: !revisada } : segment
                )
              }
            : current
        );
        setError('No se pudo guardar la marca de revisión. La pantalla volvió a lo guardado.');
      }
    },
    [transcriptionId]
  );

  const editSegment = useCallback(
    async (segmentIndex: number, text: string) => {
      const before = result?.segments;

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
        const { voiceConflicts: fresh, nameProposals: frescos } = await transcriptionApi.editSegment(
          transcriptionId,
          segmentIndex,
          text
        );
        setVoiceConflicts(fresh ?? []);
        setNameProposals(frescos ?? []);
        setError(null);
      } catch (err) {
        // Surfaced AND reverted: a correction the lawyer believes was saved
        // and was not is worse than one they know to redo — and the belief
        // came precisely from the corrected text staying on screen.
        setResult((current) => (current && before ? { ...current, segments: before } : current));
        setError(err instanceof Error ? err.message : 'La corrección no se pudo guardar.');
      }
    },
    [transcriptionId, result]
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

      // "__nueva__" is the UI's way of saying "nobody here". Anything else is a
      // voice already in the transcript, and the server gives the cut half that
      // voice's role — which is what keeps an interrupted judge from coming
      // back as a second judge.
      const destino =
        speakerLabel === '__nueva__' ? nextSpeakerLabel(result.speakerLabels) : speakerLabel;

      try {
        const { item, voiceConflicts: fresh, nameProposals: frescos } = await transcriptionApi.splitSegment(
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
        setVoiceConflicts(fresh ?? []);
        setNameProposals(frescos ?? []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo dividir la intervención.');
      }
    },
    [transcriptionId, result]
  );

  /**
   * Hands one whole intervention to another voice.
   *
   * The other half of the cut. Diarization merges two people under one label as
   * readily as it merges two people into one block, and a real hearing showed
   * both: `speaker_1` introduced himself twice, under two different names,
   * hours apart. Roles could not fix it — a role names the label, so it named
   * both — and the cut could not either, because it refuses to leave an empty
   * half.
   */
  const reassignSpeaker = useCallback(
    async (segmentIndex: number, speakerLabel: string) => {
      if (!transcriptionId || !result) return;

      const destino =
        speakerLabel === '__nueva__' ? nextSpeakerLabel(result.speakerLabels) : speakerLabel;

      try {
        const { item, voiceConflicts: fresh, nameProposals: frescos } = await transcriptionApi.reassignSpeaker(
          transcriptionId,
          segmentIndex,
          destino
        );

        setResult((current) =>
          current
            ? { ...current, segments: item.segments, speakerLabels: item.speaker_labels }
            : current
        );
        setVoiceConflicts(fresh ?? []);
        setNameProposals(frescos ?? []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo cambiar la voz de la intervención.');
      }
    },
    [transcriptionId, result]
  );

  /**
   * The transcripts already stored for this firm.
   *
   * WHY THIS SCREEN NEEDED TO EXIST. Every transcription was saved on the
   * server the moment the provider answered — deliberately, so closing a tab
   * would not lose a two-hour hearing or force paying to redo it — but nothing
   * ever showed them. A lawyer had no way to know their hearings were kept, no
   * way to reopen one, and no way to delete it. For privileged material that is
   * backwards: what is stored has to be visible to whoever it belongs to, and
   * they have to be able to remove it.
   */
  const [stored, setStored] = useState<StoredTranscription[]>([]);
  const [isLoadingStored, setIsLoadingStored] = useState(false);

  const loadStored = useCallback(async () => {
    if (!firmId) return;

    setIsLoadingStored(true);
    try {
      setStored(await transcriptionApi.list(kind));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los transcritos guardados.');
    } finally {
      setIsLoadingStored(false);
    }
  }, [firmId, kind]);

  /** Reopens a stored transcript into the working view. */
  const openStored = useCallback((item: StoredTranscription) => {
    setTranscriptionId(item.id);
    recordar(PANTALLAS.transcripcion(kind), item.id);
    setPersisted(true);
    setResult({
      kind: item.kind,
      fullText: textoDe(item),
      segments: item.segments,
      speakerLabels: item.speaker_labels,
      language: item.language,
      durationSeconds: item.duration_seconds,
      model: item.model,
      transcribedAt: item.transcribed_at
    });
    /*
     * Restored from the stored transcript, not cleared.
     *
     * These used to be emptied here, which meant the app read the names out of
     * a hearing and then forgot them the moment the tab was closed — the
     * suggestion only ever appeared in the seconds after transcribing. The
     * server recomputes both on every read, so what comes back is current for
     * the text as it stands now, edits included.
     *
     * Role proposals stay empty: they are produced once, from the untouched
     * transcription, and a stale one after the lawyer has already assigned
     * roles would argue with work they have finished.
     */
    setRoleProposals([]);
    setVoiceConflicts(item.voiceConflicts ?? []);
    setNameProposals(item.nameProposals ?? []);
  }, [kind]);

  const deleteStored = useCallback(
    async (id: string) => {
      try {
        await transcriptionApi.remove(id);
        setStored((actuales) => actuales.filter((t) => t.id !== id));

        /*
         * A transcript still on screen after being deleted is worse than one
         * that was never shown: every edit, cut and role assignment would fail
         * against a row that no longer exists, and the lawyer would be working
         * on something the database has already forgotten.
         */
        if (transcriptionId === id) {
          recordar(PANTALLAS.transcripcion(kind), null);
          setTranscriptionId(null);
          setResult(null);
          setRoleProposals([]);
          setVoiceConflicts([]);
    setNameProposals([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo borrar el transcrito.');
      }
    },
    [transcriptionId, kind]
  );

  /** Sets who a voice is, on screen and in the database. */
  const assignSpeakerName = useCallback(
    async (speakerLabel: string, name: string) => {
      if (!transcriptionId) return;

      try {
        const { item, voiceConflicts: fresh, nameProposals: frescos } =
          await transcriptionApi.assignSpeakerName(transcriptionId, speakerLabel, name);

        setResult((current) =>
          current
            ? { ...current, segments: item.segments, speakerLabels: item.speaker_labels }
            : current
        );
        setVoiceConflicts(fresh ?? []);
        setNameProposals(frescos ?? []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo guardar el nombre.');
      }
    },
    [transcriptionId]
  );

  const reset = useCallback(() => {
    recordar(PANTALLAS.transcripcion(kind), null);
    setResult(null);
    setTranscriptionId(null);
    setError(null);
    setRoleProposals([]);
    setVoiceConflicts([]);
    setNameProposals([]);
    setPersisted(true);
  }, [kind]);

  return {
    /** False while no firm is registered: the transcript could not be saved. */
    hasFirm: Boolean(firmId),
    isAvailable,
    isUploading,
    isTranscribing,
    result,
    error,
    roleProposals,
    voiceConflicts,
    nameProposals,
    stored,
    isLoadingStored,
    loadStored,
    openStored,
    deleteStored,
    persisted,
    maxAudioBytes,
    uploadProgress,
    transcribe,
    marcarRevisada,
    marcarHechoClave,
    assignRole,
    assignSpeakerName,
    editSegment,
    splitSegment,
    reassignSpeaker,
    /** The stored transcript's id, which an interview needs to attach a client. */
    transcriptionId,
    canEdit: Boolean(transcriptionId),
    reset
  };
};
