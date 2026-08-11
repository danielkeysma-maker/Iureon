import { API_BASE_URL } from './api.config';

/**
 * Single entry point for backend calls.
 *
 * Every `/api` route is behind the x-firm-id middleware, so the tenant is a
 * required argument rather than an optional header a caller might forget. That
 * is deliberate: five components previously sent a hardcoded firm id, which
 * silently routed their reads and writes to the wrong tenant.
 */

export class ApiError extends Error {
  readonly status: number;
  readonly url: string;

  constructor(message: string, status: number, url: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.url = url;
  }
}

interface RequestOptions {
  /** Tenant the request is scoped to. Sent as the x-firm-id header. */
  firmId: string;
  body?: unknown;
  signal?: AbortSignal;
}

const request = async <T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  { firmId, body, signal }: RequestOptions
): Promise<T> => {
  const url = `${API_BASE_URL}${path}`;

  const headers: Record<string, string> = { 'x-firm-id': firmId };
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const response = await fetch(url, {
    method,
    headers,
    signal,
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  if (!response.ok) {
    throw new ApiError(`${method} ${path} failed with ${response.status}`, response.status, url);
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
  { firmId, signal }: Omit<RequestOptions, 'body'>
): Promise<T> => {
  const url = `${API_BASE_URL}${path}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'x-firm-id': firmId },
    body: form,
    signal
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    // The API explains upload failures in Spanish for the lawyer; keep that
    // message rather than replacing it with a status code.
    throw new ApiError(
      payload?.message || `POST ${path} failed with ${response.status}`,
      response.status,
      url
    );
  }

  return payload as T;
};

export const httpClient = {
  get: <T>(path: string, options: RequestOptions) => request<T>('GET', path, options),
  post: <T>(path: string, options: RequestOptions) => request<T>('POST', path, options),
  put: <T>(path: string, options: RequestOptions) => request<T>('PUT', path, options),
  delete: <T>(path: string, options: RequestOptions) => request<T>('DELETE', path, options),
  postForm
};

/** Raw fetch for endpoints that stream instead of returning JSON. */
export const streamRequest = (path: string, firmId: string, body: unknown, signal?: AbortSignal) =>
  fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-firm-id': firmId },
    body: JSON.stringify(body),
    signal
  });
