import { Router, type Request, type Response } from 'express';
import { listarLecturas, marcarLectura } from './manualReads.service';

/**
 * El registro de lectura del manual. Artboard 9a.
 *
 * Va bajo `/api` tras `authMiddleware`, y la firma y el correo salen SIEMPRE
 * del token: si llegaran por el cuerpo, cualquiera podría marcar artículos como
 * leídos a nombre de otro — que es justamente la afirmación sobre la que un
 * socio va a decidir permisos de curaduría.
 */
const router = Router();

router.get('/manual/lecturas', async (req: Request, res: Response) => {
  try {
    const firmId = req.firmId;
    const correo = req.user?.email;
    if (!firmId || !correo) {
      res.status(401).json({ error: 'UNAUTHORIZED' });
      return;
    }
    res.json({ success: true, lecturas: await listarLecturas(firmId, correo) });
  } catch (error: unknown) {
    res.status(500).json({
      error: 'MANUAL_READS_ERROR',
      message: error instanceof Error ? error.message : 'No se pudo leer el registro.'
    });
  }
});

router.post('/manual/lecturas', async (req: Request, res: Response) => {
  try {
    const firmId = req.firmId;
    const correo = req.user?.email;
    if (!firmId || !correo) {
      res.status(401).json({ error: 'UNAUTHORIZED' });
      return;
    }

    const { articleId, leido } = req.body ?? {};
    if (typeof articleId !== 'string' || !articleId) {
      res.status(400).json({ error: 'ARTICLE_REQUIRED', message: 'Falta el artículo.' });
      return;
    }

    await marcarLectura(firmId, correo, articleId, leido !== false);
    res.json({ success: true });
  } catch (error: unknown) {
    res.status(500).json({
      error: 'MANUAL_READS_ERROR',
      message: error instanceof Error ? error.message : 'No se pudo registrar.'
    });
  }
});

export const manualReadsRoutes = router;
