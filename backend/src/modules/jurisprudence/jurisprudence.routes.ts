import { Router } from 'express';
import { rulingController } from './jurisprudence.controller';

/** Sentencias traídas del sitio oficial. Detrás de la sesión. */
const router = Router();
router.get('/jurisprudence/ruling', rulingController as any);
export const jurisprudenceRoutes = router;
