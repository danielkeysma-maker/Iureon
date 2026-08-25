import { ApiError, httpClient } from '../../../config/httpClient';
import type {
  RoleProposal,
  SpeakerRole,
  TranscriptSegment,
  TranscriptionKind,
  TranscriptionResult,
  SpeakerNameProposal,
  VoiceConflict
} from '../types';

interface StatusResponse {
  success: boolean;
  available: boolean;
  /** What fits through the API, which the host may cap below the provider. */
  maxAudioBytes?: number;
  /** What the provider accepts when the audio reaches it via storage. */
  maxAudioBytesViaStorage?: number;
  supportsRemoteAudio?: boolean;
}

export interface TranscriptionStatus {
  available: boolean;
  maxAudioBytes: number | null;
  maxAudioBytesViaStorage: number | null;
  supportsRemoteAudio: boolean;
}

interface TranscribeResponse {
  success: boolean;
  result: TranscriptionResult;
  /** Null when the transcript could not be stored; see `persisted`. */
  id: string | null;
  /**
   * False means the transcription succeeded but was NOT saved. The lawyer has
   * to be told, because they are about to close a tab holding the only copy.
   */
  persisted: boolean;
  roleProposals: RoleProposal[];
  voiceConflicts?: VoiceConflict[];
  nameProposals?: SpeakerNameProposal[];
}

/** A transcript as the database holds it. */
export interface StoredTranscription {
  id: string;
  kind: TranscriptionKind;
  title: string;
  source_file_name: string;
  full_text: string;
  segments: TranscriptSegment[];
  speaker_labels: string[];
  language: string | null;
  duration_seconds: number | null;
  model: string;
  transcribed_at: string;
}

export interface TranscriptionOutcome {
  result: TranscriptionResult;
  id: string | null;
  persisted: boolean;
  roleProposals: RoleProposal[];
  voiceConflicts: VoiceConflict[];
  nameProposals: SpeakerNameProposal[];
}

interface UploadTarget {
  uploadUrl: string;
  authorizationToken: string;
  fileKey: string;
}

interface UploadUrlResponse {
  success?: boolean;
  uploadInfo?: UploadTarget;
}

/**
 * B2 verifies the SHA-1 of every upload, so the browser has to compute it.
 *
 * `crypto.subtle` needs a secure context, which https and localhost both are —
 * so this works in development without a certificate.
 */
const sha1Hex = async (buffer: ArrayBuffer): Promise<string> => {
  const digest = await crypto.subtle.digest('SHA-1', buffer);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
};

export interface TranscribeInput {
  file: File;
  kind: TranscriptionKind;
  /** Party names, court and radicado — improves recognition of legal terms. */
  contextPrompt?: string;
}

/**
 * Transcription REST client.
 *
 * Unlike the other API modules, failures are thrown rather than swallowed: a
 * transcription that silently returns nothing would leave the lawyer staring
 * at an empty panel with no idea whether the audio was rejected, the engine is
 * unconfigured, or the recording is too long. The backend already phrases each
 * of those in Spanish, so the message is surfaced as-is.
 */
