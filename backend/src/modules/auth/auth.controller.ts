import { Request, Response } from 'express';
import {
  AuthError,
  addUserToFirm,
  firmProfile,
  refreshSession,
  signIn,
  type FirmUserRole
} from './auth.service';

/** Turns a thrown AuthError into its own status; anything else is a 500. */
const fail = (res: Response, err: unknown, fallback: string): void => {
  if (err instanceof AuthError) {
    res.status(err.status).json({ success: false, error: err.code, message: err.message });
    return;
  }

  console.error('[AUTH] Error inesperado:', err);
  res.status(500).json({ success: false, error: 'AUTH_FAILED', message: fallback });
};

const readCredentials = (req: Request) => ({
  email: typeof req.body.email === 'string' ? req.body.email : '',
  password: typeof req.body.password === 'string' ? req.body.password : ''
});

/** POST /api/auth/login — public by necessity. */
export const loginController = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = readCredentials(req);

  if (!email || !password) {
    res.status(400).json({
      success: false,
      error: 'MISSING_CREDENTIALS',
      message: 'Se requieren correo y contraseña.'
    });
    return;
  }

  try {
    res.json({ success: true, session: await signIn(email, password) });
  } catch (err) {
    fail(res, err, 'No se pudo iniciar sesión.');
  }
};

/** POST /api/auth/refresh — public, because an expired access token cannot pass the middleware. */
export const refreshController = async (req: Request, res: Response): Promise<void> => {
  const refreshToken = typeof req.body.refreshToken === 'string' ? req.body.refreshToken : '';

  if (!refreshToken) {
    res.status(400).json({
      success: false,
      error: 'MISSING_REFRESH_TOKEN',
      message: 'Se requiere el token de refresco.'
    });
    return;
  }

  try {
    res.json({ success: true, session: await refreshSession(refreshToken) });
  } catch (err) {
    fail(res, err, 'No se pudo renovar la sesión.');
  }
};

/** GET /api/auth/me — who the token says you are, and which firm it binds you to. */
export const meController = async (req: Request, res: Response): Promise<void> => {
  res.json({
    success: true,
    user: req.user,
    firm: await firmProfile(req.firmId as string)
  });
};

/**
 * POST /api/auth/users — adds a lawyer to the CALLER'S firm.
 *
 * Restricted to administrators, and the firm is taken from the session. A body
 * that named its own firm would be the header defect again, at the one endpoint
 * that decides who belongs where.
 */
export const addUserController = async (req: Request, res: Response): Promise<void> => {
  if (req.user?.role !== 'FIRM_ADMIN' && req.user?.role !== 'SUPER_ADMIN') {
    res.status(403).json({
      success: false,
      error: 'FORBIDDEN',
      message: 'Solo un administrador de la firma puede agregar usuarios.'
    });
    return;
  }

  const { email, password } = readCredentials(req);
  const requested = req.body.role;
  // Never SUPER_ADMIN from a request body: that role exists to cross firms, and
  // handing it out through an endpoint would make the boundary optional again.
  const role: FirmUserRole = requested === 'FIRM_ADMIN' ? 'FIRM_ADMIN' : 'LAWYER';

  if (!email || !password) {
    res.status(400).json({
      success: false,
      error: 'MISSING_CREDENTIALS',
      message: 'Se requieren correo y contraseña para la nueva cuenta.'
    });
    return;
  }

  try {
    const user = await addUserToFirm(req.firmId as string, { email, password, role });
    res.status(201).json({ success: true, user: { ...user, role } });
  } catch (err) {
    fail(res, err, 'No se pudo crear la cuenta.');
  }
};
