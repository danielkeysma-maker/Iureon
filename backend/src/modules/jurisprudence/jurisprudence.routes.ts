import { Router } from 'express';
import { discoverController, rulingController } from './jurisprudence.controller';

/** Sentencias traídas del sitio oficial. Detrás de la sesión. */
const router = Router();
router.get('/jurisprudence/ruling', rulingController as any);
router.get('/jurisprudence/discover', discoverController as any);
export const jurisprudenceRoutes = router;
