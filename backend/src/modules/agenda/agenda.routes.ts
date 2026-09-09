import { Router } from 'express';
import { bloquearSiPlanVencido } from '../subscriptions/planVigente.middleware';
import {
  borrarDeAgendaController,
  crearEnAgendaController,
  editarEnAgendaController,
  listarAgendaController,
  plazoDeActuacionController,
  previsualizarVencimientoController
} from './agenda.controller';
import { avisosDelDiaController } from './agendaCron.controller';

/**
 * Rutas de la agenda de términos.
 *
 * Las lecturas quedan abiertas con un plan vencido —la promesa de esta casa es
 * que una firma que no ha pagado sigue viendo lo que ya tiene, y un vencimiento
 * que se le viene encima es justo lo que no se le puede esconder—; las
 * escrituras van tras `bloquearSiPlanVencido`, como en todo el producto.
 *
 * `previsualizar` es una escritura en intención aunque no guarde nada: es el
 * paso previo a crear una entrada, y dejarla abierta con el plan vencido
 * ofrecería un formulario cuyo botón de guardar va a responder 402.
 */
const router = Router();

router.get('/agenda', listarAgendaController);
router.get('/agenda/plazo', plazoDeActuacionController);
router.post('/agenda/previsualizar', bloquearSiPlanVencido, previsualizarVencimientoController);
router.post('/agenda', bloquearSiPlanVencido, crearEnAgendaController);
router.patch('/agenda/:id', bloquearSiPlanVencido, editarEnAgendaController);
router.delete('/agenda/:id', bloquearSiPlanVencido, borrarDeAgendaController);

export const agendaRoutes = router;

/**
 * El trabajo diario, aparte y ANTES del middleware de sesión.
 *
 * Vercel no tiene sesión de Supabase con la que llamarnos, igual que Wompi. Su
 * autenticación es la cabecera con el secreto, comprobada en el controlador. Si
 * colgara del router de sesión, la plataforma recibiría 401 en cada pasada y
 * ningún abogado sabría por qué dejaron de llegarle los avisos.
 */
const publicRouter = Router();

publicRouter.get('/agenda/avisos-del-dia', avisosDelDiaController);
/*
 * También por POST: la invocación manual desde una consola o un `curl` de
 * comprobación es más natural en POST, y un GET que produce efectos puede
 * dispararlo un prefetch del navegador. Vercel llama por GET, así que hacen
 * falta los dos.
 */
publicRouter.post('/agenda/avisos-del-dia', avisosDelDiaController);

export const agendaPublicRoutes = publicRouter;
