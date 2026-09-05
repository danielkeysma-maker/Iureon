import { Request, Response } from 'express';
import { AuthError } from '../auth/auth.service';
import { callerIp } from '../admin/admin.middleware';
import { leerSolicitud, validarSolicitud } from './trial.rules';
import { registrarFirma } from './trial.service';

/**
 * POST /api/public/registro (alias: /api/public/prueba-gratuita) — public by
 * necessity: the caller has no account yet, and getting one is the point.
 *
 * Body: { modo?: 'PRUEBA'|'COMPRA', plan?: 'ESENCIAL'|'PREMIUM'|'FIRMA',
 *         firma, nit?, nombre, correo, contrasena, acepta: true, empresa?: '' }
 *   modo defaults to PRUEBA and plan to ESENCIAL; PRUEBA admits only ESENCIAL.
 * Answers: 201 { success, session, venceEl, modo, plan } · 400 INVALID_INPUT |
 *          INVALID_PLAN · 409 EMAIL_EXISTS · 429 TOO_MANY_TRIALS ·
 *          503 TRIAL_UNAVAILABLE
 */
export const pruebaGratuitaController = async (req: Request, res: Response): Promise<void> => {
  const validacion = validarSolicitud(leerSolicitud(req.body));

  if (!validacion.ok) {
    // HONEYPOT and INVALID_INPUT share the wire code on purpose: see trial.rules.
    const error = validacion.codigo === 'INVALID_PLAN' ? 'INVALID_PLAN' : 'INVALID_INPUT';
    res.status(400).json({ success: false, error, message: validacion.mensaje });
    return;
  }

  try {
    const abierta = await registrarFirma(validacion.datos, callerIp(req));
    res.status(201).json({
      success: true,
      session: abierta.session,
      venceEl: abierta.venceEl,
      modo: validacion.datos.modo,
      plan: validacion.datos.plan
    });
  } catch (err) {
    if (err instanceof AuthError) {
      const message =
        err.code === 'EMAIL_EXISTS'
          ? 'Ese correo ya tiene cuenta en Iureon; inicie sesión con él.'
          : err.message;
      res.status(err.status).json({ success: false, error: err.code, message });
      return;
    }
    console.error('[TRIAL] Error inesperado:', err);
    res.status(500).json({ success: false, error: 'TRIAL_FAILED', message: 'No se pudo crear la cuenta.' });
  }
};
