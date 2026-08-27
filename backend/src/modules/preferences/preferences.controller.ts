import { Request, Response } from 'express';
import { guardar, leer } from './preferences.service';

/**
 * GET  /api/preferences   → las de quien llama
 * PUT  /api/preferences   { theme, uiFont, density }
 *
 * Nunca de otra persona: el correo sale del token verificado y no del cuerpo.
 * Aceptar un `userEmail` del cliente convertiría un ajuste inocuo en una forma
 * de escribir sobre la sesión de un compañero de firma.
 */
const identidad = (req: Request, res: Response): { firmId: string; userEmail: string } | null => {
  const firmId = req.firmId;
  const userEmail = req.user?.email;

  if (!firmId || !userEmail) {
    res.status(401).json({ success: false, error: 'UNAUTHORIZED', message: 'Se requiere una sesión.' });
    return null;
  }

  return { firmId, userEmail };
};

export const getPreferencesController = async (req: Request, res: Response): Promise<void> => {
  const quien = identidad(req, res);
  if (!quien) return;

  res.json({ success: true, preferences: await leer(quien.firmId, quien.userEmail) });
};

export const putPreferencesController = async (req: Request, res: Response): Promise<void> => {
  const quien = identidad(req, res);
  if (!quien) return;

  res.json({
    success: true,
    preferences: await guardar(quien.firmId, quien.userEmail, req.body)
  });
};
