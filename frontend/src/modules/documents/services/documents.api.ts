import { httpClient } from '../../../config/httpClient';

interface UploadUrlResponse {
  success?: boolean;
  uploadInfo?: { fileKey?: string };
}

interface IngestResponse {
  success?: boolean;
  result?: { title: string; b2FileUrl: string; totalFoliosIndexed: number };
}

/**
 * Case-file vault: requests a Backblaze B2 upload target, then triggers
 * chunking and vectorisation of the uploaded document.
 *
 * Both calls resolve to null on failure so the caller can show its simulated
 * result instead of an error.
 */
export const documentsApi = {
  async requestUploadUrl(firmId: string, caseId: string, fileName: string) {
    try {
      const data = await httpClient.post<UploadUrlResponse>('/api/documents/upload-url', {
        firmId,
        body: { caseId, fileName }
      });
      return data.uploadInfo?.fileKey ?? null;
    } catch {
      return null;
    }
  },

  async ingest(firmId: string, body: Record<string, unknown>) {
    try {
      const data = await httpClient.post<IngestResponse>('/api/documents/ingest', { firmId, body });
      return data.success && data.result ? data.result : null;
    } catch {
      return null;
    }
  }
};
