import { Router } from 'express';
import { bloquearSiPlanVencido } from '../subscriptions/planVigente.middleware';
import {
  disciplinariaController,
  discoverController,
  indexRulingsController,
  rulingController
} from './jurisprudence.controller';

/** Sentencias traídas del sitio oficial. Detrás de la sesión. */
const router = Router();
router.get('/jurisprudence/ruling', rulingController as any);
router.get('/jurisprudence/discover', discoverController as any);
router.get('/jurisprudence/disciplinaria', disciplinariaController as any);
router.post('/jurisprudence/index', bloquearSiPlanVencido, indexRulingsController as any);
export const jurisprudenceRoutes = router;
