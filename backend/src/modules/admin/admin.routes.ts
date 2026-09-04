import { Router } from 'express';
import { requireSuperAdmin } from './admin.middleware';
import { catalogMasterController } from './catalogMaster.controller';
import {
  anotarLecturaController,
  historialAccesoController,
  solicitarAccesoController
} from '../support/supportAccess.controller';
import {
  bandejaOperadorController,
  cerrarOperadorController,
  conversacionOperadorController,
  responderOperadorController
} from '../support/supportChat.controller';
import {
  addCreditsController,
  addUserController,
  createFirmController,
  firmDetailController,
  listFirmsController,
  updateFirmController,
  updateFirmPlanController,
  runwayController
} from './admin.controller';

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

router.get('/catalog-master', catalogMasterController as any);
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
router.patch('/firms/:firmId/plan', updateFirmPlanController as any);
router.post('/firms/:firmId/credits', addCreditsController as any);
router.post('/firms/:firmId/users', addUserController as any);

/*
 * Acceso de soporte (8a), lado operacion. Cuelgan de aqui y no de su propio
 * modulo por una razon de seguridad, no de orden: `requireSuperAdmin` ya esta
 * aplicado a este router, asi que una ruta que cruza la frontera del inquilino
 * queda protegida por existir aqui. Montarlas aparte obligaria a recordar el
 * guardian, y lo que se recuerda se olvida.
 *
 * Pedir no concede: la respuesta es una solicitud PENDIENTE que solo un socio
 * de la firma puede convertir en acceso, desde `supportAccessRoutes`.
 */
router.post('/firms/:firmId/support-access', solicitarAccesoController as any);
router.get('/firms/:firmId/support-access', historialAccesoController as any);
router.post('/firms/:firmId/support-access/view', anotarLecturaController as any);

/*
 * Chat de soporte, lado operador. Misma razon que arriba: la bandeja cruza
 * todas las firmas, asi que vive detras del guardian del router y no en su
 * propio modulo. Ninguna de estas usa `req.firmId`: el operador lee cualquier
 * hilo por su id, y la firma de cada uno sale de la fila.
 */
router.get('/support-chat', bandejaOperadorController as any);
router.get('/support-chat/:id', conversacionOperadorController as any);
router.post('/support-chat/:id/messages', responderOperadorController as any);
router.post('/support-chat/:id/close', cerrarOperadorController as any);

export const adminRoutes = router;
