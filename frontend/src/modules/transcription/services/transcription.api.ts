import { ApiError, httpClient } from '../../../config/httpClient';
import type { RoleProposal, TranscriptionKind, TranscriptionResult } from '../types';

interface StatusResponse {
  success: boolean;
  available: boolean;
  /** Belongs to the configured provider, not to the product. */
  maxAudioBytes?: number;
}

export interface TranscriptionStatus {
  available: boolean;
  maxAudioBytes: number | null;
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
  async status(firmId: string): Promise<TranscriptionStatus> {
    try {
      const data = await httpClient.get<StatusResponse>('/api/transcription/status', { firmId });
      return { available: data.available, maxAudioBytes: data.maxAudioBytes ?? null };
    } catch {
      return { available: false, maxAudioBytes: null };
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
  }
};

export { ApiError };
