import { httpClient } from '../../config/httpClient';

/**
 * Avisos por Web Push: el cliente de las cinco rutas.
 *
 * Ninguna lleva firma ni correo: el servidor los lee del token. Lo único que
 * viaja es lo que el navegador fabrica —la suscripción— o su endpoint.
 */

export interface EstadoDeAvisosDelServidor {
  /** `false` cuando el servidor no tiene llaves VAPID: la pantalla lo dice en vez de fallar. */
  enabled: boolean;
  suscripcionesDelUsuario: number;
}

export interface ResultadoDeEnvio {
  enviados: number;
  fallidos: number;
}

export const pushApi = {
  llavePublica: () => httpClient.get<{ enabled: boolean; publicKey: string }>('/api/push/public-key'),

  estado: () => httpClient.get<EstadoDeAvisosDelServidor>('/api/push/status'),

  suscribir: (subscription: PushSubscriptionJSON) =>
    httpClient.post<{ success: boolean }>('/api/push/subscribe', { body: { subscription } }),

  cancelar: (endpoint: string) =>
    httpClient.post<{ success: boolean }>('/api/push/unsubscribe', { body: { endpoint } }),

  prueba: () => httpClient.post<ResultadoDeEnvio>('/api/push/test')
};
