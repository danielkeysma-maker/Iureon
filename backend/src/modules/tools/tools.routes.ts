import { Router } from 'express';
import {
  calendarioController,
  cuantiaController,
  indexacionController,
  interesesController,
  parametrosController
} from './tools.controller';

/** Mounted under /api behind authMiddleware in index.ts, like the other calculators. */
const router = Router();

router.get('/tools/parametros', parametrosController);
router.post('/tools/indexacion', indexacionController);
router.post('/tools/intereses', interesesController);
router.post('/tools/cuantia', cuantiaController);
router.get('/tools/calendario', calendarioController);

export const toolsRoutes = router;
