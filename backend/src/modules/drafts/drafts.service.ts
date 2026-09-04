import { supabase } from '../../config/supabase.config';
import { enviarAFirma } from '../push/push.service';

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
  /** Quien guardó la última edición. `user_email` es el creador y no cambia. Ausente antes de la migración. */
  updated_by_email?: string | null;
  /** Último aviso enviado a la firma por este borrador: sostiene el tope de uno cada 10 minutos. */
  notified_at?: string | null;
}

/**
 * Entre un aviso y el siguiente del MISMO borrador. El taller guarda en cada
 * cambio de texto; sin tope, media hora de edición serían treinta avisos
 * iguales en el teléfono de cada colega.
 */
const AVISO_CADA_MS = 10 * 60 * 1000;

/**
 * La columna puede no existir todavía (ventana entre despliegue y migración):
 * Supabase responde «column ... not found in schema cache» y el insert entero
 * falla. Se reconoce para reintentar sin ella, gritando la migración.
 */
const faltaColumna = (mensaje: string | undefined): boolean =>
  typeof mensaje === 'string' && mensaje.includes('schema cache');

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

    const creado = data as SavedDraftRow;
    // Antes de devolver: la función serverless se congela al responder.
    await enviarAFirma({
      firmId: creado.firm_id,
      exceptoEmail: creado.user_email,
      aviso: {
        title: `${creado.user_email} creó un borrador`,
        body: creado.title,
        url: '/?ir=borradores',
        tag: `borrador-${creado.id}`
      }
    });

    return creado;
  }

  /**
   * Actualiza un borrador existente (sobreescribe texto y metadata)
   */
  async updateDraft(
    draftId: string,
    firmId: string,
    updates: CamposEditables,
    /** Quien guarda. Del token; se anota en `updated_by_email` y se excluye del aviso. */
    actorEmail: string | null = null
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
    /*
     * Un aviso a la firma cuando cambia el TEXTO, y como mucho uno cada diez
     * minutos por borrador. `notified_at` se escribe en la misma actualización
     * que el texto, así que dos guardados seguidos no avisan dos veces.
     */
    let avisar = false;
    if (cambiaElTexto) {
      const { data: actual } = await supabase
        .from('saved_drafts')
        .select('*')
        .eq('id', draftId)
        .eq('firm_id', firmId)
        .maybeSingle();
      const fila = actual as SavedDraftRow | null;
      version = (fila?.version ?? 1) + 1;
      const ultimo = fila?.notified_at ? Date.parse(fila.notified_at) : 0;
      avisar = Boolean(actorEmail) && (!ultimo || Date.now() - ultimo > AVISO_CADA_MS);
    }

    // Marcar como radicado sella el escrito: la base impide editar su texto
    // desde ese momento, con un disparador y no con un `disabled` de pantalla.
    const radicado_el =
      updates.estado === 'RADICADO' ? new Date().toISOString() : undefined;

    const ahora = new Date().toISOString();
    const cambios = {
      ...updates,
      ...(version !== undefined ? { version } : {}),
      ...(radicado_el ? { radicado_el } : {}),
      updated_at: ahora
    };
    // Las columnas de la migración de avisos viajan aparte para poder reintentar sin ellas.
    const autoria = {
      ...(actorEmail ? { updated_by_email: actorEmail } : {}),
      ...(avisar ? { notified_at: ahora } : {})
    };

    const actualizar = (campos: Record<string, unknown>) =>
      supabase!
        .from('saved_drafts')
        .update(campos)
        .eq('id', draftId)
        .eq('firm_id', firmId)
        .select()
        .single();

    let { data, error } = await actualizar({ ...cambios, ...autoria });
    if (error && Object.keys(autoria).length > 0 && faltaColumna(error.message)) {
      console.error(
        '[DRAFTS] Faltan columnas updated_by_email/notified_at: corra supabase/migration-notificaciones-push.sql. ' +
          'Se guarda sin autoría de la edición.'
      );
      ({ data, error } = await actualizar(cambios));
      avisar = false;
    }

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

    const actualizado = data as SavedDraftRow;
    if (avisar && actorEmail) {
      // Antes de devolver: la función serverless se congela al responder.
      await enviarAFirma({
        firmId,
        exceptoEmail: actorEmail,
        aviso: {
          title: `${actorEmail} editó un borrador`,
          body: actualizado.title,
          url: '/?ir=borradores',
          tag: `borrador-${actualizado.id}`
        }
      });
    }

    return actualizado;
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
