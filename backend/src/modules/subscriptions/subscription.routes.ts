import { Router } from 'express';
import {
  checkoutController,
  firmUsersController,
  paymentsController,
  planController,
  pruebaGratuitaFirmaController
} from './subscription.controller';

/*
 * Behind the session, at /api. The webhook that confirms a plan payment is
 * Wompi's own (`/billing/wompi/events`, public, verified by checksum) and
 * branches on the intent's purpose — there is no second callback here.
 */
const router = Router();

router.get('/subscription/plan', planController as any);
router.post('/subscription/checkout', checkoutController as any);
/*
 * No `bloquearSiPlanVencido` here, nor on checkout: both exist for a firm
 * whose plan is expired — the one born through «Contratar» that has not paid.
 */
router.post('/subscription/prueba-gratuita', pruebaGratuitaFirmaController as any);
router.get('/subscription/payments', paymentsController as any);
router.get('/subscription/firm-users', firmUsersController as any);

export const subscriptionRoutes = router;
