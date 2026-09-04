import { Router } from 'express';
import {
  abrirConversacionController,
  conversacionController,
  enviarMensajeController,
  listarConversacionesController,
  noLeidosController
} from './supportChat.controller';

/**
 * Chat de soporte, lado de la FIRMA.
 *
 * Se monta en `/api`, detrás de `authMiddleware`, sin filtro de rol: cualquier
 * abogado de la firma puede escribir a soporte y leer lo que otro abogado de
 * su firma escribió. La firma sale del token, nunca de la URL.
 *
 * `/unread` va ANTES de `/:id`: Express casa por orden y, de otro modo, la
 * palabra «unread» se leería como el id de una conversación que no existe.
 *
 * Las rutas del OPERADOR no viven aquí: cuelgan de `adminRoutes`, donde
 * `requireSuperAdmin` ya está aplicado al router entero.
 */
const router = Router();

router.get('/support-chat', listarConversacionesController);
router.post('/support-chat', abrirConversacionController);
router.get('/support-chat/unread', noLeidosController);
router.get('/support-chat/:id', conversacionController);
router.post('/support-chat/:id/messages', enviarMensajeController);

export const supportChatRoutes = router;
