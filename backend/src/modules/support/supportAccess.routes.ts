import { Router } from 'express';
import {
  decidirAccesoController,
  estadoAccesoFirmaController,
  revocarAccesoController
} from './supportAccess.controller';

/**
 * El lado de la FIRMA. Artboard 8a.
 *
 * Se monta en `/api`, detrás de `authMiddleware`, sin filtro de rol en el
 * router: leer el estado lo puede hacer cualquiera que trabaje en la firma
 * —la franja ámbar tiene que verla todo el mundo, no solo quien puede
 * revocarla—, y decidir lo restringe cada controlador con `socioDeLaFirma`.
 *
 * Es la excepción razonada a la regla de `adminRoutes`, que sí filtra el router
 * entero: allí TODA ruta cruza la frontera del inquilino, aquí ninguna lo hace.
 * La firma solo puede ver y decidir sobre sí misma, porque el `firmId` sale del
 * token y no de la URL.
 *
 * Las rutas del lado de OPERACIÓN no viven aquí: cuelgan de `/api/admin/firms`,
 * donde `requireSuperAdmin` ya está aplicado al router.
 */
const router = Router();

router.get('/support-access', estadoAccesoFirmaController);
router.post('/support-access/:accessId/decision', decidirAccesoController);
router.post('/support-access/:accessId/revoke', revocarAccesoController);

export const supportAccessRoutes = router;
