import { Request, Response } from 'express';
import { callerIp } from '../admin/admin.middleware';
import {
  SupportChatError,
  abrirConversacion,
  bandejaDelOperador,
  cerrarConversacion,
  conversacionParaOperador,
  enviarMensaje,
  listarConversacionesDeFirma,
  marcarLeida,
  mensajesDeConversacion,
  noLeidosDeFirma
} from './supportChat.service';

/**
 * Chat de soporte: los dos lados de la misma mesa, por rutas distintas.
 *
 *   FIRMA     · bajo `/api`, con `req.firmId` del token. La firma NUNCA llega
 *               por parámetro: si llegara, el navegador escogería qué bandeja
 *               leer.
 *   OPERADOR  · bajo `/api/admin`, ya filtrado por `requireSuperAdmin`. No se
 *               pasa `req.firmId` al servicio a propósito: el operador lee
 *               cualquier firma, y la firma de cada hilo sale de su fila.
 *
 * Abrir un hilo lo marca leído para el lado que lo abre. Se hace en el GET y
 * no en una llamada aparte porque «lo vi» y «lo abrí» son el mismo hecho, y un
 * cliente que olvidara la segunda llamada dejaría el contador clavado.
 */

const param = (valor: string | string[] | undefined): string =>
  Array.isArray(valor) ? (valor[0] ?? '') : (valor ?? '');

const texto = (valor: unknown): string => (typeof valor === 'string' ? valor : '');

const responder = (res: Response, error: unknown): void => {
  if (error instanceof SupportChatError) {
    res.status(error.status).json({ error: error.code, message: error.message });
    return;
  }
  const mensaje = error instanceof Error ? error.message : 'Error inesperado.';
  res.status(500).json({ error: 'SUPPORT_CHAT_ERROR', message: mensaje });
};

/** La firma y el correo del token, o 401. Cualquier rol de la firma puede escribir. */
const sesionDeFirma = (req: Request, res: Response): { firmId: string; email: string } | null => {
  const firmId = req.firmId;
  const email = req.user?.email;
  if (!firmId || !email) {
    res.status(401).json({ error: 'UNAUTHORIZED', message: 'Se requiere sesión autenticada.' });
    return null;
  }
  return { firmId, email };
};

// ───────────────────────────────── LADO FIRMA ────────────────────────────────

/** `GET /api/support-chat` — las conversaciones de la firma y cuántas respuestas hay sin leer. */
export const listarConversacionesController = async (req: Request, res: Response): Promise<void> => {
  try {
    const sesion = sesionDeFirma(req, res);
    if (!sesion) return;

    const conversaciones = await listarConversacionesDeFirma({ firmId: sesion.firmId });
    const sinLeer = conversaciones.reduce((t, c) => t + c.unreadForFirm, 0);

    res.json({ success: true, conversaciones, sinLeer });
  } catch (error) {
    responder(res, error);
  }
};

/** `POST /api/support-chat` — abrir una conversación con su primer mensaje. */
export const abrirConversacionController = async (req: Request, res: Response): Promise<void> => {
  try {
    const sesion = sesionDeFirma(req, res);
    if (!sesion) return;

    const { subject, body } = req.body ?? {};
    const resultado = await abrirConversacion({
      firmId: sesion.firmId,
      userEmail: sesion.email,
      subject: texto(subject),
      body: texto(body),
      ipAddress: callerIp(req)
    });

    res.status(201).json({ success: true, ...resultado });
  } catch (error) {
    responder(res, error);
  }
};

/** `GET /api/support-chat/unread` — solo la cifra, para el badge de la barra. */
export const noLeidosController = async (req: Request, res: Response): Promise<void> => {
  try {
    const sesion = sesionDeFirma(req, res);
    if (!sesion) return;

    const sinLeer = await noLeidosDeFirma({ firmId: sesion.firmId });
    res.json({ success: true, sinLeer });
  } catch (error) {
    responder(res, error);
  }
};

/** `GET /api/support-chat/:id` — el hilo. Abrirlo lo marca leído para la firma. */
export const conversacionController = async (req: Request, res: Response): Promise<void> => {
  try {
    const sesion = sesionDeFirma(req, res);
    if (!sesion) return;

    const conversationId = param(req.params.id);
    const resultado = await mensajesDeConversacion({ firmId: sesion.firmId, conversationId });
    if (resultado.conversacion.unreadForFirm > 0) {
      await marcarLeida({ firmId: sesion.firmId, conversationId, side: 'FIRMA' });
      resultado.conversacion.unreadForFirm = 0;
    }

    res.json({ success: true, ...resultado });
  } catch (error) {
    responder(res, error);
  }
};

/** `POST /api/support-chat/:id/messages` — la firma escribe. Reabre el hilo si estaba cerrado. */
export const enviarMensajeController = async (req: Request, res: Response): Promise<void> => {
  try {
    const sesion = sesionDeFirma(req, res);
    if (!sesion) return;

    const resultado = await enviarMensaje({
      firmId: sesion.firmId,
      conversationId: param(req.params.id),
      userEmail: sesion.email,
      side: 'FIRMA',
      body: texto(req.body?.body),
      ipAddress: callerIp(req)
    });

    res.status(201).json({ success: true, ...resultado });
  } catch (error) {
    responder(res, error);
  }
};

// ─────────────────────────────── LADO OPERADOR ───────────────────────────────
//
// Sin `req.firmId` en ninguna de estas: el operador entra a la consola con
// una firma activa cualquiera en su token, y filtrar por ella escondería el
// resto de la bandeja. `requireSuperAdmin` ya decidió que puede cruzarlas.

/** `GET /api/admin/support-chat` — la bandeja completa, abiertas primero. */
export const bandejaOperadorController = async (_req: Request, res: Response): Promise<void> => {
  try {
    const bandeja = await bandejaDelOperador();
    res.json({ success: true, ...bandeja });
  } catch (error) {
    responder(res, error);
  }
};

/** `GET /api/admin/support-chat/:id` — un hilo de cualquier firma. Abrirlo lo marca leído para el operador. */
export const conversacionOperadorController = async (req: Request, res: Response): Promise<void> => {
  try {
    const conversationId = param(req.params.id);
    const resultado = await conversacionParaOperador({ conversationId });
    if (resultado.conversacion.unreadForOperator > 0) {
      await marcarLeida({ conversationId, side: 'OPERADOR' });
      resultado.conversacion.unreadForOperator = 0;
    }

    res.json({ success: true, ...resultado });
  } catch (error) {
    responder(res, error);
  }
};

/** `POST /api/admin/support-chat/:id/messages` — el operador responde. */
export const responderOperadorController = async (req: Request, res: Response): Promise<void> => {
  try {
    const resultado = await enviarMensaje({
      conversationId: param(req.params.id),
      userEmail: req.user?.email ?? 'operación',
      side: 'OPERADOR',
      body: texto(req.body?.body),
      ipAddress: callerIp(req)
    });

    res.status(201).json({ success: true, ...resultado });
  } catch (error) {
    responder(res, error);
  }
};

/** `POST /api/admin/support-chat/:id/close` — dar por resuelto. La firma puede reabrir escribiendo. */
export const cerrarOperadorController = async (req: Request, res: Response): Promise<void> => {
  try {
    const conversacion = await cerrarConversacion({
      conversationId: param(req.params.id),
      userEmail: req.user?.email ?? 'operación',
      ipAddress: callerIp(req)
    });

    res.json({ success: true, conversacion });
  } catch (error) {
    responder(res, error);
  }
};
