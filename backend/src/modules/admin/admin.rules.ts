import { AuthError } from '../auth/auth.service';
import { MIN_CONTRASENA } from '../trial/trial.rules';

/**
 * The pure rules behind the two support actions of the operator console:
 * deleting a firm whole, and resetting a user's password.
 *
 * Kept free of the database on purpose so `reglas.check.ts` can prove them
 * against fixed inputs. They are the substance of both actions: a delete that
 * skipped the name confirmation, or that accepted the operator's own firm,
 * would be an irreversible mistake one click away.
 */

/** The firm whose id is the shared public law corpus. Never a tenant, never deletable. */
export const CORPUS_COMPARTIDO = 'SYSTEM_CORPUS';

/** Same floor as the public trial: the operator hands this password over by hand. */
export const MIN_CONTRASENA_OPERADOR = MIN_CONTRASENA;

/** Shortest reason that can cite who authorised the deletion and when. */
export const MIN_MOTIVO_BORRADO = 10;

/** Collapses whitespace so a padded field cannot clear a length check. */
const normalizar = (raw: unknown): string =>
  typeof raw === 'string' ? raw.replace(/\s+/g, ' ').trim() : '';

/**
 * Validates a request to delete a firm. Returns the normalised reason.
 *
 * ORDER MATTERS FOR THE MESSAGE, not for safety: every rule is checked, but the
 * first failure is the one reported, and the operator's own firm is refused
 * before anything else because no reason and no typed name make it acceptable.
 */
export const validarBorradoDeFirma = (input: {
  firmId: string;
  firmIdDelOperador: string;
  nombreDeLaFirma: string;
  confirmacion: unknown;
  motivo: unknown;
}): string => {
  if (input.firmId === input.firmIdDelOperador) {
    throw new AuthError(
      'SELF_DELETE',
      'No puede eliminar su propia firma desde la consola: se quedaría sin la cuenta con la que está operando.',
      400
    );
  }
  if (input.firmId === CORPUS_COMPARTIDO) {
    throw new AuthError('PROTECTED_FIRM', 'SYSTEM_CORPUS es el corpus público compartido, no una firma.', 400);
  }

  const motivo = normalizar(input.motivo);
  if (motivo.length < MIN_MOTIVO_BORRADO) {
    throw new AuthError(
      'REASON_REQUIRED',
      `Escriba el motivo (al menos ${MIN_MOTIVO_BORRADO} caracteres): quién autorizó el borrado y cuándo.`,
      400
    );
  }

  // Exact, case-sensitive, after trimming the ends: the point is that the
  // operator read the name and typed it, not that a keyboard added a space.
  const escrito = typeof input.confirmacion === 'string' ? input.confirmacion.trim() : '';
  if (!escrito || escrito !== input.nombreDeLaFirma.trim()) {
    throw new AuthError(
      'CONFIRMATION_MISMATCH',
      'El nombre escrito no coincide con el de la firma. Escríbalo exactamente como aparece.',
      400
    );
  }

  return motivo;
};

/** Validates the password the operator sets by hand. Returns it untouched. */
export const validarContrasenaDeOperador = (raw: unknown): string => {
  const contrasena = typeof raw === 'string' ? raw : '';
  // No trim: a password is whatever was typed. Spaces at the ends would be
  // silently removed here and kept by the operator's clipboard.
  if (contrasena.length < MIN_CONTRASENA_OPERADOR) {
    throw new AuthError(
      'WEAK_PASSWORD',
      `La contraseña debe tener al menos ${MIN_CONTRASENA_OPERADOR} caracteres.`,
      400
    );
  }
  return contrasena;
};
