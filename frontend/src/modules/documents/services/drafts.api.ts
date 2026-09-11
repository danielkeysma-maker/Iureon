import { httpClient } from '../../../config/httpClient';
import type { EstadoBorrador, GeneratedDraft, SavedDraftEntry } from '../types';

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
  /** La ficha con la que se redactó, congelada. Ausente en filas anteriores. */
  procedencia?: unknown;
  conversacion?: unknown;
  anotaciones?: unknown;
  versiones?: unknown;
  tokens_consumed?: number;
  saved_at: string;
  updated_at?: string;

  /*
   * THESE COLUMNS EXISTED IN THE DATABASE AND THIS MAPPER THREW THEM AWAY.
   *
   * `toEntry` built an object with title, type and text, so the list could only
   * ever show the name of a file. The deadline, the case and the version were
   * being read from Postgres and discarded one function later — which is why
   * the drafts screen sorted by last edit even though the server sorts by
   * expiry: the field it sorts on never reached the client.
   */
  vence_el?: string | null;
  legal_branch?: string | null;
  cliente?: string | null;
  /** El caso al que pertenece, o null si nacio suelto. */
  expediente_id?: string | null;
  despacho?: string | null;
  radicado?: string | null;
  estado?: EstadoBorrador;
  radicado_el?: string | null;
  version?: number;
  user_email?: string | null;
  /** Quien guardó la última edición. Ausente en filas anteriores a la migración de avisos. */
  updated_by_email?: string | null;
}

/** Lo que del expediente se sabe al crear el borrador; cada clave viaja solo si viene. */
export interface DatosDeExpedienteAlCrear {
  legalBranch?: string | null;
  cliente?: string | null;
  /**
   * DE QUE CASO ES EL BORRADOR.
   *
   * `cliente` es texto libre para reconocerlo en la lista; esto es lo que lo
   * ATA a un expediente y hace que el caso lo cuente como suyo. El servidor
   * comprueba que sea de la firma y responde 404 si no lo es.
   */
  expedienteId?: string | null;
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
    tokensConsumed: row.tokens_consumed || 0,
    /*
     * `?? null` y no `|| null`: `null` significa «no se registro», que NO es lo
     * mismo que «sin respaldo». Los borradores anteriores a la columna quedan
     * asi y la interfaz no los advierte — no sabemos que les falte respaldo,
     * sabemos que no lo anotamos.
     */
    procedencia: (row.procedencia as GeneratedDraft['procedencia']) ?? null
  },

  /*
   * `?? null` and not `|| null`: an empty string is a value the lawyer typed
   * and then cleared, and it must survive as such. Only a missing column
   * becomes null, so the UI can tell "no lo sabemos" from "está vacío".
   */
  venceEl: row.vence_el ?? null,
  legalBranch: row.legal_branch ?? null,
  conversacion: Array.isArray(row.conversacion) ? (row.conversacion as unknown[]) : [],
  anotaciones: Array.isArray(row.anotaciones) ? (row.anotaciones as unknown[]) : [],
  versiones: Array.isArray(row.versiones) ? (row.versiones as unknown[]) : [],
  cliente: row.cliente ?? null,
  /* Vuelve al abrirlo, para que el borrador siga atado a su caso. */
  expedienteId: row.expediente_id ?? null,
  despacho: row.despacho ?? null,
  radicado: row.radicado ?? null,
  estado: row.estado ?? 'BORRADOR',
  radicadoEl: row.radicado_el ?? null,
  version: row.version ?? 1,
  autor: row.user_email ?? null,
  editadoPor: row.updated_by_email ?? null
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

  /**
   * Returns the new draft's id, or null when the API could not create it.
   *
   * `extras` son los datos del EXPEDIENTE que ya se conocen al crear —la rama y
   * el cliente—. Van en la misma llamada porque el servidor los acepta ahí y
   * porque un borrador que nace sin rama abre luego con la rama que hubiera
   * elegida, que es el defecto que `handleLoadDraft` ya tuvo que corregir.
   */
  async create(draft: GeneratedDraft, extras: DatosDeExpedienteAlCrear = {}): Promise<string | null> {
    try {
      const json = await httpClient.post<{ success: boolean; draft?: { id?: string } }>('/api/drafts', {
        body: {
          title: draft.title,
          documentType: draft.documentType,
          legalText: draft.legalText,
          jurisprudenciaCitada: draft.jurisprudenciaCitada,
          excepcionesFormuladas: draft.excepcionesFormuladas,
          tokensConsumed: draft.tokensConsumed,
          /* La ficha con la que se redacto, para que el borrador la recuerde. */
          procedencia: draft.procedencia ?? null,
          ...(extras.legalBranch !== undefined ? { legalBranch: extras.legalBranch } : {}),
          ...(extras.cliente !== undefined ? { cliente: extras.cliente } : {}),
          ...(extras.expedienteId ? { expedienteId: extras.expedienteId } : {})
        }
      });
      return json.success && json.draft?.id ? String(json.draft.id) : null;
    } catch {
      return null;
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

  /**
   * Los datos del EXPEDIENTE, aparte del texto.
   *
   * `update` manda título y texto, y eso sube la versión: v4 significa la
   * cuarta redacción. Corregir el nombre del cliente o poner la fecha de
   * vencimiento no es redactar de nuevo, y si pasara por ahí, dos abogados ya
   * no podrían usar el número de versión para saber cuál es el escrito bueno —
   * que es exactamente para lo que sirve.
   *
   * Solo se mandan las claves presentes: el servidor distingue `undefined` de
   * `null`, así que omitir un campo lo deja como estaba y mandarlo en `null` lo
   * borra a propósito.
   */
  async patch(
    draftId: string,
    campos: {
      venceEl?: string | null;
      cliente?: string | null;
      despacho?: string | null;
      radicado?: string | null;
      legalBranch?: string | null;
      estado?: EstadoBorrador;
      legalText?: string;
      conversacion?: unknown[];
      anotaciones?: unknown[];
      versiones?: unknown[];
    },
    /** `keepalive`: el último guardado al ocultar o cerrar la pestaña; sobrevive a la página. */
    opciones: { keepalive?: boolean } = {}
  ): Promise<boolean> {
    try {
      const json = await httpClient.put<{ success: boolean }>(`/api/drafts/${draftId}`, {
        body: campos,
        keepalive: opciones.keepalive
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
