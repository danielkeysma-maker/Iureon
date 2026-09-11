import { API_BASE_URL } from './api.config';
import { authApi } from '../modules/auth/auth.api';
import { clearSession, needsRenewal, readSession, saveSession } from '../modules/auth/session';

/**
 * Single entry point for backend calls.
 *
 * THE TENANT IS NO LONGER AN ARGUMENT. Every call used to carry a `firmId` that
 * became the `x-firm-id` header, and the server believed it. That made the
 * tenant boundary something the browser chose: naming another firm was enough
 * to read their hearings. The comment here used to warn that "a made-up firm id
 * is not a harmless placeholder" — which was true, and the reason the value had
 * to stop coming from the client at all.
 *
 * The firm now travels inside the session token, in the half of the metadata
 * only the server can write. Callers say what they want; who they are is not
 * theirs to state.
 *
 * Reads of shared product knowledge — the actuación catalogue and the
 * jurisprudence corpus — still work with no session at all. They are mounted
 * before the session middleware and answer the same data to everyone; a signed
 * -in lawyer additionally gets their own curation overlaid, from the token.
 */

export class ApiError extends Error {
  readonly status: number;
  readonly url: string;
  /**
   * The API's own code (`PLAN_VENCIDO`, `INSUFFICIENT_CREDITS`…), when it sent
   * one. Screens decide by code what to offer next — a link to pay the plan is
   * not the same button as a link to recharge — and the message stays the
   * server's, in Spanish, for the lawyer.
   */
  readonly code: string | null;

  constructor(message: string, status: number, url: string, code: string | null = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.url = url;
    this.code = code;
  }
}

interface RequestOptions {
  body?: unknown;
  signal?: AbortSignal;
  /**
   * The request outlives the page. Used for the last save when a tab is hidden
   * or closed: a plain fetch started in `pagehide` is cancelled with the page,
   * so the lawyer's final edit never reaches the server. `sendBeacon` cannot
   * carry the Authorization header; `fetch` with keepalive can. Browsers cap
   * keepalive bodies at about 64 KB in flight — callers trim what they send.
   */
  keepalive?: boolean;
}

/** Called when the session cannot be renewed, so the app can return to login. */
let onSessionLost: (() => void) | null = null;
export const setSessionLostHandler = (handler: (() => void) | null): void => {
  onSessionLost = handler;
};

/**
 * The access token to send, renewed BEFORE it expires rather than after a
 * failure.
 *
 * A hearing outlives an access token, so expiry always lands mid-work: without
 * this, correcting a name at minute sixty-one fails and the lawyer is told
 * nothing useful. Concurrent callers share one renewal — a transcript screen
 * fires several requests at once, and three parallel refreshes would invalidate
 * each other's rotated token.
 */
let renewal: Promise<string | null> | null = null;

/**
 * Si el servidor RECHAZÓ el refresco, que es lo único que prueba que la sesión
 * ya no vale.
 *
 * Se enumera lo que sí es un rechazo en vez de lo que no, y el resto —un 500,
 * un 502, un 429, una petición que ni salió— cuenta como tropiezo. En esta
 * dirección equivocarse solo cuesta un reintento; en la otra cuesta la sesión
 * de alguien que estaba trabajando.
 *
 * 400 entra porque es «falta el token de refresco»: con el cuerpo mal formado,
 * insistir daría lo mismo para siempre.
 */
const RECHAZOS = new Set([400, 401, 403]);
const refrescoRechazado = (err: unknown): boolean =>
  err instanceof ApiError && RECHAZOS.has(err.status);

const currentAccessToken = async (): Promise<string | null> => {
  const session = readSession();
  if (!session) return null;
  if (!needsRenewal(session)) return session.accessToken;

  renewal ??= (async () => {
    try {
      const { session: fresh } = await authApi.refresh(session.refreshToken);
      return saveSession(fresh).accessToken;
    } catch (err) {
      /*
       * ─── UN REFRESCO QUE NO SE PUDO INTENTAR NO ES UN REFRESCO RECHAZADO ──
       *
       * Antes CUALQUIER fallo aquí borraba la sesión: un corte de red de dos
       * segundos, un 5xx del servicio de autenticación o un arranque en frío
       * lento devolvían al abogado al login con su token de refresco intacto.
       *
       * Y el momento es el peor posible: la renovación empieza CINCO MINUTOS
       * ANTES de que el token caduque, así que el de ahora todavía sirve. Se
       * devuelve ése y se deja que la petición siga; si el problema persiste,
       * el siguiente intento vuelve a probar, y cuando el token de verdad
       * expire la respuesta será un 401 y entonces sí se cierra la sesión.
       *
       * Solo se borra cuando el servidor RECHAZÓ el refresco, que es lo único
       * que prueba que la sesión ya no vale.
       */
      if (!refrescoRechazado(err)) return session.accessToken;

      // The refresh token is spent or revoked; there is no recovering here.
      clearSession();
      onSessionLost?.();
      return null;
    } finally {
      renewal = null;
    }
  })();

  return renewal;
};

