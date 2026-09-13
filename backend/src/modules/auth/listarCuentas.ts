import type { SupabaseClient, User } from '@supabase/supabase-js';

/**
 * TODAS LAS CUENTAS DE SUPABASE AUTH, PÁGINA POR PÁGINA, Y SI ALGUNA NO SE PUDO
 * LEER, QUE SE DIGA.
 *
 * ─── EL DEFECTO QUE CIERRA ─────────────────────────────────────────────────
 *
 * `auth.admin.listUsers()` NO devuelve todas las cuentas: devuelve UNA PÁGINA.
 * Sin argumentos son 50; con `{ page: 1, perPage: 1000 }` son mil. En los dos
 * casos, la cuenta 51 —o la 1.001— simplemente no existe para quien pregunta, y
 * nada falla.
 *
 * Siete sitios del backend lo llamaban así, y cada uno con una consecuencia
 * distinta pero igual de muda: la consola del operador contaba de menos los
 * usuarios de cada firma; el cupo de usuarios del plan se medía contra una
 * lista incompleta; el borrado de firma no encontraba a su operador; y los
 * scripts de administración decían «no hay ninguna cuenta con ese correo»
 * sobre cuentas que sí existían.
 *
 * Además, varios descartaban el `error` y trataban la lista como vacía. Una
 * lista que no se pudo leer NO es una plataforma sin usuarios: convertir «no
 * sé» en «cero» es el defecto que esta casa persigue en todas partes.
 *
 * ─── POR QUÉ DEVUELVE LA FALLA EN VEZ DE LANZAR ────────────────────────────
 *
 * Porque quien llama decide, y hoy deciden distinto con razón: la consola y el
 * conteo del plan responden 502; `firmIdDelOperador` devuelve `null` y deja
 * constancia en el registro; un script sale con un mensaje. Un helper que
 * lanzara obligaría a los tres a envolverlo igual. Lo que ninguno puede hacer
 * es ignorarla: viene en el resultado.
 *
 * Si falla una página a medias, se devuelven las cuentas leídas HASTA ahí y la
 * falla. Quien la reciba no debe tratar esa lista como completa.
 */

/** El máximo que Supabase admite por página; con él, una plataforma pequeña cabe en una sola vuelta. */
export const CUENTAS_POR_PAGINA = 1000;

export interface ListadoDeCuentas {
  usuarios: User[];
  /** Nula si se leyeron TODAS las páginas. Si trae texto, `usuarios` está incompleto. */
  falla: string | null;
}

export const listarTodasLasCuentas = async (client: Pick<SupabaseClient, 'auth'>): Promise<ListadoDeCuentas> => {
  const usuarios: User[] = [];
  for (let page = 1; ; page++) {
    let respuesta;
    try {
      respuesta = await client.auth.admin.listUsers({ page, perPage: CUENTAS_POR_PAGINA });
    } catch (err) {
      return { usuarios, falla: `listUsers (página ${page}): ${(err as Error).message}` };
    }
    const { data, error } = respuesta;
    if (error) return { usuarios, falla: `listUsers (página ${page}): ${error.message}` };
    usuarios.push(...data.users);
    if (data.users.length < CUENTAS_POR_PAGINA) return { usuarios, falla: null };
  }
};
