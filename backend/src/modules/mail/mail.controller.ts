import { Request, Response } from 'express';
import { correoDePrueba, estadoDelCorreo } from './mail.service';

/**
 * Las dos rutas de correo de la consola de operación. Cuelgan de `/api/admin`,
 * detrás de `requireSuperAdmin`: mandar correos desde la cuenta del titular es
 * un poder del operador, no de una firma.
 */

/** `GET /api/admin/mail/status` — si hay correo saliente y desde qué cuenta (enmascarada). */
export const mailStatusController = (_req: Request, res: Response): void => {
  res.json({ success: true, ...estadoDelCorreo() });
};

/**
 * `POST /api/admin/mail/test` — un mensaje de prueba AL PROPIO OPERADOR.
 *
 * El destinatario sale del token y no del cuerpo a propósito: un endpoint que
 * manda correos a la dirección que le pidan es una herramienta de spam con
 * remitente propio, aunque esté detrás de un guardián.
 */
export const mailTestController = async (req: Request, res: Response): Promise<void> => {
  const para = req.user?.email;
  if (!para) {
    res.status(400).json({ success: false, error: 'NO_EMAIL', message: 'La sesión no tiene correo.' });
    return;
  }

  const resultado = await correoDePrueba(para);
  res.status(resultado.enviado ? 200 : 502).json({ success: resultado.enviado, ...resultado });
};
