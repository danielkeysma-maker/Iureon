import { Request, Response } from 'express';
import { callerIp } from '../admin/admin.middleware';
import { AuthError } from './auth.service';
import { MENSAJE_NEUTRAL, MINUTOS_DE_VIGENCIA_DEL_ENLACE, describirError, esperaRestante } from './recuperacion.rules';
import { restablecerContrasena, solicitarRecuperacion } from './recuperacion.service';

/**
 * Las dos rutas públicas de la recuperación de contraseña. Montadas antes del
 * middleware de sesión (`auth.routes.ts`, `publicRouter`): quien olvidó la
 * contraseña no tiene sesión, y quien abre el enlace tampoco.
 */

const esperar = (ms: number) => new Promise<void>((resolver) => setTimeout(resolver, ms));

/**
 * `POST /api/auth/recuperar` — cuerpo `{ email }`.
 *
 * Responde 200 con `MENSAJE_NEUTRAL` exista o no la cuenta, y SIEMPRE después
 * del piso de tiempo. Los únicos otros desenlaces no dependen de la cuenta:
 * 400 formato de correo · 429 límite por dirección IP · 503 servicio no
 * disponible (tabla del límite, correo saliente o Supabase caídos).
 *
 * Un error inesperado responde también lo neutral: podría haber ocurrido solo
 * con cuentas que existen, y un 500 para ellas sería la confirmación.
 */
export const recuperarController = async (req: Request, res: Response): Promise<void> => {
  const inicio = Date.now();
  const origen = typeof req.headers.origin === 'string' ? req.headers.origin : undefined;

  try {
    await solicitarRecuperacion({ correo: req.body?.email, ip: callerIp(req), origen });
  } catch (err) {
    if (err instanceof AuthError) {
      if (err.status !== 400) await esperar(esperaRestante(inicio, Date.now()));
      res.status(err.status).json({ success: false, error: err.code, message: err.message });
      return;
    }
    console.error(`[RECUPERACION] Error inesperado al pedir el enlace: ${describirError(err)}`);
  }

  await esperar(esperaRestante(inicio, Date.now()));
  res.json({ success: true, message: MENSAJE_NEUTRAL, minutosDeVigencia: MINUTOS_DE_VIGENCIA_DEL_ENLACE });
};

/**
 * `POST /api/auth/restablecer` — cuerpo `{ token_hash, password }`, o
 * `Authorization: Bearer <access_token de recuperación>` + `{ password }` en la
 * vía de respaldo.
 *
 * 200 `{ sesionesCerradas }` · 400 CONTRASENA_INVALIDA | CONTRASENA_RECHAZADA |
 * FALTA_ENLACE · 410 ENLACE_INVALIDO (vencido, usado, inventado o de cuenta
 * desactivada: una sola frase) · 429 · 502 · 503.
 */
export const restablecerController = async (req: Request, res: Response): Promise<void> => {
  const cuerpo = (req.body ?? {}) as Record<string, unknown>;
  const tokenHash =
    typeof cuerpo.token_hash === 'string' && cuerpo.token_hash.trim() ? cuerpo.token_hash.trim() : undefined;

  const autorizacion = req.headers.authorization;
  const accessToken =
    typeof autorizacion === 'string' && autorizacion.startsWith('Bearer ')
      ? autorizacion.slice('Bearer '.length).trim() || undefined
      : undefined;

  try {
    const { sesionesCerradas } = await restablecerContrasena({
      tokenHash,
      accessToken,
      contrasena: cuerpo.password,
      ip: callerIp(req)
    });
    res.json({ success: true, sesionesCerradas });
  } catch (err) {
    if (err instanceof AuthError) {
      res.status(err.status).json({ success: false, error: err.code, message: err.message });
      return;
    }
    console.error(`[RECUPERACION] Error inesperado al restablecer: ${describirError(err)}`);
    res.status(500).json({
      success: false,
      error: 'RESTABLECIMIENTO_FALLIDO',
      message: 'No se pudo guardar la contraseña nueva. Pida otro enlace.'
    });
  }
};
