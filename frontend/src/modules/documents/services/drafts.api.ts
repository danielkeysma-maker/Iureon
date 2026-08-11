import { API_BASE_URL } from '../../../config/api.config';
import type { GeneratedDraft, SavedDraftEntry } from '../types';

/**
 * Saved drafts REST client.
 *
 * The backend answers with a `{ success, ... }` envelope and snake_case rows.
 * Every call resolves to null when the request fails or reports success:false,
 * because the caller's contract is to fall back to localStorage rather than
 * surface an error — drafts must never be lost to a backend outage.
 */

interface SavedDraftRow {
  id: string;
  title: string;
  document_type: string;
  legal_text: string;
  jurisprudencia_citada?: string[];
  excepciones_formuladas?: string[];
  tokens_consumed?: number;
  saved_at: string;
  updated_at?: string;
}

const formatSavedAt = (value: string): string =>
  new Date(value).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

const toEntry = (row: SavedDraftRow): SavedDraftEntry => ({
  id: row.id,
  savedAt: formatSavedAt(row.updated_at || row.saved_at),
  draft: {
    title: row.title,
    documentType: row.document_type,
    legalText: row.legal_text,
    jurisprudenciaCitada: row.jurisprudencia_citada || [],
    excepcionesFormuladas: row.excepciones_formuladas || [],
    tokensConsumed: row.tokens_consumed || 0
  }
});

const tenantHeaders = (firmId: string, withBody: boolean): Record<string, string> => ({
  'x-firm-id': firmId,
  ...(withBody ? { 'Content-Type': 'application/json' } : {})
});

export const draftsApi = {
  /** Returns null when the API is unreachable or has no drafts to offer. */
  async list(firmId: string, userEmail: string): Promise<SavedDraftEntry[] | null> {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/drafts?userEmail=${encodeURIComponent(userEmail)}`,
        { headers: tenantHeaders(firmId, false) }
      );
      const json = await res.json();

      if (json.success && json.drafts?.length > 0) {
        return (json.drafts as SavedDraftRow[]).map(toEntry);
      }
    } catch {
      // Unreachable API is an expected state; the caller uses localStorage.
    }

    return null;
  },

  async create(firmId: string, userEmail: string, draft: GeneratedDraft): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/drafts`, {
        method: 'POST',
        headers: tenantHeaders(firmId, true),
        body: JSON.stringify({
          userEmail,
          title: draft.title,
          documentType: draft.documentType,
          legalText: draft.legalText,
          jurisprudenciaCitada: draft.jurisprudenciaCitada,
          excepcionesFormuladas: draft.excepcionesFormuladas,
          tokensConsumed: draft.tokensConsumed
        })
      });
      const json = await res.json();
      return Boolean(json.success && json.draft);
    } catch {
      return false;
    }
  },

  async update(firmId: string, draftId: string, draft: GeneratedDraft): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/drafts/${draftId}`, {
        method: 'PUT',
        headers: tenantHeaders(firmId, true),
        body: JSON.stringify({
          title: draft.title,
          legalText: draft.legalText,
          jurisprudenciaCitada: draft.jurisprudenciaCitada,
          excepcionesFormuladas: draft.excepcionesFormuladas
        })
      });
      const json = await res.json();
      return Boolean(json.success);
    } catch {
      return false;
    }
  },

  async remove(firmId: string, draftId: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/drafts/${draftId}`, {
        method: 'DELETE',
        headers: tenantHeaders(firmId, false)
      });
      const json = await res.json();
      return Boolean(json.success);
    } catch {
      return false;
    }
  }
};
