import { supabase } from '../../../config/supabase.config';
import type { InformeDeRevision } from './documentReview';

/**
 * Where a review's report lives after the request ends.
 *
 * ─── WHAT IS KEPT, AND WHAT IS NOT ──────────────────────────────────────────
 *
 * The report, the question, the actuación and the FILE NAME. Never the text
 * of the brief: it is read once and discarded, as before. What the firm paid
 * for is the report, and that is what it can come back to.
 *
 * ─── BEST EFFORT, NEVER IN THE WAY ──────────────────────────────────────────
 *
 * Saving happens after the model answered and the charge settled. If the
 * table is missing (migration not run) or the insert fails, the review is
 * still returned and the response says `guardada: false`: a report the firm
 * paid for is never withheld because the archive hiccupped. The drafts
 * taught this the hard way — a silent fallback hid a missing migration for
 * weeks — so here the failure is reported, not swallowed.
 */

export interface RevisionGuardada {
  id: string;
  documentType: string;
  legalBranch: string | null;
  fileName: string;
  /** Cliente o proceso al que pertenece el escrito; texto libre de quien pidió la revisión. */
  cliente: string;
  pregunta: string;
  caracteres: number;
  truncado: boolean;
  conFicha: boolean;
  informe: InformeDeRevision | null;
  informeLibre: string | null;
  cobradoCop: number;
  userEmail: string;
  createdAt: string;
}

export interface NuevaRevision {
  firmId: string;
  userEmail: string;
  documentType: string;
  legalBranch?: string | null;
  fileName: string;
  cliente: string;
  pregunta: string;
  caracteres: number;
  truncado: boolean;
  conFicha: boolean;
  informe: InformeDeRevision | null;
  informeLibre: string | null;
  cobradoCop: number;
}

/** A row as Supabase returns it → what the API hands out. Pure; tolerant to nulls. */
export const aRevisionGuardada = (row: Record<string, unknown>): RevisionGuardada => ({
  id: String(row.id),
  documentType: String(row.document_type ?? ''),
  legalBranch: row.legal_branch ? String(row.legal_branch) : null,
  fileName: String(row.file_name ?? ''),
  cliente: String(row.cliente ?? ''),
  pregunta: String(row.pregunta ?? ''),
  caracteres: Number(row.caracteres ?? 0),
  truncado: Boolean(row.truncado),
  conFicha: Boolean(row.con_ficha),
  informe: row.informe && typeof row.informe === 'object' ? (row.informe as InformeDeRevision) : null,
  informeLibre: row.informe_libre ? String(row.informe_libre) : null,
  cobradoCop: Number(row.cobrado_cop ?? 0),
  userEmail: String(row.user_email ?? ''),
  createdAt: String(row.created_at ?? '')
});

/** Columns for the list: everything but the report bodies, which can be long. */
const COLUMNAS_DE_LISTA =
  'id, document_type, legal_branch, file_name, cliente, pregunta, caracteres, truncado, con_ficha, cobrado_cop, user_email, created_at';

export const documentReviewStore = {
  /** Returns the saved id, or null when it could not be saved (and logs why). */
  async guardar(n: NuevaRevision): Promise<string | null> {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('document_reviews')
      .insert({
        firm_id: n.firmId,
        user_email: n.userEmail,
        document_type: n.documentType,
        legal_branch: n.legalBranch ?? null,
        file_name: n.fileName,
        cliente: n.cliente,
        pregunta: n.pregunta,
        caracteres: n.caracteres,
        truncado: n.truncado,
        con_ficha: n.conFicha,
        informe: n.informe,
        informe_libre: n.informeLibre,
        cobrado_cop: n.cobradoCop
      })
      .select('id')
      .single();
    if (error) {
      console.error('[REVIEW] No se pudo guardar el informe:', error.message);
      return null;
    }
    return String((data as { id: string }).id);
  },

  async listar(firmId: string, limit = 30): Promise<RevisionGuardada[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('document_reviews')
      .select(COLUMNAS_DE_LISTA)
      .eq('firm_id', firmId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) {
      console.error('[REVIEW] No se pudo listar las revisiones:', error.message);
      return [];
    }
    return ((data ?? []) as Record<string, unknown>[]).map(aRevisionGuardada);
  },

  async obtener(firmId: string, id: string): Promise<RevisionGuardada | null> {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('document_reviews')
      .select('*')
      .eq('firm_id', firmId)
      .eq('id', id)
      .maybeSingle();
    if (error || !data) return null;
    return aRevisionGuardada(data as Record<string, unknown>);
  },

  async eliminar(firmId: string, id: string): Promise<boolean> {
    if (!supabase) return false;
    const { error } = await supabase.from('document_reviews').delete().eq('firm_id', firmId).eq('id', id);
    return !error;
  }
};
