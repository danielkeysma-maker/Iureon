import { listarTodasLasCuentas } from '../listarCuentas';
import type { User } from '@supabase/supabase-js';
import type { supabase } from '../../../config/supabase.config';
import { createFirm } from '../../admin/admin.service';
import { signIn, type Session } from '../auth.service';

/**
 * Creates a firm with its administrator and returns a live session, for checks.
 *
 * Goes through `createFirm` — the operator console's own path — because that is
 * now the ONLY way a firm comes into being. Public self-registration was
 * removed: it let anyone open a tenant and use the product without becoming a
 * client. A test helper that kept its own private door would be testing a
 * product that no longer exists.
 */
export const crearFirmaConSesion = async (input: {
  firmName: string;
  nit: string;
  email: string;
  password: string;
}): Promise<Session> => {
  await createFirm({
    firmName: input.firmName,
    nit: input.nit,
    adminEmail: input.email,
    adminPassword: input.password
  });

  return signIn(input.email, input.password);
};

/**
 * A throwaway password for a check's throwaway account.
 *
 * Generated rather than written down, and not to satisfy the secrets gate —
 * that gate is right, and a literal password in source is a literal password in
 * source whatever it protects. Generating it means there is nothing to leak,
 * nothing to accidentally reuse somewhere real, and a different value on every
 * run.
 */
export const clavePrueba = (): string =>
  `pr-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

type ClienteSupabase = NonNullable<typeof supabase>;

/**
 * Las cuentas de TODAS las paginas, con la falla al lado.
 *
 * YA NO PAGINA AQUI. Esta funcion tuvo su propia paginacion mientras solo los
 * checks la necesitaban; cuando aparecio el mismo defecto en siete sitios de
 * produccion, la paginacion subio a `listarCuentas.ts` y esta la usa. Dos
 * copias del mismo bucle se separan en cuanto alguien corrige una — y la que
 * se quedaria atras es justo la que borra cuentas en la base del usuario.
 */
const listarTodosLosUsuarios = (c: ClienteSupabase): Promise<{ usuarios: User[]; falla: string | null }> =>
  listarTodasLasCuentas(c);

/** Busca una cuenta por correo exacto en todas las paginas. Un error al listar se lanza: no es «no existe». */
export const buscarUsuarioPorCorreo = async (c: ClienteSupabase, correo: string): Promise<User | undefined> => {
  const { usuarios, falla } = await listarTodosLosUsuarios(c);
  if (falla) throw new Error(falla);
  return usuarios.find((u) => u.email === correo);
};

/**
 * Borra las cuentas de prueba de UNA corrida y devuelve lo que no se pudo borrar.
 *
 * ─── POR QUE EXISTE ─────────────────────────────────────────────────────────
 *
 * Cada check que crea cuentas las borraba con su propio bucle, y los cinco
 * bucles tenian los mismos dos defectos:
 *
 * 1. No paginaban (ver `listarTodosLosUsuarios`).
 * 2. IGNORABAN EL RESULTADO DE `deleteUser`. Esta medido: en la base de
 *    produccion quedo `fb1789069190749@iureon.test`, de `check:billing`, del
 *    10 de septiembre de 2026. La limpieza borro su firma y borro la cuenta de
 *    la firma A; la de B no se borro, y el check termino en verde sin decir
 *    nada. Una limpieza que no mira si funciono no es una limpieza.
 *
 * Ademas se exigen DOS condiciones para borrar: que el correo termine en
 * `@iureon.test` y que contenga la marca de la corrida. Casar solo por la marca
 * —un numero— podia alcanzar a cualquier cuenta cuyo correo contuviera esos
 * digitos; este helper borra cuentas en la base del usuario, y no puede tocar
 * una que no sea de prueba.
 *
 * Nunca lanza: devuelve la lista de fallas (vacia = limpio), para que quien lo
 * llame siga borrando lo demas y haga FALLAR el check si algo quedo.
 */
export const borrarUsuariosDePrueba = async (c: ClienteSupabase, marca: string | number): Promise<string[]> => {
  const texto = String(marca);
  if (texto.length === 0) return ['marca vacia: se habria borrado toda cuenta @iureon.test, no se borro nada'];

  const fallas: string[] = [];
  try {
    const { usuarios, falla } = await listarTodosLosUsuarios(c);
    if (falla) fallas.push(falla);

    const deEstaCorrida = usuarios.filter((u) => {
      const correo = u.email?.toLowerCase() ?? '';
      return correo.endsWith('@iureon.test') && correo.includes(texto);
    });

    for (const u of deEstaCorrida) {
      const { error } = await c.auth.admin.deleteUser(u.id);
      if (error) fallas.push(`deleteUser ${u.email} (${u.id}): ${error.message}`);
    }
  } catch (err) {
    fallas.push(`borrado de cuentas de prueba: ${(err as Error).message}`);
  }
  return fallas;
};

/**
 * Ejecuta un borrado de filas y anota su error, en vez de descartarlo.
 *
 * Mismo defecto que `deleteUser`: `await c.from(...).delete()` NO LANZA cuando
 * falla, devuelve `{ error }`, y los checks nunca lo leian. Tampoco lanza este
 * helper, para que un borrado fallido no impida intentar los siguientes.
 */
export const borrarYAnotar = async (
  fallas: string[],
  etiqueta: string,
  consulta: PromiseLike<{ error: { message: string } | null }>
): Promise<void> => {
  try {
    const { error } = await consulta;
    if (error) fallas.push(`${etiqueta}: ${error.message}`);
  } catch (err) {
    fallas.push(`${etiqueta}: ${(err as Error).message}`);
  }
};

/**
 * Imprime, bien visible, lo que la limpieza no pudo borrar, y devuelve cuantas
 * fallas hubo para sumarlas a las del check.
 *
 * UN CHECK QUE DEJA DATOS EN LA BASE DEL USUARIO NO ES UN CHECK QUE PASA.
 */
export const informarLimpieza = (fallas: string[]): number => {
  if (fallas.length === 0) return 0;
  console.error('\n!!! LA LIMPIEZA FALLO: QUEDARON DATOS DE PRUEBA EN LA BASE !!!');
  for (const f of fallas) console.error(`FAIL limpieza — ${f}`);
  return fallas.length;
};
