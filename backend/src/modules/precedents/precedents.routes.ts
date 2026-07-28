import { Router } from 'express';
import { getPrecedentsAnalyticsController } from './precedents.controller';

const router = Router();

// Endpoint de analítica de precedentes concedidos vs. negados
router.get('/precedents/analytics', getPrecedentsAnalyticsController);

export const precedentsRoutes = router;
