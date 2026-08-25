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
