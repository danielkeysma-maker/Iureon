import { Router } from 'express';
import {
  deleteVerificationController,
  getBranchCatalogController,
  listActuacionesController,
  listVerificationsController,
  resolveActuacionController,
  saveVerificationController
} from './catalog.controller';

const router = Router();

// The literal routes are declared before the parameterised one so that
// "/catalog/actuaciones" and "/catalog/verifications" are never captured as
// branch names.
router.get('/catalog/actuaciones', listActuacionesController as any);
router.get('/catalog/actuaciones/resolve', resolveActuacionController as any);

// Curation: how a firm corrects the shipped catalogue from inside the product.
router.get('/catalog/verifications', listVerificationsController as any);
router.put('/catalog/verifications', saveVerificationController as any);
router.delete('/catalog/verifications', deleteVerificationController as any);

router.get('/catalog/:branch', getBranchCatalogController as any);

export const catalogRoutes = router;
