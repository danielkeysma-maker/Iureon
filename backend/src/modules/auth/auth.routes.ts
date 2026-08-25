import { Router } from 'express';
import {
  addUserController,
  loginController,
  meController,
  refreshController,
  registerFirmController
} from './auth.controller';

/**
 * The three endpoints that must live BEFORE the session middleware, because a
 * caller who has no session yet cannot pass it: signing in, registering a firm,
 * and trading an expired access token for a fresh one.
 *
 * Kept in their own router so the ordering is a fact of the file rather than a
 * comment in index.ts that a later edit can quietly break.
 */
const publicRouter = Router();

publicRouter.post('/auth/login', loginController as any);
publicRouter.post('/auth/register-firm', registerFirmController as any);
publicRouter.post('/auth/refresh', refreshController as any);

export const authPublicRoutes = publicRouter;

/** Everything that needs to know who is asking. */
const router = Router();

router.get('/auth/me', meController as any);
router.post('/auth/users', addUserController as any);

export const authRoutes = router;
