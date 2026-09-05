import { supabase } from '../../config/supabase.config';
import { AuthError, listFirmUsers } from '../auth/auth.service';
import { BackblazeB2TenantStorageService } from '../documents/b2.service';

/**
 * Deleting a firm with everything it owns: the ONE pipeline, shared by the
 * operator's console (`admin.service`) and by the firm's own administrator
 * (`firms.controller`, DELETE /api/firms/me).
 *
 * It lives in its own module rather than in `admin` because `auth` and `firms`
 * cannot import from `admin` without a cycle (`admin.service` imports
 * `auth.service`), and because who may ask for the deletion is a different
 * question from how it is carried out. The WHO is decided by each caller —
 * the operator with a reason and a typed name, the administrator with a
 * password and a typed name. The HOW is here, once, so the two can never
 * drift into leaving different leftovers.
 */

export interface FirmaEliminada {
  nombre: string;
  /** What the database function removed, table by table. */
  tablas: Array<{ tabla: string; filas: number }>;
  usuariosEliminados: number;
  /** Every step that did not complete and needs a hand: B2 objects, accounts. */
  advertencias: string[];
}

/** How many listing rounds the B2 sweep tolerates before it calls itself stuck. */
const MAX_RONDAS_B2 = 50;

const requireClient = () => {
  if (!supabase) {
    throw new AuthError('AUTH_UNAVAILABLE', 'La base de datos no está configurada.', 503);
  }
  return supabase;
};

/** The firm's registered name, or a 404 the caller can pass on. */
export const nombreDeLaFirma = async (firmId: string): Promise<string> => {
  const { data: fila } = await requireClient()
    .from('firms')
    .select('firm_id, name')
    .eq('firm_id', firmId)
    .maybeSingle();
  if (!fila) {
    throw new AuthError('FIRM_NOT_FOUND', 'No existe esa firma.', 404);
  }
  return String((fila as { name: string }).name ?? '');
};

/**
 * The firm the SUPER_ADMIN accounts belong to, read from the same
 * `app_metadata.firm_id` the middleware trusts. `null` when there is none or
 * the accounts cannot be listed: the caller then has nowhere to audit and
 * says so in the log instead.
 */
export const firmIdDelOperador = async (): Promise<string | null> => {
  const { data, error } = await requireClient().auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) return null;
  for (const u of data?.users ?? []) {
    const meta = (u.app_metadata ?? {}) as Record<string, unknown>;
    if (meta.role === 'SUPER_ADMIN' && typeof meta.firm_id === 'string' && meta.firm_id) {
      return meta.firm_id;
    }
  }
  return null;
};

/**
 * Deletes a firm with everything it owns, in this order and awaited whole:
 *
 *  1. Its accounts are LISTED (not yet deleted) while the firm still exists.
 *  2. Its B2 objects are deleted; a failure is a warning, never a stop —
 *     files in a bucket are recoverable by hand, a half-deleted tenant is not.
 *  3. `borrar_firma_completa` removes every row in one transaction (see
 *     supabase/migration-borrar-firma.sql for the table list and why
 *     trial_signups survives).
 *  4. The accounts are deleted LAST: had they gone first and step 3 failed,
 *     the firm would keep its data with nobody able to sign in.
 *
 * The caller has ALREADY decided the deletion is allowed: this function does
 * not check names, reasons or passwords. It refuses nothing but the absent
 * migration and a failing database.
 */
export const borrarFirmaConTodo = async (input: { firmId: string; nombre: string }): Promise<FirmaEliminada> => {
  const client = requireClient();
  const advertencias: string[] = [];

  // 1. Accounts, listed now: after step 3 nothing says which users were hers.
  const cuentas = await listFirmUsers(input.firmId);

  // 2. B2. Unconfigured or failing storage is reported, not fatal.
  const b2 = new BackblazeB2TenantStorageService();
  try {
    let ronda = 0;
    let borradosEnRonda = -1;
    while (ronda < MAX_RONDAS_B2 && borradosEnRonda !== 0) {
      const objetos = await b2.listFirmDocuments(input.firmId);
      if (objetos.length === 0) break;
      borradosEnRonda = 0;
      for (const objeto of objetos) {
        const borrado = await b2.deleteObject(input.firmId, objeto.fileKey);
        if (borrado) borradosEnRonda += 1;
        else advertencias.push(`Archivo en B2 no borrado: ${objeto.fileKey}`);
      }
      // A round that deleted nothing would list the same objects forever.
      ronda += 1;
    }
  } catch (err) {
    advertencias.push(
      `No se pudieron listar ni borrar los archivos de la firma en B2: ${(err as Error).message}`
    );
  }

  // 3. The database, in one transaction.
  const { data: tablas, error } = await client.rpc('borrar_firma_completa', {
    p_firm_id: input.firmId
  });
  if (error) {
    // PostgREST answers PGRST202 when the function does not exist: the
    // migration has not run. Named, so the operator knows what to do.
    const sinFuncion =
      error.code === 'PGRST202' || /could not find the function|does not exist/i.test(error.message);
    if (sinFuncion) {
      throw new AuthError(
        'MIGRATION_REQUIRED',
        'Falta ejecutar supabase/migration-borrar-firma.sql en la base de datos antes de poder eliminar una firma.',
        503
      );
    }
    console.error('[FIRMS] borrar_firma_completa falló:', error.message);
    throw new AuthError('DELETE_FAILED', 'No se pudo eliminar la firma; no se borró nada.', 502);
  }

  // 4. Accounts, last.
  let usuariosEliminados = 0;
  for (const cuenta of cuentas) {
    const { error: errorCuenta } = await client.auth.admin.deleteUser(cuenta.id);
    if (errorCuenta) advertencias.push(`Cuenta no eliminada: ${cuenta.email} (${errorCuenta.message})`);
    else usuariosEliminados += 1;
  }

  return {
    nombre: input.nombre,
    tablas: ((tablas ?? []) as Array<{ tabla: string; filas: number | string }>).map((t) => ({
      tabla: t.tabla,
      filas: Number(t.filas ?? 0)
    })),
    usuariosEliminados,
    advertencias
  };
};
