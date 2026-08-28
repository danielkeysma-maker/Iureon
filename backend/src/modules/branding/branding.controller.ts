import { Request, Response } from 'express';
import { leerMarca, guardarMarca, MARCA_POR_DEFECTO } from './branding.service';

/** GET /api/firm/branding — la marca de la firma, o la de defecto si nunca se configuró. */
export const getBrandingController = async (req: Request, res: Response): Promise<void> => {
  const firmId = req.firmId;
  if (!firmId) {
    res.status(401).json({ success: false, error: 'UNAUTHORIZED', message: 'Se requiere una firma autenticada.' });
    return;
  }

  const marca = await leerMarca(firmId);
  res.json({ success: true, branding: marca ?? MARCA_POR_DEFECTO, configurada: marca !== null });
};

/** PUT /api/firm/branding — guarda la marca saneada y devuelve lo que quedó. */
export const putBrandingController = async (req: Request, res: Response): Promise<void> => {
  const firmId = req.firmId;
  if (!firmId) {
    res.status(401).json({ success: false, error: 'UNAUTHORIZED', message: 'Se requiere una firma autenticada.' });
    return;
  }

  const guardada = await guardarMarca(firmId, req.body);
  if (!guardada) {
    res.status(502).json({ success: false, error: 'BRANDING_SAVE_FAILED', message: 'No se pudo guardar la marca de la firma.' });
    return;
  }
  res.json({ success: true, branding: guardada });
};