export const transcriptionApi = {
  /**
   * Takes no firm: this asks whether the SERVER has an engine, which is the same
   * answer for everyone. It used to send one, so a user with no firm registered
   * got a 401, the catch below turned it into "unavailable", and the screen
   * blamed a missing DEEPGRAM_API_KEY that was correctly configured.
   */
  async status(): Promise<TranscriptionStatus> {
    try {
      const data = await httpClient.get<StatusResponse>('/api/transcription/status', {});
      return {
        available: data.available,
        maxAudioBytes: data.maxAudioBytes ?? null,
        maxAudioBytesViaStorage: data.maxAudioBytesViaStorage ?? null,
        supportsRemoteAudio: Boolean(data.supportsRemoteAudio)
      };
    } catch {
      return {
        available: false,
        maxAudioBytes: null,
        maxAudioBytesViaStorage: null,
        supportsRemoteAudio: false
      };
    }
  },

  async transcribe(input: TranscribeInput): Promise<TranscriptionOutcome> {
    const form = new FormData();
    form.append('audio', input.file);
    form.append('kind', input.kind);

    if (input.contextPrompt?.trim()) {
      form.append('contextPrompt', input.contextPrompt.trim());
    }

    const data = await httpClient.postForm<TranscribeResponse>('/api/transcription', form, {

    });

    return {
      result: data.result,
      id: data.id ?? null,
      persisted: Boolean(data.persisted),
      roleProposals: data.roleProposals ?? [],
      voiceConflicts: data.voiceConflicts ?? [],
      nameProposals: data.nameProposals ?? []
    };
  },

  /**
   * Sends the recording straight to storage, never through our API.
   *
   * This is the path a real hearing takes. The deployment rejects request
   * bodies over 4.5 MB and a two-hour recording is around 50, so an audio file
   * cannot reach the backend at all: the browser asks for a signed target,
   * uploads to Backblaze directly, and only the resulting key travels back.
   *
   * Failures throw. The older document-vault client returns null here so its
   * caller can "show its simulated result instead of an error" — which is how a
   * firm ends up believing a file was stored when it went nowhere.
   */
  async uploadAudioToStorage(file: File): Promise<string> {
    const data = await httpClient.post<UploadUrlResponse>('/api/documents/upload-url', {
      body: { caseId: 'audiencias', fileName: file.name }
    });

    const target = data.uploadInfo;

    if (!target?.uploadUrl || !target.authorizationToken || !target.fileKey) {
      throw new Error('El almacenamiento no entregó un destino de subida válido.');
    }

    const buffer = await file.arrayBuffer();

    const response = await fetch(target.uploadUrl, {
      method: 'POST',
      headers: {
        Authorization: target.authorizationToken,
        // Encoded because a hearing's filename carries accents and spaces, and
        // B2 reads this header literally.
        'X-Bz-File-Name': encodeURIComponent(target.fileKey),
        'Content-Type': file.type || 'application/octet-stream',
        'X-Bz-Content-Sha1': await sha1Hex(buffer)
      },
      body: buffer
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(`El almacenamiento rechazó la grabación (${response.status}). ${detail.slice(0, 200)}`);
    }

    return target.fileKey;
  },

  /** Transcribes a recording already in storage, and the server deletes it after. */
  async transcribeFromStorage(
    
    fileKey: string,
    input: Omit<TranscribeInput, 'file'>
  ): Promise<TranscriptionOutcome> {
    const data = await httpClient.post<TranscribeResponse>('/api/transcription/from-storage', {
      body: {
        fileKey,
        kind: input.kind,
        contextPrompt: input.contextPrompt?.trim() || undefined
      }
    });

    return {
      result: data.result,
      id: data.id ?? null,
      persisted: Boolean(data.persisted),
      roleProposals: data.roleProposals ?? [],
      voiceConflicts: data.voiceConflicts ?? [],
      nameProposals: data.nameProposals ?? []
    };
  },

  /**
   * Persists a correction to one intervention.
   *
   * Saved rather than kept on screen, because the alternative is retyping
   * "desembargo" every time the transcript is opened.
   */
  async editSegment(
    
    id: string,
    segmentIndex: number,
    text: string
  ): Promise<{ voiceConflicts?: VoiceConflict[]; nameProposals?: SpeakerNameProposal[] }> {
    // The conflicts ride back because fixing one misheard word can be exactly
    // what creates or resolves a two-people warning: names are words too.
    return httpClient.patch(`/api/transcription/${id}/segment`, {
      body: { segmentIndex, text }
    });
  },

  /**
   * Cuts one intervention in two, giving the second half a different voice.
   *
   * The transcript is refetched by the caller rather than patched locally: a
   * split changes indices for every intervention after it, and guessing at that
   * on the client is how two views of the same transcript drift apart.
   */
  /**
   * The transcripts this firm has stored.
   *
   * The endpoint has existed since the store was written and NOTHING EVER
   * CALLED IT, so a transcript vanished from the screen the moment the tab was
   * closed while the row stayed in the database. The lawyer was never told any
   * of it was being kept — which is the wrong way round for privileged
   * material: what is stored has to be visible to whoever it belongs to.
   */
  async list(): Promise<StoredTranscription[]> {
    const data = await httpClient.get<{ items: StoredTranscription[] }>('/api/transcription');
    return data.items ?? [];
  },

  /** Deletion is the firm's. Privileged material must not outlive their decision. */
  async remove(id: string): Promise<void> {
    await httpClient.delete(`/api/transcription/${id}`);
  },

  /**
   * Persists who each voice is.
   *
   * The endpoint existed from the start and nothing ever called it, so the
   * lawyer's own identifications lived only on screen: the next operation that
   * read the transcript back from the server returned the stored roles and
   * erased them.
   */
  async assignRoles(
    
    id: string,
    roles: Record<string, SpeakerRole>
  ): Promise<{ item: { segments: TranscriptSegment[]; speaker_labels: string[] }; voiceConflicts?: VoiceConflict[]; nameProposals?: SpeakerNameProposal[] }> {
    return httpClient.patch(`/api/transcription/${id}/roles`, {
      body: { roles }
    });
  },

  /**
   * Names a voice, or clears the name with an empty string.
   *
   * Applies to every intervention of that voice at once, like a role: the
   * person did not change halfway through the hearing.
   */
  async assignSpeakerName(
    id: string,
    speakerLabel: string,
    name: string
  ): Promise<{ item: { segments: TranscriptSegment[]; speaker_labels: string[] }; voiceConflicts?: VoiceConflict[]; nameProposals?: SpeakerNameProposal[] }> {
    return httpClient.patch(`/api/transcription/${id}/speaker-name`, {
      body: { speakerLabel, name }
    });
  },

  /**
   * Moves one whole intervention to another voice.
   *
   * Separate from splitSegment because the failures are different: a cut solves
   * two people inside one intervention, this solves two people sharing one
   * label across several.
   */
  async reassignSpeaker(
    
    id: string,
    segmentIndex: number,
    speakerLabel: string
  ): Promise<{ item: { segments: TranscriptSegment[]; speaker_labels: string[] }; voiceConflicts?: VoiceConflict[]; nameProposals?: SpeakerNameProposal[] }> {
    return httpClient.patch(`/api/transcription/${id}/speaker`, {
      body: { segmentIndex, speakerLabel }
    });
  },

  async splitSegment(
    
    id: string,
    segmentIndex: number,
    charOffset: number,
    speakerLabel: string
  ): Promise<{ item: { segments: TranscriptSegment[]; speaker_labels: string[] }; voiceConflicts?: VoiceConflict[]; nameProposals?: SpeakerNameProposal[] }> {
    return httpClient.patch(`/api/transcription/${id}/split`, {
      body: { segmentIndex, charOffset, speakerLabel }
    });
  }
};

export { ApiError };
