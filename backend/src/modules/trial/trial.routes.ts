import { Router } from 'express';
import { pruebaGratuitaController } from './trial.controller';

/**
 * Mounted BEFORE `authMiddleware` in index.ts: a visitor asking for a trial
 * has no session, and behind the middleware the endpoint would answer 401 to
 * exactly the people it exists for. Under `/public/` so the path itself says
 * so to whoever reads the route table.
 */
const publicRouter = Router();

/*
 * Two paths, one controller. `/registro` is what the app calls (trial or
 * purchase, by `modo`); `/prueba-gratuita` stays because it is the path the
 * first trial form shipped with, and a tab opened before this deploy still
 * posts there.
 */
publicRouter.post('/public/registro', pruebaGratuitaController as any);
publicRouter.post('/public/prueba-gratuita', pruebaGratuitaController as any);

export const trialPublicRoutes = publicRouter;
