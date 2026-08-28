import { Router } from 'express';
import { requireSuperAdmin } from './admin.middleware';
import {
  addCreditsController,
  addUserController,
  createFirmController,
  firmDetailController,
  listFirmsController,
  updateFirmController
,
  runwayController} from './admin.controller';

/**
 * The operator console, gated as a whole.
 *
 * `requireSuperAdmin` is applied to the router rather than to each handler on
 * purpose: a route added later is protected by existing, not by somebody
 * remembering. These endpoints cross the tenant boundary, so a forgotten guard
 * would be the worst possible omission.
 *
 * MOUNTED AT ITS OWN PREFIX, AND THAT IS NOT COSMETIC. `router.use(guard)` runs
 * for every request that reaches the router, not only the ones whose path
 * matches a route in it. Mounted at `/api` alongside the other modules, this
 * guard answered 403 to every ordinary lawyer on every endpoint — the audit
 * screen went blank in a test and that is what it turned out to mean. Under
 * `/api/admin` it can only ever see requests that are already asking for the
 * console.
 */
const router = Router();

router.use(requireSuperAdmin);

router.get('/runway', runwayController as any);
router.get('/firms', listFirmsController as any);
/*
 * La ficha va DESPUES de la lista y ANTES de las rutas con sufijo: Express
 * casa por orden, y `/firms/:firmId` no puede quedar por encima de
 * `/firms/:firmId/credits` sin comerselas.
 */
router.get('/firms/:firmId', firmDetailController as any);
router.post('/firms', createFirmController as any);
router.patch('/firms/:firmId', updateFirmController as any);
router.post('/firms/:firmId/credits', addCreditsController as any);
router.post('/firms/:firmId/users', addUserController as any);

export const adminRoutes = router;
