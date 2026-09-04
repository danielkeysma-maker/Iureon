import { Request, Response } from 'express';
import { consumoDelMesPorUsuario } from '../billing/billing.service';
import {
  AuthError,
  addUserToFirm,
  listFirmUsers,
  setUserActive,
  setUserRole,
  firmProfile,
  refreshSession,
  signIn,
  type FirmUserRole
} from './auth.service';
import { exigirCupoDeUsuario, responderPlanError } from '../subscriptions/plan.service';

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


/** Solo administradores: la gestion de usuarios es de socios. */
const soloAdmin = (req: Request, res: Response): boolean => {
  if (req.user?.role !== 'FIRM_ADMIN' && req.user?.role !== 'SUPER_ADMIN') {
    res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'La gestión de usuarios es de los administradores de la firma.' });
    return false;
  }
  return true;
};

/** GET /auth/users — los usuarios de la firma, con su consumo del mes. */
export const listUsersController = async (req: Request, res: Response): Promise<void> => {
  if (!soloAdmin(req, res)) return;

  try {
    const [usuarios, consumo] = await Promise.all([
      listFirmUsers(req.firmId as string),
      consumoDelMesPorUsuario(req.firmId as string).catch(() => ({} as Record<string, number>))
    ]);

    res.json({
      success: true,
      users: usuarios.map((u) => ({ ...u, consumoMesCop: consumo[u.email] ?? 0 }))
    });
  } catch (err) {
    fail(res, err, 'No se pudieron listar los usuarios.');
  }
};

/** PATCH /auth/users/:id/estado — desactiva o reactiva. Nada se borra. */
export const setUserActiveController = async (req: Request, res: Response): Promise<void> => {
  if (!soloAdmin(req, res)) return;

  const activo = req.body?.activo;
  if (typeof activo !== 'boolean') {
    res.status(400).json({ success: false, error: 'BAD_REQUEST', message: 'Se requiere el campo activo (true/false).' });
    return;
  }

  try {
    await setUserActive(req.firmId as string, String(req.params.id), activo, req.user?.email ?? '');
    res.json({ success: true });
  } catch (err) {
    fail(res, err, 'No se pudo cambiar el estado.');
  }
};

/** PATCH /auth/users/:id/rol — FIRM_ADMIN o LAWYER, nunca SUPER_ADMIN. */
export const setUserRoleController = async (req: Request, res: Response): Promise<void> => {
  if (!soloAdmin(req, res)) return;

  const role = req.body?.role;
  if (role !== 'FIRM_ADMIN' && role !== 'LAWYER') {
    res.status(400).json({ success: false, error: 'BAD_REQUEST', message: 'El rol debe ser FIRM_ADMIN o LAWYER.' });
    return;
  }

  try {
    await setUserRole(req.firmId as string, String(req.params.id), role, req.user?.email ?? '');
    res.json({ success: true });
  } catch (err) {
    fail(res, err, 'No se pudo cambiar el rol.');
  }
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
    /*
     * THE PLAN'S USER CAP, enforced where accounts are actually created.
     * ESENCIAL admits one account and PREMIUM five; the 409 says which plan
     * lifts the limit. The platform's own firm is exempt: the operator's
     * accounts are not a client's seats.
     */
    if (req.user?.role !== 'SUPER_ADMIN') {
      await exigirCupoDeUsuario(req.firmId as string);
    }

    const user = await addUserToFirm(req.firmId as string, { email, password, role });
    res.status(201).json({ success: true, user: { ...user, role } });
  } catch (err) {
    if (responderPlanError(res, err)) return;
    fail(res, err, 'No se pudo crear la cuenta.');
  }
};
