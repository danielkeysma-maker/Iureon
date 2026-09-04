import { Router } from 'express';
import {
  cancelarController,
  estadoController,
  llavePublicaController,
  pruebaController,
  suscribirController
} from './push.controller';

/**
 * Avisos por Web Push. Se monta en `/api`, detrás de `authMiddleware`: la
 * llave pública no es secreta, pero no hay razón para servírsela a quien no
 * tiene sesión, y las demás rutas escriben a nombre del usuario del token.
 */
const router = Router();

router.get('/push/public-key', llavePublicaController);
router.get('/push/status', estadoController);
router.post('/push/subscribe', suscribirController);
router.post('/push/unsubscribe', cancelarController);
router.post('/push/test', pruebaController);

export const pushRoutes = router;
