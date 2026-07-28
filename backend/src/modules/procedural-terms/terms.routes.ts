import { Router } from 'express';
import { calculateTermsController } from './terms.controller';

const router = Router();

router.post('/terms/calculate', calculateTermsController);

export const proceduralTermsRoutes = router;
