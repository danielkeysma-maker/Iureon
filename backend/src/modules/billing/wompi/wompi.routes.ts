import { Router } from 'express';
import {
  rechargesController,
  startRechargeController,
  wompiEventsController
} from './wompi.controller';

/**
 * TWO ROUTERS, AND THE SPLIT IS THE SECURITY BOUNDARY.
 *
 * Wompi calls the webhook with no session and no token, so it has to be mounted
 * before the tenant middleware. Starting a recharge is the opposite: it must
 * know which firm is paying, and the only trustworthy source for that is the
 * verified token — a firm id in the body would let any lawyer top up, or
 * inspect, an account that is not theirs.
 *
 * Kept in one file so the two halves stay visibly different rather than
 * accidentally similar.
 */

/** Public: Wompi's own callback, authenticated by checksum rather than session. */
const publicRouter = Router();
publicRouter.post('/billing/wompi/events', wompiEventsController as any);
export const wompiPublicRoutes = publicRouter;

/** Behind the session: a firm starting and reviewing its own recharges. */
const router = Router();
router.post('/billing/recharge', startRechargeController as any);
router.get('/billing/recharges', rechargesController as any);
export const wompiRoutes = router;
