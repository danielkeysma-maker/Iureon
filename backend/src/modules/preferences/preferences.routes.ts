import { Router } from 'express';
import { getPreferencesController, putPreferencesController } from './preferences.controller';

/** Detrás de `authMiddleware`: la identidad sale del token, nunca del cuerpo. */
const router = Router();
router.get('/preferences', getPreferencesController as any);
router.put('/preferences', putPreferencesController as any);

export const preferencesRoutes = router;
