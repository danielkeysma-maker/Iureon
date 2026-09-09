import { Router } from 'express';
import { bloquearSiPlanVencido } from '../subscriptions/planVigente.middleware';
import { triageController, listarOrientacionesController } from './triage.controller';
import {
  createFirmActuacionController,
  deleteFirmActuacionController,
  listFirmActuacionesController
} from './firmActuaciones.controller';
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
tenantRouter.post('/catalog/triage', bloquearSiPlanVencido, triageController as any);
tenantRouter.get('/catalog/orientaciones', listarOrientacionesController as any);

tenantRouter.get('/catalog/verifications', listVerificationsController as any);

/*
 * Las actuaciones que la firma añadió a una rama. Van en el router de firma:
 * son suyas y de nadie más — nadie verificó su norma, así que ofrecérselas a
 * otra firma sería presentarle como catálogo la nota de un desconocido.
 *
 * Crear no exige ser socio (escribir el nombre de lo que uno va a redactar es
 * trabajo de litigante); verificar sí, y ese camino sigue siendo el de
 * `/catalog/verifications`.
 */
tenantRouter.get('/catalog/firm-actuaciones', listFirmActuacionesController as any);
tenantRouter.post('/catalog/firm-actuaciones', bloquearSiPlanVencido, createFirmActuacionController as any);
tenantRouter.delete('/catalog/firm-actuaciones', bloquearSiPlanVencido, deleteFirmActuacionController as any);
tenantRouter.put('/catalog/verifications', bloquearSiPlanVencido, saveVerificationController as any);
tenantRouter.delete('/catalog/verifications', bloquearSiPlanVencido, deleteVerificationController as any);

/**
 * DECLARARLO AL FINAL NO BASTABA, y ese era un defecto real.
 *
 * El orden dentro de un router solo decide entre las rutas DE ESE router, y
 * este es público y se monta ANTES que el de firma (index.ts: el catálogo se
 * lee sin sesión, a propósito). Así que `/catalog/verifications` nunca llegaba
 * a su controlador: lo atrapaba `:branch` y respondía 404 «la rama
 * VERIFICATIONS aún no tiene catálogo verificado». Pasó inadvertido porque el
 * frontend todavía no llamaba a esa ruta; la lista de actuaciones propias sí
 * la habría necesitado, y habría fallado igual.
 *
 * La salida es nombrar lo que NO es una rama y dejarlo pasar al siguiente
 * router con `next()`. Una rama de verdad que no exista sigue recibiendo su
 * 404 con la lista de ramas disponibles, que es la respuesta útil.
 */
const NO_SON_RAMAS = new Set(['verifications', 'firm-actuaciones', 'triage', 'orientaciones', 'actuaciones']);

publicRouter.get('/catalog/:branch', (req, res, next) => {
  if (NO_SON_RAMAS.has(String(req.params.branch).toLowerCase())) {
    next();
    return;
  }

  void getBranchCatalogController(req, res);
});

export const catalogPublicRoutes = publicRouter;
export const catalogRoutes = tenantRouter;
