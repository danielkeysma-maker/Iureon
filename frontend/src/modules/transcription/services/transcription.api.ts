import { ApiError, httpClient } from '../../../config/httpClient';
import type {
  RoleProposal,
  SpeakerRole,
  TranscriptSegment,
  TranscriptionKind,
  TranscriptionResult
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
}

export interface TranscriptionOutcome {
  result: TranscriptionResult;
  id: string | null;
  persisted: boolean;
  roleProposals: RoleProposal[];
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

  async transcribe(firmId: string, input: TranscribeInput): Promise<TranscriptionOutcome> {
    const form = new FormData();
    form.append('audio', input.file);
    form.append('kind', input.kind);

    if (input.contextPrompt?.trim()) {
      form.append('contextPrompt', input.contextPrompt.trim());
    }

    const data = await httpClient.postForm<TranscribeResponse>('/api/transcription', form, {
      firmId
    });

    return {
      result: data.result,
      id: data.id ?? null,
      persisted: Boolean(data.persisted),
      roleProposals: data.roleProposals ?? []
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
  async uploadAudioToStorage(firmId: string, file: File): Promise<string> {
    const data = await httpClient.post<UploadUrlResponse>('/api/documents/upload-url', {
      firmId,
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
    firmId: string,
    fileKey: string,
    input: Omit<TranscribeInput, 'file'>
  ): Promise<TranscriptionOutcome> {
    const data = await httpClient.post<TranscribeResponse>('/api/transcription/from-storage', {
      firmId,
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
      roleProposals: data.roleProposals ?? []
    };
  },

  /**
   * Persists a correction to one intervention.
   *
   * Saved rather than kept on screen, because the alternative is retyping
   * "desembargo" every time the transcript is opened.
   */
  async editSegment(
    firmId: string,
    id: string,
    segmentIndex: number,
    text: string
  ): Promise<void> {
    await httpClient.patch(`/api/transcription/${id}/segment`, {
      firmId,
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
   * Persists who each voice is.
   *
   * The endpoint existed from the start and nothing ever called it, so the
   * lawyer's own identifications lived only on screen: the next operation that
   * read the transcript back from the server returned the stored roles and
   * erased them.
   */
  async assignRoles(
    firmId: string,
    id: string,
    roles: Record<string, SpeakerRole>
  ): Promise<{ item: { segments: TranscriptSegment[]; speaker_labels: string[] } }> {
    return httpClient.patch(`/api/transcription/${id}/roles`, {
      firmId,
      body: { roles }
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
    firmId: string,
    id: string,
    segmentIndex: number,
    speakerLabel: string
  ): Promise<{ item: { segments: TranscriptSegment[]; speaker_labels: string[] } }> {
    return httpClient.patch(`/api/transcription/${id}/speaker`, {
      firmId,
      body: { segmentIndex, speakerLabel }
    });
  },

  async splitSegment(
    firmId: string,
    id: string,
    segmentIndex: number,
    charOffset: number,
    speakerLabel: string
  ): Promise<{ item: { segments: TranscriptSegment[]; speaker_labels: string[] } }> {
    return httpClient.patch(`/api/transcription/${id}/split`, {
      firmId,
      body: { segmentIndex, charOffset, speakerLabel }
    });
  }
};

export { ApiError };
