import { Router } from 'express';
import { bloquearSiPlanVencido } from '../subscriptions/planVigente.middleware';
import {
  guardarLeccionController,
  leerFormatoController,
  perfilDeEstiloController,
  retirarLeccionController
} from './estilo.controller';

/**
 * El estilo de la firma. Montado DESPUÉS de `authMiddleware`: todo aquí es dato
 * de la firma y exige sesión.
 *
 * Leer el perfil queda abierto con el plan vencido (leer nunca se bloquea);
 * leer un formato, guardar y retirar escriben o cobran, y se bloquean como el
 * resto de las escrituras.
 */
const router = Router();

router.get('/estilo', perfilDeEstiloController);
router.post('/estilo/leer', bloquearSiPlanVencido, leerFormatoController);
router.post('/estilo/lecciones', bloquearSiPlanVencido, guardarLeccionController);
router.delete('/estilo/lecciones/:id', bloquearSiPlanVencido, retirarLeccionController);

export const estiloRoutes = router;
