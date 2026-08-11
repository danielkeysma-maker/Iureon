import { Router } from 'express';
import {
  getBranchCatalogController,
  listActuacionesController,
  resolveActuacionController
} from './catalog.controller';

const router = Router();

// The literal routes are declared before the parameterised one so that
// "/catalog/actuaciones" is never captured as a branch name.
router.get('/catalog/actuaciones', listActuacionesController as any);
router.get('/catalog/actuaciones/resolve', resolveActuacionController as any);
router.get('/catalog/:branch', getBranchCatalogController as any);

export const catalogRoutes = router;
