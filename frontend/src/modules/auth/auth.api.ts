import { API_BASE_URL } from '../../config/api.config';
import { readSession, type Session } from './session';

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

/*
 * An authenticated DELETE that does NOT go through `httpClient` either, for a
 * different reason: that client treats every 401 as a lost session and sends
 * the app back to login. Here a 401 is «La contraseña no es correcta», and the
 * lawyer must stay on the dialog, read it, and try again.
 */
const deleteConSesion = async <T>(path: string, body: unknown): Promise<T> => {
  const sesion = readSession();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(sesion ? { Authorization: `Bearer ${sesion.accessToken}` } : {})
    },
    body: JSON.stringify(body)
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.message || `La petición falló (${response.status}).`);
  }

  return payload as T;
};

export type ModoDeRegistro = 'PRUEBA' | 'COMPRA';
export type PlanDeRegistro = 'ESENCIAL' | 'PREMIUM' | 'FIRMA';

/**
 * What the public sign-up form sends. `modo` PRUEBA opens the 7-day Esencial
 * trial; COMPRA creates the firm with the chosen plan born expired, so the
 * first payment activates it. `empresa` is the honeypot: always ''.
 */
export interface SolicitudDeRegistro {
  modo: ModoDeRegistro;
  plan: PlanDeRegistro;
  firma: string;
  nit: string;
  nombre: string;
  correo: string;
  contrasena: string;
  acepta: true;
  empresa: string;
}

export const authApi = {
  login: (email: string, password: string) =>
    post<{ session: Session }>('/api/auth/login', { email, password }),

  refresh: (refreshToken: string) =>
    post<{ session: Session }>('/api/auth/refresh', { refreshToken }),

  /*
   * Self-service sign-up: the 7-day trial of Esencial or the purchase of any
   * plan. Answers with the same session shape as login, so the app opens
   * directly; the server enforces the limits (one per e-mail, three per
   * address per day, honeypot, trial only for Esencial).
   */
  registro: (solicitud: SolicitudDeRegistro) =>
    post<{ session: Session; venceEl: string; modo: ModoDeRegistro; plan: PlanDeRegistro }>(
      '/api/public/registro',
      solicitud
    ),

  /*
   * Ajustes → «Su cuenta» → Zona de riesgo. Both need the password typed
   * again; the firm also needs its exact name. Both work with an expired
   * plan. The server's refusal (wrong password, last user, last
   * administrator, name mismatch) arrives as the Error message, verbatim.
   */
  eliminarMiUsuario: (contrasena: string) =>
    deleteConSesion<{ success: true }>('/api/auth/me', { contrasena }),

  eliminarMiFirma: (contrasena: string, confirmacion: string) =>
    deleteConSesion<{ success: true; advertencias: string[] }>('/api/firms/me', { contrasena, confirmacion })
};
