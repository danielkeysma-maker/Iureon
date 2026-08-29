import { Request, Response } from 'express';
import { leerCatalogoMaestro } from './catalogMaster.service';

/**
 * `GET /api/admin/catalog-master` — el maestro visto desde operación. 8b.
 *
 * Cuelga del router de admin, que ya lleva `requireSuperAdmin` aplicado al
 * router entero: una ruta que agrega datos de TODAS las firmas queda protegida
 * por estar aquí, no por que alguien recordara el guardián.
 */
export const catalogMasterController = async (_req: Request, res: Response): Promise<void> => {
  try {
    const maestro = await leerCatalogoMaestro();
    res.json({ success: true, maestro });
  } catch (error: unknown) {
    res.status(500).json({
      error: 'CATALOG_MASTER_ERROR',
      message: error instanceof Error ? error.message : 'No se pudo leer el catálogo maestro.'
    });
  }
};
