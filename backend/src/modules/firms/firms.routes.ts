import { Router } from 'express';
import { eliminarMiFirmaController } from './firms.controller';

/**
 * The firm acting on ITSELF. Mounted under the session middleware and on
 * purpose without `bloquearSiPlanVencido`: taking one's data away must work
 * exactly when the plan has run out.
 */
const router = Router();

router.delete('/firms/me', eliminarMiFirmaController as any);

export const firmsRoutes = router;
