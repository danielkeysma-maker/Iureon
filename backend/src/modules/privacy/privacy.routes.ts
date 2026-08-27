import { Router } from 'express';
import { subprocessorsController } from './privacy.controller';

/** The firm's register of subencargados. Behind the session middleware. */
const router = Router();
router.get('/privacy/subprocessors', subprocessorsController as any);
export const privacyRoutes = router;
