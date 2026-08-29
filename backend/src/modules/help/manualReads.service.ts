import { supabase } from '../../config/supabase.config';

/**
 * Qué ha leído cada persona del manual. Artboard 9a.
 *
 * ─── LA PREGUNTA QUE ESTO CONTESTA ──────────────────────────────────────────
 *
 * No es «cuánto lleva el usuario», que sería una barra de progreso decorativa.
 * Es la del artboard: **un socio necesita saber si el abogado nuevo leyó el
 * artículo de verificación antes de darle permisos de curaduría**. Por eso el
 * registro es por persona y consultable por la firma, y no una marca local.
 *
 * ─── LA FILA EXISTE O NO EXISTE ─────────────────────────────────────────────
 *
 * No hay columna `leido`. Un booleano permitiría `leido = false`, que es un
 * estado sin significado: nadie marca un artículo como no leído, lo desmarca —
 * y eso es borrar la fila. Menos estados, menos formas de contradecirse.
 *
 * ─── ESTO NO AFIRMA QUE ALGUIEN ENTENDIÓ ────────────────────────────────────
 *
 * Marca que alguien dijo haberlo leído, y así hay que leerlo. El producto no
 * mide comprensión y no debe insinuar que lo hace: la pantalla lo dice con esas
 * palabras, porque un socio que confunda «marcado» con «sabe» tomaría la
 * decisión de curaduría sobre una garantía que nadie dio.
 */

export interface LecturaDelManual {
  articleId: string;
  readAt: string;
}

const sinBase = (): never => {
  throw new Error('La base de datos no está configurada.');
};

/** Lo que ESTA persona ha marcado. La firma acota; el correo identifica. */
export const listarLecturas = async (
  firmId: string,
  userEmail: string
): Promise<LecturaDelManual[]> => {
  if (!supabase) sinBase();

  const { data, error } = await supabase!
    .from('manual_reads')
    .select('article_id, read_at')
    .eq('firm_id', firmId)
    .eq('user_email', userEmail);

  if (error) throw new Error(error.message);

  return (data ?? []).map((r: { article_id: string; read_at: string }) => ({
    articleId: r.article_id,
    readAt: r.read_at
  }));
};

/**
 * Marca o desmarca. `upsert` y no `insert` a propósito: volver a marcar lo ya
 * marcado es lo que hace alguien que no recuerda si lo hizo, y devolver un
 * error de clave duplicada por eso convertiría un gesto inocente en un fallo.
 */
export const marcarLectura = async (
  firmId: string,
  userEmail: string,
  articleId: string,
  leido: boolean
): Promise<void> => {
  if (!supabase) sinBase();

  if (!leido) {
    const { error } = await supabase!
      .from('manual_reads')
      .delete()
      .eq('firm_id', firmId)
      .eq('user_email', userEmail)
      .eq('article_id', articleId);

    if (error) throw new Error(error.message);
    return;
  }

  const { error } = await supabase!
    .from('manual_reads')
    .upsert(
      { firm_id: firmId, user_email: userEmail, article_id: articleId },
      { onConflict: 'firm_id,user_email,article_id' }
    );

  if (error) throw new Error(error.message);
};
