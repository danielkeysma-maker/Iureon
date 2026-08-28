import { Router } from 'express';
import { triageController, listarOrientacionesController } from './triage.controller';
import {
  deleteVerificationController,
  getBranchCatalogController,
  listActuacionesController,
  listVerificationsController,
  resolveActuacionController,
  saveVerificationController
} from './catalog.controller';

/**
 * Reading the catalogue does NOT require a tenant.
 *
 * The shipped catalogue is product knowledge — the same 364 actuaciones for
 * every firm — and only the curation overlay is per firm. Putting these reads
 * behind the x-firm-id middleware made the entire feature invisible until a
 * firm was registered, which is precisely the state a new user starts in.
 *
 * The literal routes are declared before the parameterised one so that
 * "/catalog/actuaciones" is never captured as a branch name.
 */
const publicRouter = Router();

publicRouter.get('/catalog/actuaciones', listActuacionesController as any);
publicRouter.get('/catalog/actuaciones/resolve', resolveActuacionController as any);

/** Curation: writing to the knowledge base is always firm-scoped. */
const tenantRouter = Router();

/*
 * La orientación por hechos va en el router de firma, no en el público.
 *
 * Gasta una llamada a un modelo, y por tanto saldo: un endpoint abierto sería
 * una forma de que un desconocido gaste el crédito de las firmas. Además va
 * declarada ANTES de "/catalog/:branch", que si no se traga "triage" como si
 * fuera el nombre de una rama.
 */
tenantRouter.post('/catalog/triage', triageController as any);
tenantRouter.get('/catalog/orientaciones', listarOrientacionesController as any);

tenantRouter.get('/catalog/verifications', listVerificationsController as any);
tenantRouter.put('/catalog/verifications', saveVerificationController as any);
tenantRouter.delete('/catalog/verifications', deleteVerificationController as any);

/** Declared last: ":branch" would otherwise swallow "verifications". */
publicRouter.get('/catalog/:branch', getBranchCatalogController as any);

export const catalogPublicRoutes = publicRouter;
export const catalogRoutes = tenantRouter;
