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

const currentAccessToken = async (): Promise<string | null> => {
  const session = readSession();
  if (!session) return null;
  if (!needsRenewal(session)) return session.accessToken;

  renewal ??= (async () => {
    try {
      const { session: fresh } = await authApi.refresh(session.refreshToken);
      return saveSession(fresh).accessToken;
    } catch {
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

const request = async <T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  { body, signal }: RequestOptions = {}
): Promise<T> => {
  const url = `${API_BASE_URL}${path}`;

  const headers: Record<string, string> = await authHeaders();
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const response = await fetch(url, {
    method,
    headers,
    signal,
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