const authHeaders = async (): Promise<Record<string, string>> => {
  const token = await currentAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * EL SERVIDOR NO PUDO COMPROBAR LA SESIÓN — Y ESO SE REINTENTA.
 *
 * El servidor distingue «el token no sirve» (401) de «no pude comprobarlo»
 * (503 `AUTH_NO_DISPONIBLE`): un tropiezo de red contra el servicio de
 * autenticación, un 5xx suyo, un arranque en frío lento. Antes las dos cosas
 * salían por el mismo 401 y aquí se borraba la sesión, así que un parpadeo
 * ajeno devolvía al abogado al login con su token intacto.
 *
 * REINTENTARLO ES SEGURO POR CONSTRUCCIÓN, y por eso se hace incluso con POST:
 * ese 503 lo emite el middleware ANTES de que corra ningún manejador, así que
 * la petición no llegó a ejecutar nada — no se reservó saldo, no se llamó a
 * ningún motor, no se escribió una fila. Reintentar no puede cobrar dos veces
 * porque la primera no cobró.
 */
const ESPERA_DE_REINTENTO_MS = 700;
const esAuthNoDisponible = (status: number, codigo: unknown): boolean =>
  status === 503 && codigo === 'AUTH_NO_DISPONIBLE';

const unaVez = async <T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  { body, signal, keepalive }: RequestOptions = {}
): Promise<T> => {
  const url = `${API_BASE_URL}${path}`;

  const headers: Record<string, string> = await authHeaders();
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const response = await fetch(url, {
    method,
    headers,
    signal,
    keepalive: keepalive === true,
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  if (!response.ok) {
    // A rejected session means the app is showing a screen the user can no
    // longer act on; returning to login beats letting every button fail.
    if (response.status === 401) {
      clearSession();
      onSessionLost?.();
    }

    // The API explains rejections in Spanish for the lawyer — a curation form
    // needs to say "falta la fuente normativa", not "failed with 400".
    const payload = await response.json().catch(() => null);
    throw new ApiError(
      payload?.message || `${method} ${path} failed with ${response.status}`,
      response.status,
      url,
      typeof payload?.error === 'string' ? payload.error : null
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
};

const request = async <T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  options: RequestOptions = {}
): Promise<T> => {
  try {
    return await unaVez<T>(method, path, options);
  } catch (err) {
    if (!(err instanceof ApiError) || !esAuthNoDisponible(err.status, err.code)) throw err;
    /*
     * UNA sola vez. Si el servicio de autenticación está caído de verdad,
     * insistir solo alarga la espera y multiplica la carga contra algo que ya
     * no responde; el mensaje del servidor dice qué hacer.
     */
    await new Promise((listo) => setTimeout(listo, ESPERA_DE_REINTENTO_MS));
    return unaVez<T>(method, path, options);
  }
};

/**
 * Multipart upload. Content-Type is deliberately left unset so the browser
 * adds the multipart boundary itself; setting it by hand breaks the upload.
 */
const postForm = async <T>(
  path: string,
  form: FormData,
  { signal }: { signal?: AbortSignal } = {}
): Promise<T> => {
  const url = `${API_BASE_URL}${path}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: await authHeaders(),
    body: form,
    signal
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401) {
      clearSession();
      onSessionLost?.();
    }

    // The API explains upload failures in Spanish for the lawyer; keep that
    // message rather than replacing it with a status code.
    throw new ApiError(
      payload?.message || `POST ${path} failed with ${response.status}`,
      response.status,
      url,
      typeof payload?.error === 'string' ? payload.error : null
    );
  }

  return payload as T;
};

export const httpClient = {
  get: <T>(path: string, options?: RequestOptions) => request<T>('GET', path, options),
  post: <T>(path: string, options?: RequestOptions) => request<T>('POST', path, options),
  put: <T>(path: string, options?: RequestOptions) => request<T>('PUT', path, options),
  // Added for partial updates — correcting one intervention of a transcript
  // changes its text and nothing else, and PUT would imply replacing the whole
  // record.
  patch: <T>(path: string, options?: RequestOptions) => request<T>('PATCH', path, options),
  delete: <T>(path: string, options?: RequestOptions) => request<T>('DELETE', path, options),
  postForm
};

/** Raw fetch for endpoints that stream instead of returning JSON. */
export const streamRequest = async (path: string, body: unknown, signal?: AbortSignal) =>
  fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
    body: JSON.stringify(body),
    signal
  });
