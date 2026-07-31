import { supabase } from '../../config/supabase.config';

export interface SavedDraftRow {
  id: string;
  firm_id: string;
  user_email: string;
  title: string;
  document_type: string;
  legal_text: string;
  jurisprudencia_citada: string[];
  excepciones_formuladas: string[];
  tokens_consumed: number;
  saved_at: string;
  updated_at: string;
}

/**
 * Servicio de Borradores Guardados con Supabase Multi-Tenant.
 * Cuando Supabase no está disponible, devuelve respuestas vacías
 * para que el frontend use localStorage como fallback.
 */
export class DraftsService {

  /**
   * Lista todos los borradores de una firma+usuario
   */
  async listDrafts(firmId: string, userEmail: string): Promise<SavedDraftRow[]> {
    if (!supabase) {
      console.warn('[DRAFTS] Supabase no configurado — el frontend usará localStorage.');
      return [];
    }

    const { data, error } = await supabase
      .from('saved_drafts')
      .select('*')
      .eq('firm_id', firmId)
      .eq('user_email', userEmail)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('[DRAFTS] Error al listar borradores:', error.message);
      return [];
    }

    return (data || []) as SavedDraftRow[];
  }

  /**
   * Crea un nuevo borrador
   */
  async createDraft(draft: Omit<SavedDraftRow, 'id' | 'saved_at' | 'updated_at'>): Promise<SavedDraftRow | null> {
    if (!supabase) {
      console.warn('[DRAFTS] Supabase no configurado — fallback localStorage.');
      return null;
    }

    const { data, error } = await supabase
      .from('saved_drafts')
      .insert({
        firm_id: draft.firm_id,
        user_email: draft.user_email,
        title: draft.title,
        document_type: draft.document_type,
        legal_text: draft.legal_text,
        jurisprudencia_citada: draft.jurisprudencia_citada,
        excepciones_formuladas: draft.excepciones_formuladas,
        tokens_consumed: draft.tokens_consumed
      })
      .select()
      .single();

    if (error) {
      console.error('[DRAFTS] Error al crear borrador:', error.message);
      return null;
    }

    return data as SavedDraftRow;
  }

  /**
   * Actualiza un borrador existente (sobreescribe texto y metadata)
   */
  async updateDraft(draftId: string, firmId: string, updates: Partial<Pick<SavedDraftRow, 'title' | 'legal_text' | 'jurisprudencia_citada' | 'excepciones_formuladas'>>): Promise<SavedDraftRow | null> {
    if (!supabase) {
      console.warn('[DRAFTS] Supabase no configurado — fallback localStorage.');
      return null;
    }

    const { data, error } = await supabase
      .from('saved_drafts')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', draftId)
      .eq('firm_id', firmId)
      .select()
      .single();

    if (error) {
      console.error('[DRAFTS] Error al actualizar borrador:', error.message);
      return null;
    }

    return data as SavedDraftRow;
  }

  /**
   * Elimina un borrador (solo si pertenece a la firma)
   */
  async deleteDraft(draftId: string, firmId: string): Promise<boolean> {
    if (!supabase) {
      console.warn('[DRAFTS] Supabase no configurado — fallback localStorage.');
      return false;
    }

    const { error } = await supabase
      .from('saved_drafts')
      .delete()
      .eq('id', draftId)
      .eq('firm_id', firmId);

    if (error) {
      console.error('[DRAFTS] Error al eliminar borrador:', error.message);
      return false;
    }

    return true;
  }
}
