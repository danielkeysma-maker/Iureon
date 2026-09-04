import { httpClient } from '../../config/httpClient';

/**
 * Chat de soporte: el cliente de los dos lados.
 *
 * Las llamadas de la FIRMA no llevan `firmId`: el servidor lo lee del token.
 * Las del OPERADOR van bajo `/api/admin/support-chat` y solo responden a una
 * sesión SUPER_ADMIN; este archivo no concede nada, pinta un poder que el
 * servidor ya decidió.
 */

export type LadoDelChat = 'FIRMA' | 'OPERADOR';
export type EstadoConversacion = 'ABIERTA' | 'CERRADA';

export interface Conversacion {
  id: string;
  firmId: string;
  openedByEmail: string;
  subject: string;
  status: EstadoConversacion;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  lastAuthor: LadoDelChat | null;
  unreadForFirm: number;
  unreadForOperator: number;
  closedAt: string | null;
  closedByEmail: string | null;
}

/** La misma conversación con el nombre de la firma, para la bandeja del operador. */
export interface ConversacionConFirma extends Conversacion {
  firmName: string;
}

export interface Mensaje {
  id: string;
  conversationId: string;
  authorEmail: string;
  authorSide: LadoDelChat;
  body: string;
  createdAt: string;
}

export interface Hilo<C extends Conversacion = Conversacion> {
  conversacion: C;
  mensajes: Mensaje[];
}

export interface BandejaDelOperador {
  conversaciones: ConversacionConFirma[];
  totales: { abiertas: number; sinLeer: number };
}

export const supportChatApi = {
  // ─── Lado firma ───────────────────────────────────────────────────────────
  listar: () =>
    httpClient.get<{ conversaciones: Conversacion[]; sinLeer: number }>('/api/support-chat'),

  abrir: (subject: string, body: string) =>
    httpClient.post<{ conversacion: Conversacion; mensaje: Mensaje }>('/api/support-chat', {
      body: { subject, body }
    }),

  /** Abrir el hilo lo marca leído para la firma; el servidor lo hace en el mismo GET. */
  hilo: (id: string) => httpClient.get<Hilo>(`/api/support-chat/${id}`),

  enviar: (id: string, body: string) =>
    httpClient.post<{ conversacion: Conversacion; mensaje: Mensaje }>(
      `/api/support-chat/${id}/messages`,
      { body: { body } }
    ),

  sinLeer: () =>
    httpClient.get<{ sinLeer: number }>('/api/support-chat/unread').then((r) => r.sinLeer),

  // ─── Lado operador ────────────────────────────────────────────────────────
  bandeja: () => httpClient.get<BandejaDelOperador>('/api/admin/support-chat'),

  hiloOperador: (id: string) =>
    httpClient.get<Hilo<ConversacionConFirma>>(`/api/admin/support-chat/${id}`),

  responder: (id: string, body: string) =>
    httpClient.post<{ conversacion: Conversacion; mensaje: Mensaje }>(
      `/api/admin/support-chat/${id}/messages`,
      { body: { body } }
    ),

  cerrar: (id: string) =>
    httpClient
      .post<{ conversacion: Conversacion }>(`/api/admin/support-chat/${id}/close`, { body: {} })
      .then((r) => r.conversacion)
};
