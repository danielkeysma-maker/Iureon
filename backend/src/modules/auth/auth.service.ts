import { supabase, supabaseAuth } from '../../config/supabase.config';

/**
 * Real identity for Iureon: who the user is, and which firm they belong to.
 *
 * WHY THIS REPLACES A HEADER. Until now the tenant travelled as `x-firm-id`,
 * a string the browser chose and the server believed. Isolation held in the
 * database — every query filters by firm — but the filter ran on a value the
 * caller supplied, so reading another firm's hearings needed nothing but their
 * id. The firms themselves lived only in localStorage; the `firms` table was
 * empty, and losing the browser lost the tenant.
 *
 * WHY THE FIRM LIVES IN app_metadata. Supabase splits a user's metadata in two:
 * `user_metadata`, which the user can edit with their own session, and
 * `app_metadata`, which ONLY the service role can write. The firm has to be in
 * the second one, or the tenant boundary would again be client-controlled — the
 * same defect wearing a JWT. The database was already built for this:
 * `current_firm_id()` in schema.sql reads `auth.jwt() -> app_metadata ->>
 * 'firm_id'` and every RLS policy compares against it.
 *
 * WHY USERS ARE CREATED SERVER-SIDE. The project's Supabase requires e-mail
 * confirmation and has no SMTP of its own, so a client-side signup would strand
 * every account behind an e-mail nobody can send. Creating them here with the
 * admin API solves that and is the correct shape anyway: an account is issued
 * WITH its firm already stamped, never assigned afterwards, so an account
 * belonging to no firm — or to one it chose itself — cannot exist.
 */

export type FirmUserRole = 'SUPER_ADMIN' | 'FIRM_ADMIN' | 'LAWYER';

export interface AuthenticatedUser {
  id: string;
  email: string;
  firmId: string;
  role: FirmUserRole;
}

export interface Session {
  accessToken: string;
  refreshToken: string;
  /** Seconds until the access token expires; the client refreshes before then. */
  expiresIn: number;
  user: AuthenticatedUser;
}

export class AuthError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(code: string, message: string, status = 400) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
    this.status = status;
  }
}

/**
 * The credential client, for sign-in, refresh and token verification.
 *
 * Separate from the database client because signing in MUTATES the instance —
 * it starts sending that user's token instead of the service key. Sharing one
 * made registering a second firm fail under RLS as the first firm's
 * administrator, and on a warm serverless instance would have leaked a tenant
 * between requests.
 */
const requireAuthClient = () => {
  if (!supabaseAuth) {
    throw new AuthError(
      'AUTH_UNAVAILABLE',
      'La autenticación no está configurada en el servidor.',
      503
    );
  }
  return supabaseAuth;
};

const requireSupabase = () => {
  if (!supabase) {
    throw new AuthError(
      'AUTH_UNAVAILABLE',
      'La autenticación no está configurada en el servidor.',
      503
    );
  }
  return supabase;
};

/**
 * Reads the firm and role a token actually carries.
 *
 * The token is verified against Supabase rather than decoded here: a signature
 * this process does not check is a signature nobody checks, and a forged
 * `app_metadata` would hand over any tenant.
 */
export const userFromToken = async (accessToken: string): Promise<AuthenticatedUser | null> => {
  const { data, error } = await requireAuthClient().auth.getUser(accessToken);

  if (error || !data.user) return null;

  const metadata = (data.user.app_metadata ?? {}) as Record<string, unknown>;
  const firmId = typeof metadata.firm_id === 'string' ? metadata.firm_id : '';

  // An account with no firm is not a lesser account, it is an unusable one:
  // every route below the middleware is tenant-scoped. Treated as unauthorized
  // rather than defaulted to something, because defaulting a tenant is how the
  // header version went wrong.
  if (!firmId) return null;

  const role = (metadata.role as FirmUserRole) ?? 'LAWYER';

  return { id: data.user.id, email: data.user.email ?? '', firmId, role };
};

/** Exchanges e-mail and password for a session. */
export const signIn = async (email: string, password: string): Promise<Session> => {
  const { data, error } = await requireAuthClient().auth.signInWithPassword({ email, password });

  if (error || !data.session) {
    // Deliberately one message for a wrong password and an unknown address:
    // telling them apart tells an attacker which e-mails have accounts.
    throw new AuthError('INVALID_CREDENTIALS', 'Correo o contraseña incorrectos.', 401);
  }

  const user = await userFromToken(data.session.access_token);

  if (!user) {
    throw new AuthError(
      'NO_FIRM',
      'Esta cuenta no está asociada a ninguna firma. Contacta al administrador de tu firma.',
      403
    );
  }

  return {
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    expiresIn: data.session.expires_in ?? 3600,
    user
  };
};

/**
 * Trades a refresh token for a fresh session.
 *
 * Not a convenience: access tokens last an hour and a hearing lasts two, so
 * without this the transcript screen would start failing mid-audiencia with
 * nothing on it to explain why.
 */
