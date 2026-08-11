import { ApiError, httpClient } from '../../../config/httpClient';
import type { TranscriptionKind, TranscriptionResult } from '../types';

interface StatusResponse {
  success: boolean;
  available: boolean;
}

interface TranscribeResponse {
  success: boolean;
  result: TranscriptionResult;
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
  async isAvailable(firmId: string): Promise<boolean> {
    try {
      const data = await httpClient.get<StatusResponse>('/api/transcription/status', { firmId });
      return data.available;
    } catch {
      return false;
    }
  },

  async transcribe(firmId: string, input: TranscribeInput): Promise<TranscriptionResult> {
    const form = new FormData();
    form.append('audio', input.file);
    form.append('kind', input.kind);

    if (input.contextPrompt?.trim()) {
      form.append('contextPrompt', input.contextPrompt.trim());
    }

    const data = await httpClient.postForm<TranscribeResponse>('/api/transcription', form, {
      firmId
    });

    return data.result;
  }
};

export { ApiError };
