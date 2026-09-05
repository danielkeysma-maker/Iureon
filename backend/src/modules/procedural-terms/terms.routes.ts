import { Router } from 'express';
import { bloquearSiPlanVencido } from '../subscriptions/planVigente.middleware';
import { calculateTermsController } from './terms.controller';

const router = Router();

router.post('/terms/calculate', bloquearSiPlanVencido, calculateTermsController);

export const proceduralTermsRoutes = router;
