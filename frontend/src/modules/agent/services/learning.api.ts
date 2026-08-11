import { httpClient } from '../../../config/httpClient';

/**
 * "Enseñar Estilo": records how a firm edited a generated draft so future
 * generations follow its house format.
 *
 * Fire-and-forget by design — the lawyer's edit is already saved locally, so a
 * failure here must never surface as an error.
 */
export const learningApi = {
  async teachStyle(firmId: string, originalText: string, editedText: string): Promise<void> {
    try {
      await httpClient.post('/api/agent/learn-edits', {
        firmId,
        body: { originalText, editedText }
      });
    } catch {
      // Style learning is best-effort; the edit itself is unaffected.
    }
  }
};
