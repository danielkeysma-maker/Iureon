import { Router } from 'express';
import { getBrandingController, putBrandingController } from './branding.controller';

const router = Router();

router.get('/firm/branding', getBrandingController as any);
router.put('/firm/branding', putBrandingController as any);

export const brandingRoutes = router;
