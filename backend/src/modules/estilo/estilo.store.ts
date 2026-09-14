import { supabase } from '../../config/supabase.config';
import { MAX_LECCIONES_POR_ALCANCE } from './consolidarEstilo';
import { normalizarContenido } from './guardaJuridica';
import type { ContenidoDeLeccion, FuenteDeLeccion, LeccionGuardada, RolDelEstilo } from './types';

/**
 * Acceso a `estilo_lecciones`.
 *
 * ─── TODA CONSULTA FILTRA POR FIRMA, Y UN CHECK LO LEE ─────────────────────
 *
 * El servidor entra con la llave de servicio, que salta el RLS. La política de
 * la tabla solo protege otros caminos; aquí la frontera entre firmas es el
 * `.eq('firm_id', firmId)` de cada consulta, y una sola sin él le enseñaría a
 * una firma el formato de otra. `check:estilo-prompt` recorre este archivo y
 * falla si alguna consulta a la tabla no lo trae.
 *
 * SIN UPDATE: la tabla no lo concede. Una lección no se corrige; se retira y se
 * enseña otra.
 */

const TABLA = 'estilo_lecciones';
const COLUMNAS = 'id, rol, rama, fuente, contenido, taught_by, created_at';

interface Fila {
  id: string;
  rol: RolDelEstilo;
  rama: string | null;
  fuente: FuenteDeLeccion;
  contenido: unknown;
  taught_by: string;
  created_at: string;
}

const db = () => {
  if (!supabase) throw new Error('La base de datos no está configurada.');
  return supabase;
};

/* La columna es JSONB: se vuelve a dar forma al leer, por si una fila vieja o escrita a mano no la tiene. */
const aLeccion = (f: Fila): LeccionGuardada => ({
  id: f.id,
  rol: f.rol,
  rama: f.rama,
  fuente: f.fuente,
  contenido: normalizarContenido(f.contenido).contenido,
  taughtBy: f.taught_by,
  createdAt: f.created_at
});

export const estiloStore = {
  async contar(firmId: string, rol: RolDelEstilo, rama: string | null): Promise<number> {
    const consulta = db().from(TABLA).select('id', { count: 'exact', head: true }).eq('firm_id', firmId).eq('rol', rol);
    const { count, error } = await (rama ? consulta.eq('rama', rama) : consulta.is('rama', null));
    if (error) throw new Error(`No se pudieron contar las lecciones: ${error.message}`);
    return count ?? 0;
  },

  async insertar(
    firmId: string,
    fila: { rol: RolDelEstilo; rama: string | null; fuente: FuenteDeLeccion; contenido: ContenidoDeLeccion; taughtBy: string }
  ): Promise<LeccionGuardada> {
    const { data, error } = await db()
      .from(TABLA)
      .insert({ firm_id: firmId, rol: fila.rol, rama: fila.rama, fuente: fila.fuente, contenido: fila.contenido, taught_by: fila.taughtBy })
      .select(COLUMNAS)
      .single();
    if (error || !data) throw new Error(`No se pudo guardar la lección: ${error?.message ?? 'sin respuesta'}`);
    return aLeccion(data as Fila);
  },

  async listar(firmId: string, rol: RolDelEstilo, rama: string | null): Promise<LeccionGuardada[]> {
    const consulta = db().from(TABLA).select(COLUMNAS).eq('firm_id', firmId).eq('rol', rol);
    const { data, error } = await (rama ? consulta.eq('rama', rama) : consulta.is('rama', null))
      .order('created_at', { ascending: false })
      .limit(MAX_LECCIONES_POR_ALCANCE);
    if (error) throw new Error(`No se pudieron leer las lecciones: ${error.message}`);
    return ((data ?? []) as Fila[]).map(aLeccion);
  },

  async retirar(firmId: string, id: string): Promise<LeccionGuardada | null> {
    const { data, error } = await db().from(TABLA).delete().eq('id', id).eq('firm_id', firmId).select(COLUMNAS);
    if (error) throw new Error(`No se pudo retirar la lección: ${error.message}`);
    const filas = (data ?? []) as Fila[];
    return filas.length > 0 ? aLeccion(filas[0]) : null;
  }
};
