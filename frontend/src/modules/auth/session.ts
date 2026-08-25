/**
 * The signed-in session: the only place the app learns which firm it is in.
 *
 * WHAT THIS REPLACES. The firm used to be a string in `localStorage` under
 * `iureon_registered_firms`, written by whoever filled the registration form
 * and sent to the server as `x-firm-id`. The server believed it, so the tenant
 * boundary was a value the browser chose — and the firms were never persisted
 * anywhere else, so clearing site data destroyed the tenant while its hearings
 * stayed in the database, unreachable.
 *
 * Now the firm arrives inside a token the server signs and verifies. The
 * browser still stores it, because a session has to survive a reload, but it
 * can no longer invent one: an edited token fails its signature and every
 * request comes back 401.
 */

export interface SessionUser {
  id: string;
  email: string;
  firmId: string;
  role: 'SUPER_ADMIN' | 'FIRM_ADMIN' | 'LAWYER';
}

export interface Session {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: SessionUser;
}

interface StoredSession extends Session {
  /** Absolute epoch ms the access token stops being accepted. */
  expiresAt: number;
}

const KEY = 'iureon_session';

/**
 * Refresh this long before expiry rather than on the first 401.
 *
 * A hearing runs longer than an access token lives, so the interesting moment
 * is always mid-work: the lawyer corrects a name at minute 61 and the write
 * fails. Renewing early means the expiry never lands on top of an edit.
 */
const RENEW_MARGIN_MS = 5 * 60 * 1000;

export const saveSession = (session: Session): StoredSession => {
  const stored: StoredSession = {
    ...session,
    expiresAt: Date.now() + session.expiresIn * 1000
  };

  try {
    localStorage.setItem(KEY, JSON.stringify(stored));
  } catch (err) {
    // Worth continuing rather than failing the sign-in: the session still works
    // for this tab, it just will not survive a reload.
    console.warn('No se pudo guardar la sesión:', err);
  }

  return stored;
};

export const readSession = (): StoredSession | null => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as StoredSession;

    // A token without a firm is not a session: every screen below is
    // tenant-scoped, and the server refuses it anyway.
    if (!parsed?.accessToken || !parsed?.user?.firmId) return null;

    return parsed;
  } catch {
    return null;
  }
};

export const clearSession = (): void => {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* Nothing to do: the in-memory session is dropped by the caller regardless. */
  }
};

export const needsRenewal = (session: StoredSession): boolean =>
  Date.now() > session.expiresAt - RENEW_MARGIN_MS;

export type { StoredSession };
