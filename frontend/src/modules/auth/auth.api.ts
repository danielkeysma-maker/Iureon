import { API_BASE_URL } from '../../config/api.config';
import type { Session } from './session';

/**
 * The sign-in calls, which deliberately do NOT go through `httpClient`.
 *
 * That client attaches the session to every request; these two are the ones
 * made without a session — logging in, and trading an expired access token for
 * a fresh one. Routing them through it would make the refresh call depend on
 * the token it exists to replace.
 *
 * There is no registration here any more. A firm is opened by the operator, who
 * knows what was agreed and charged; a public sign-up let anyone use the
 * product without ever becoming a client.
 */

export interface FirmProfile {
  id: string;
  name: string;
  nit: string;
  planTier: string;
  status: string;
  creditsBalance: number;
}

const post = async <T>(path: string, body: unknown): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    // The API explains rejections in Spanish for the lawyer — "Correo o
    // contraseña incorrectos", not "failed with 401".
    throw new Error(payload?.message || `La petición falló (${response.status}).`);
  }

  return payload as T;
};

export const authApi = {
  login: (email: string, password: string) =>
    post<{ session: Session }>('/api/auth/login', { email, password }),

  refresh: (refreshToken: string) =>
    post<{ session: Session }>('/api/auth/refresh', { refreshToken })
};
