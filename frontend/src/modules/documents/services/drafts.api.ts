import { httpClient } from '../../../config/httpClient';
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

/*
 * THIS FILE USED TO BYPASS THE SHARED CLIENT AND WRITE ITS OWN TENANT HEADER.
 *
 * `tenantHeaders` sent `x-firm-id` on a raw fetch, so it neither carried the
 * session nor renewed it. With the tenant now resolved from the token, those
 * calls would simply have started returning 401 — and the drafts screen falls
 * back to localStorage on failure, so it would have looked like the drafts had
 * been lost rather than like a bug.
 *
 * Everything below goes through httpClient, which attaches the session and
 * refreshes it before it expires. The author is no longer sent at all: the
 * server reads it from the same token.
 */

export const draftsApi = {
  /** Returns null when the API is unreachable or has no drafts to offer. */
  async list(): Promise<SavedDraftEntry[] | null> {
    try {
      const json = await httpClient.get<{ success: boolean; drafts?: SavedDraftRow[] }>(
        '/api/drafts'
      );

      if (json.success && json.drafts?.length) {
        return json.drafts.map(toEntry);
      }
    } catch {
      // Unreachable API is an expected state; the caller uses localStorage.
    }

    return null;
  },

  async create(draft: GeneratedDraft): Promise<boolean> {
    try {
      const json = await httpClient.post<{ success: boolean; draft?: unknown }>('/api/drafts', {
        body: {
          title: draft.title,
          documentType: draft.documentType,
          legalText: draft.legalText,
          jurisprudenciaCitada: draft.jurisprudenciaCitada,
          excepcionesFormuladas: draft.excepcionesFormuladas,
          tokensConsumed: draft.tokensConsumed
        }
      });
      return Boolean(json.success && json.draft);
    } catch {
      return false;
    }
  },

  async update(draftId: string, draft: GeneratedDraft): Promise<boolean> {
    try {
      const json = await httpClient.put<{ success: boolean }>(`/api/drafts/${draftId}`, {
        body: {
          title: draft.title,
          legalText: draft.legalText,
          jurisprudenciaCitada: draft.jurisprudenciaCitada,
          excepcionesFormuladas: draft.excepcionesFormuladas
        }
      });
      return Boolean(json.success);
    } catch {
      return false;
    }
  },

  async remove(draftId: string): Promise<boolean> {
    try {
      const json = await httpClient.delete<{ success: boolean }>(`/api/drafts/${draftId}`);
      return Boolean(json.success);
    } catch {
      return false;
    }
  }
};
