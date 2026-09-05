import { Router } from 'express';
import { bloquearSiPlanVencido } from '../subscriptions/planVigente.middleware';
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
router.post('/tools/indexacion', bloquearSiPlanVencido, indexacionController);
router.post('/tools/intereses', bloquearSiPlanVencido, interesesController);
router.post('/tools/cuantia', bloquearSiPlanVencido, cuantiaController);
router.get('/tools/calendario', calendarioController);

export const toolsRoutes = router;
