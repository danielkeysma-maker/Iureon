import { Router } from 'express';
import { bloquearSiPlanVencido } from '../subscriptions/planVigente.middleware';
import { getBrandingController, putBrandingController } from './branding.controller';

const router = Router();

router.get('/firm/branding', getBrandingController as any);
router.put('/firm/branding', bloquearSiPlanVencido, putBrandingController as any);

export const brandingRoutes = router;
