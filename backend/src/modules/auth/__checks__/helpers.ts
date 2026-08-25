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
