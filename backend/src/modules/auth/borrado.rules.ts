import { AuthError } from './auth.service';
import type { FirmUserRole } from './auth.service';

/**
 * The pure rules behind a lawyer deleting THEIR OWN data from Ajustes →
 * «Su cuenta»: their user, or — as administrator — the whole firm.
 *
 * Kept free of the database so `borrado.check.ts` can prove them against
 * fixed inputs. Each one stands between a button and something that cannot
 * be undone, and each exists for a firm that would otherwise be left in a
 * state nobody can repair from inside: without any user, or without any
 * administrator.
 */

/**
 * May this user delete their own account? Throws the refusal, returns
 * nothing on success.
 *
 *  · The operator's own account never goes this way: it is the account the
 *    platform is run from, and it is created and removed by script.
 *  · The LAST user of the firm cannot delete only their user: the firm would
 *    stay behind with its data and nobody to open it. The right door is
 *    «Eliminar la firma y todos sus datos».
 *  · The last ADMINISTRATOR, while other users remain, cannot leave either:
 *    nobody could add users, pay or delete the firm afterwards.
 */
export const validarBorradoDePropioUsuario = (input: {
  role: FirmUserRole;
  totalUsuarios: number;
  totalAdministradores: number;
}): void => {
  if (input.role === 'SUPER_ADMIN') {
    throw new AuthError(
      'FORBIDDEN',
      'La cuenta de operación no se elimina desde la aplicación.',
      403
    );
  }
  if (input.totalUsuarios <= 1) {
    throw new AuthError(
      'LAST_USER',
      'Es el único usuario de la firma. Para irse del todo, use «Eliminar la firma y todos sus datos».',
      409
    );
  }
  if (input.role === 'FIRM_ADMIN' && input.totalAdministradores <= 1) {
    throw new AuthError('LAST_ADMIN', 'Nombre otro administrador antes de eliminar su usuario.', 409);
  }
};

/**
 * May this user delete the whole firm, and did they type its name?
 *
 * Exact, case-sensitive, after trimming the ends: the point is that the
 * administrator read the name and typed it, not that a keyboard added a
 * space. Same rule the operator's console applies.
 */
export const validarBorradoDeFirmaPropia = (input: {
  role: FirmUserRole;
  nombreDeLaFirma: string;
  confirmacion: unknown;
}): void => {
  if (input.role !== 'FIRM_ADMIN') {
    throw new AuthError(
      'FORBIDDEN',
      'Solo el socio administrador puede eliminar la firma.',
      403
    );
  }
  const escrito = typeof input.confirmacion === 'string' ? input.confirmacion.trim() : '';
  if (!escrito || escrito !== input.nombreDeLaFirma.trim()) {
    throw new AuthError(
      'CONFIRMATION_MISMATCH',
      'El nombre escrito no coincide con el de la firma. Escríbalo exactamente como aparece.',
      400
    );
  }
};

/** The password field, as typed: never trimmed, never empty. */
export const leerContrasena = (raw: unknown): string => {
  const contrasena = typeof raw === 'string' ? raw : '';
  if (!contrasena) {
    throw new AuthError('PASSWORD_REQUIRED', 'Escriba su contraseña para confirmar.', 400);
  }
  return contrasena;
};
