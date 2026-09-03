import { supabase } from '../../config/supabase.config';

/** BORRADOR | REVISAR | LISTO | RADICADO. Lo mismo que la base comprueba. */
export type EstadoBorrador = 'BORRADOR' | 'REVISAR' | 'LISTO' | 'RADICADO';

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

  /*
   * Lo que convierte un archivo guardado en un plazo que corre.
   *
   * `vence_el` es una FECHA y no el término del catálogo: ese término es texto
   * —«Dentro de los diez (10) días siguientes a la presentación»— y de ahí no
   * sale una fecha sin saber cuándo empezó a correr. Solo lo sabe quien lleva el
   * caso; calcularlo nosotros sería inventar un plazo.
   */
  vence_el: string | null;
  legal_branch: string | null;
  cliente: string | null;
  despacho: string | null;
  radicado: string | null;
  estado: EstadoBorrador;
  /** Con fecha, el texto ya no se puede modificar. Lo impone la base. */
  radicado_el: string | null;
  version: number;

  /*
   * LA FICHA CON LA QUE SE REDACTO, congelada.
   *
   * Es una FOTO, no una referencia viva: si la firma corrige mañana el término
   * de esa actuación, el escrito ya redactado siguió afirmando lo que afirmó.
   * Guardar el id y releer el catálogo mostraría un plazo que ese texto nunca
   * dijo.
   *
   * NULL significa «no se registró», NO «sin respaldo». Los borradores
   * anteriores a la columna quedan así y no se advierten: no sabemos que les
   * falte respaldo, sabemos que no lo anotamos.
   */
  procedencia: unknown | null;
  /** El taller sobre el borrador: turnos con la guia y resaltados del abogado. Vacios si la columna no existe aun. */
  conversacion?: unknown[] | null;
  anotaciones?: unknown[] | null;
  versiones?: unknown[] | null;
}

/** Los campos que el cliente puede escribir. `version` y fechas las pone el servidor. */
export type CamposEditables = Partial<
  Pick<
    SavedDraftRow,
    | 'title'
    | 'legal_text'
    | 'jurisprudencia_citada'
    | 'excepciones_formuladas'
    | 'vence_el'
    | 'legal_branch'
    | 'cliente'
    | 'despacho'
    | 'radicado'
    | 'estado'
    | 'conversacion'
    | 'anotaciones'
    | 'versiones'
  >
>;

/**
 * Servicio de Borradores Guardados con Supabase Multi-Tenant.
 * Cuando Supabase no está disponible, devuelve respuestas vacías
 * para que el frontend use localStorage como fallback.
 */
export class DraftsService {

  /**
   * Lista todos los borradores de una firma+usuario
   */
  /**
   * @param alcance `MIOS` o `FIRMA`.
   *
   * FILTRABA SIEMPRE POR USUARIO, y eso escondía el trabajo de la firma de sí
   * misma: dos socios del mismo caso no veían los borradores del otro, y el
   * escrito que uno dejó a medias era invisible para quien tenía que radicarlo.
   * El defecto no daba error — la lista simplemente salía más corta.
   *
   * SE ORDENA POR TÉRMINO, no por última edición. Un borrador jurídico no es un
   * archivo que espera: es un plazo que corre. Uno editado hace un mes que vence
   * pasado mañana importa más que uno tocado esta mañana sin fecha, y ordenar
   * por edición los pone al revés. `nullsFirst: false` deja al final los que no
   * caducan.
   */
  async listDrafts(
    firmId: string,
    userEmail: string,
    alcance: 'MIOS' | 'FIRMA' = 'FIRMA'
  ): Promise<SavedDraftRow[]> {
    if (!supabase) {
      console.warn('[DRAFTS] Supabase no configurado — el frontend usará localStorage.');
      return [];
    }

    let consulta = supabase.from('saved_drafts').select('*').eq('firm_id', firmId);
    if (alcance === 'MIOS') consulta = consulta.eq('user_email', userEmail);

    const { data, error } = await consulta
      .order('vence_el', { ascending: true, nullsFirst: false })
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
        tokens_consumed: draft.tokens_consumed,
        legal_branch: draft.legal_branch ?? null,
        procedencia: draft.procedencia ?? null,
        vence_el: draft.vence_el ?? null,
        cliente: draft.cliente ?? null,
        despacho: draft.despacho ?? null,
        radicado: draft.radicado ?? null,
        estado: draft.estado ?? 'BORRADOR'
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
  async updateDraft(
    draftId: string,
    firmId: string,
    updates: CamposEditables
  ): Promise<SavedDraftRow | null> {
    if (!supabase) {
      console.warn('[DRAFTS] Supabase no configurado — fallback localStorage.');
      return null;
    }

    /*
     * La versión sube cuando cambia el TEXTO, no cuando se corrige el cliente o
     * se marca el estado. "v4" tiene que significar la cuarta redacción; si
     * subiera con cada campo, dos abogados no podrían usarla para saber cuál es
     * la buena, que es exactamente para lo que sirve.
     */
    const cambiaElTexto = typeof updates.legal_text === 'string';

    let version: number | undefined;
    if (cambiaElTexto) {
      const { data: actual } = await supabase
        .from('saved_drafts')
        .select('version')
        .eq('id', draftId)
        .eq('firm_id', firmId)
        .maybeSingle();
      version = ((actual as { version?: number } | null)?.version ?? 1) + 1;
    }

    // Marcar como radicado sella el escrito: la base impide editar su texto
    // desde ese momento, con un disparador y no con un `disabled` de pantalla.
    const radicado_el =
      updates.estado === 'RADICADO' ? new Date().toISOString() : undefined;

    const { data, error } = await supabase
      .from('saved_drafts')
      .update({
        ...updates,
        ...(version !== undefined ? { version } : {}),
        ...(radicado_el ? { radicado_el } : {}),
        updated_at: new Date().toISOString()
      })
      .eq('id', draftId)
      .eq('firm_id', firmId)
      .select()
      .single();

    if (error) {
      /*
       * El disparador de la base habla en español y dice exactamente qué pasó.
       * Se propaga tal cual en vez de un "no se pudo actualizar": alguien que
       * intenta editar un escrito radicado necesita saber que está radicado, no
       * que hubo un error.
       */
      console.error('[DRAFTS] Error al actualizar borrador:', error.message);
      throw new Error(error.message);
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