export const refreshSession = async (refreshToken: string): Promise<Session> => {
  const { data, error } = await requireAuthClient().auth.refreshSession({ refresh_token: refreshToken });

  if (error || !data.session) {
    throw new AuthError('SESSION_EXPIRED', 'La sesión expiró. Vuelve a iniciar sesión.', 401);
  }

  const user = await userFromToken(data.session.access_token);

  if (!user) {
    throw new AuthError('NO_FIRM', 'Esta cuenta no está asociada a ninguna firma.', 403);
  }

  return {
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    expiresIn: data.session.expires_in ?? 3600,
    user
  };
};

/**
 * Registers a firm and issues its first account, as one transaction in intent.
 *
 * The firm row is written FIRST and the user second, because the user carries
 * the firm's id and an account pointing at a firm that does not exist is worse
 * than a firm with nobody in it: the first is a session the middleware accepts
 * and every query then fails on, the second is an empty registry row a retry
 * can reuse.
 */
export const registerFirm = async (input: {
  firmName: string;
  nit: string;
  email: string;
  password: string;
}): Promise<Session> => {
  const client = requireSupabase();

  const firmName = input.firmName.trim();
  const nit = input.nit.trim();
  const email = input.email.trim().toLowerCase();

  if (!firmName || !nit) {
    throw new AuthError('INVALID_FIRM', 'Se requieren el nombre y el NIT de la firma.');
  }

  if (input.password.length < 8) {
    throw new AuthError('WEAK_PASSWORD', 'La contraseña debe tener al menos 8 caracteres.');
  }

  const { data: existing } = await client
    .from('firms')
    .select('firm_id')
    .eq('nit', nit)
    .maybeSingle();

  if (existing) {
    throw new AuthError('FIRM_EXISTS', 'Ya hay una firma registrada con ese NIT.', 409);
  }

  const firmId = `firm-${Date.now()}`;

  const { error: firmError } = await client.from('firms').insert({
    firm_id: firmId,
    name: firmName,
    nit,
    plan_tier: 'PRO_FIRM',
    subscription_status: 'active'
  });

  if (firmError) {
    console.error('[AUTH] No se pudo crear la firma:', firmError.message);
    throw new AuthError('FIRM_NOT_CREATED', 'No se pudo registrar la firma.', 502);
  }

  const { data: created, error: userError } = await client.auth.admin.createUser({
    email,
    password: input.password,
    // Confirmed here because this project has no outbound mail: the alternative
    // is an account nobody can ever activate.
    email_confirm: true,
    app_metadata: { firm_id: firmId, role: 'FIRM_ADMIN' satisfies FirmUserRole }
  });

  if (userError || !created.user) {
    // The firm row is left behind on purpose. Deleting it would race a
    // concurrent retry, and an empty firm is inert — nothing reads it until an
    // account points at it.
    console.error('[AUTH] No se pudo crear el usuario:', userError?.message);

    const alreadyRegistered = /already|exists|registered/i.test(userError?.message ?? '');
    throw new AuthError(
      alreadyRegistered ? 'EMAIL_EXISTS' : 'USER_NOT_CREATED',
      alreadyRegistered
        ? 'Ese correo ya tiene una cuenta. Inicia sesión.'
        : 'No se pudo crear la cuenta.',
      alreadyRegistered ? 409 : 502
    );
  }

  return signIn(email, input.password);
};

/**
 * Adds a lawyer to an existing firm.
 *
 * The firm comes from the CALLER'S session, never from the request body — the
 * whole point of this module is that no client names its own tenant, and an
 * invitation endpoint that accepted a firm id would reopen the hole at the one
 * place that writes new members into it.
 */
export const addUserToFirm = async (
  firmId: string,
  input: { email: string; password: string; role: FirmUserRole }
): Promise<{ id: string; email: string }> => {
  const client = requireSupabase();
  const email = input.email.trim().toLowerCase();

  if (input.password.length < 8) {
    throw new AuthError('WEAK_PASSWORD', 'La contraseña debe tener al menos 8 caracteres.');
  }

  const { data: created, error } = await client.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: true,
    app_metadata: { firm_id: firmId, role: input.role }
  });

  if (error || !created.user) {
    const alreadyRegistered = /already|exists|registered/i.test(error?.message ?? '');
    throw new AuthError(
      alreadyRegistered ? 'EMAIL_EXISTS' : 'USER_NOT_CREATED',
      alreadyRegistered ? 'Ese correo ya tiene una cuenta.' : 'No se pudo crear la cuenta.',
      alreadyRegistered ? 409 : 502
    );
  }

  return { id: created.user.id, email: created.user.email ?? email };
};

/** The firm's own registry row, for the header and the subscription screen. */
export const firmProfile = async (firmId: string) => {
  const client = requireSupabase();

  const { data, error } = await client
    .from('firms')
    .select('firm_id, name, nit, plan_tier, subscription_status, credit_balance_cop')
    .eq('firm_id', firmId)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.firm_id,
    name: data.name,
    nit: data.nit,
    planTier: data.plan_tier,
    status: data.subscription_status,
    creditsBalance: Number(data.credit_balance_cop ?? 0)
  };
};
