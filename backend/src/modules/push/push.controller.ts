import { Request, Response } from 'express';
import { callerIp } from '../admin/admin.middleware';
import {
  PushError,
  cancelar,
  contarDelUsuario,
  enviarPrueba,
  llavePublica,
  pushHabilitado,
  suscribir
} from './push.service';

/**
 * Avisos por Web Push: el navegador se registra, se da de baja y se prueba.
 *
 * Todo cuelga de `/api` detrás de `authMiddleware`, sin filtro de rol: el
 * operador de la plataforma también se suscribe por aquí, y su ROL —que sale
 * del token, no del cuerpo— es lo que después permite avisarle a él y no a
 * la firma que su sesión tenga activa.
 */

const responder = (res: Response, error: unknown): void => {
  if (error instanceof PushError) {
    res.status(error.status).json({ error: error.code, message: error.message });
    return;
  }
  const mensaje = error instanceof Error ? error.message : 'Error inesperado.';
  res.status(500).json({ error: 'PUSH_ERROR', message: mensaje });
};

const sesion = (req: Request, res: Response): { firmId: string; email: string; role: string } | null => {
  const firmId = req.firmId;
  const email = req.user?.email;
  const role = req.user?.role;
  if (!firmId || !email || !role) {
    res.status(401).json({ error: 'UNAUTHORIZED', message: 'Se requiere sesión autenticada.' });
    return null;
  }
  return { firmId, email, role };
};

/** `GET /api/push/public-key` — la llave VAPID pública, o `enabled: false` si el servidor no tiene llaves. */
export const llavePublicaController = (_req: Request, res: Response): void => {
  res.json({ success: true, enabled: pushHabilitado(), publicKey: pushHabilitado() ? llavePublica() : '' });
};

/** `GET /api/push/status` — si el servidor puede avisar y cuántos dispositivos tiene registrados este usuario. */
export const estadoController = async (req: Request, res: Response): Promise<void> => {
  try {
    const s = sesion(req, res);
    if (!s) return;
    const suscripcionesDelUsuario = await contarDelUsuario(s.email);
    res.json({ success: true, enabled: pushHabilitado(), suscripcionesDelUsuario });
  } catch (error) {
    responder(res, error);
  }
};

/** `POST /api/push/subscribe { subscription }` — registra este navegador. */
export const suscribirController = async (req: Request, res: Response): Promise<void> => {
  try {
    const s = sesion(req, res);
    if (!s) return;
    await suscribir({
      firmId: s.firmId,
      userEmail: s.email,
      role: s.role,
      subscription: req.body?.subscription,
      userAgent: typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : null,
      ipAddress: callerIp(req)
    });
    res.status(201).json({ success: true });
  } catch (error) {
    responder(res, error);
  }
};

/** `POST /api/push/unsubscribe { endpoint }` — borra este navegador. */
export const cancelarController = async (req: Request, res: Response): Promise<void> => {
  try {
    const s = sesion(req, res);
    if (!s) return;
    await cancelar({
      endpoint: typeof req.body?.endpoint === 'string' ? req.body.endpoint : '',
      userEmail: s.email,
      firmId: s.firmId,
      ipAddress: callerIp(req)
    });
    res.json({ success: true });
  } catch (error) {
    responder(res, error);
  }
};

/** `POST /api/push/test` — un aviso a los propios dispositivos. Se espera el envío antes de responder. */
export const pruebaController = async (req: Request, res: Response): Promise<void> => {
  try {
    const s = sesion(req, res);
    if (!s) return;
    const resultado = await enviarPrueba({ userEmail: s.email });
    res.json({ success: true, ...resultado });
  } catch (error) {
    responder(res, error);
  }
};
