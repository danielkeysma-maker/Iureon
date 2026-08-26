import { Router } from 'express';
import { billingMovementsController, billingSummaryController } from './billing.controller';

/** A firm's own balance and its movements. Behind the session middleware. */
const router = Router();

router.get('/billing/summary', billingSummaryController as any);
router.get('/billing/movements', billingMovementsController as any);

export const billingRoutes = router;
