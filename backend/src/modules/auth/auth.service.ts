import { supabase, supabaseAuth } from '../../config/supabase.config';
import { validarBorradoDePropioUsuario } from './borrado.rules';
import { describirPlan, leerPlan } from '../subscriptions/plan.service';

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
 * Adds an account to an existing firm.
 *
 * THE ONLY WAY AN ACCOUNT COMES INTO BEING, and it always needs a firm that
 * already exists. Public self-registration was removed: it let anyone create a
 * tenant and start using the product without ever becoming a client, which is
 * not a security defect but a business one — and the two are the same shape
 * here, since a tenant is what the product bills.
 *
 * Firms are created by the operator (see modules/admin) or, for the very first
 * account on an empty database, by `npm run superadmin`.
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

/** Un usuario de la firma, como lo administra un socio. */
export interface UsuarioDeFirma {
  id: string;
  email: string;
  role: FirmUserRole;
  creadoEl: string;
  /** null si nunca ha entrado — que es informacion, no un hueco. */
  ultimoAcceso: string | null;
  desactivado: boolean;
}

/**
 * Los usuarios de UNA firma, leidos de Supabase Auth.
 *
 * `listUsers` es global y se filtra aqui por app_metadata.firm_id — el mismo
 * metadato que el middleware usa para resolver el tenant, asi que la lista y
 * el acceso no pueden contar historias distintas.
 */
export const listFirmUsers = async (firmId: string): Promise<UsuarioDeFirma[]> => {
  const client = requireSupabase();

  const { data, error } = await client.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw new AuthError('USERS_UNAVAILABLE', 'No se pudieron listar los usuarios.', 502);

  return (data?.users ?? [])
    .filter((u) => (u.app_metadata as Record<string, unknown>)?.firm_id === firmId)
    .map((u) => ({
      id: u.id,
      email: u.email ?? '',
      role: ((u.app_metadata as Record<string, unknown>)?.role as FirmUserRole) ?? 'LAWYER',
      creadoEl: u.created_at,
      ultimoAcceso: u.last_sign_in_at ?? null,
      // GoTrue expresa el bloqueo como banned_until en el futuro.
      desactivado: Boolean(
        (u as { banned_until?: string }).banned_until &&
          new Date((u as { banned_until?: string }).banned_until as string) > new Date()
      )
    }))
    .sort((a, b) => a.email.localeCompare(b.email));
};

/** El usuario, solo si pertenece a la firma del que pregunta. */
export const usuarioDeLaFirma = async (firmId: string, userId: string) => {
  const client = requireSupabase();
  const { data, error } = await client.auth.admin.getUserById(userId);

  if (error || !data.user) {
    throw new AuthError('USER_NOT_FOUND', 'Ese usuario no existe.', 404);
  }
  if ((data.user.app_metadata as Record<string, unknown>)?.firm_id !== firmId) {
    // 404 y no 403: confirmar que el id existe en OTRA firma ya es filtrar.
    throw new AuthError('USER_NOT_FOUND', 'Ese usuario no existe.', 404);
  }
  return data.user;
};

/**
 * Desactiva o reactiva. AL DESACTIVAR NADA SE BORRA: sus escritos, sus
 * verificaciones y su rastro en auditoria permanecen — solo pierde el acceso.
 * Por eso es un ban y no un delete: borrar la cuenta rompe la autoria de todo
 * lo que esa persona hizo.
 */
export const setUserActive = async (
  firmId: string,
  userId: string,
  activo: boolean,
  quienLlama: string
): Promise<void> => {
  const client = requireSupabase();
  const objetivo = await usuarioDeLaFirma(firmId, userId);

  if (objetivo.email?.toLowerCase() === quienLlama.toLowerCase()) {
    throw new AuthError('SELF_LOCKOUT', 'No puede desactivarse a sí mismo: la firma quedaría sin ese administrador.', 400);
  }

  const { error } = await client.auth.admin.updateUserById(userId, {
    // 100 años o cero: GoTrue no tiene "indefinido" y esto es lo mas cercano.
    ban_duration: activo ? 'none' : '876000h'
  });

  if (error) throw new AuthError('USER_UPDATE_FAILED', 'No se pudo cambiar el estado del usuario.', 502);
};

/** Cambia el rol dentro de la firma. Nunca SUPER_ADMIN, y nunca a uno mismo. */
export const setUserRole = async (
  firmId: string,
  userId: string,
  role: 'FIRM_ADMIN' | 'LAWYER',
  quienLlama: string
): Promise<void> => {
  const client = requireSupabase();
  const objetivo = await usuarioDeLaFirma(firmId, userId);

  if (objetivo.email?.toLowerCase() === quienLlama.toLowerCase()) {
    // Bajarse a si mismo de rol dejaria una firma sin administradores sin que
    // nadie lo decidiera; subirse no aplica (ya es admin si puede llamar esto).
    throw new AuthError('SELF_DEMOTION', 'No puede cambiar su propio rol.', 400);
  }

  const { error } = await client.auth.admin.updateUserById(userId, {
    app_metadata: { ...(objetivo.app_metadata as Record<string, unknown>), role }
  });

  if (error) throw new AuthError('USER_UPDATE_FAILED', 'No se pudo cambiar el rol.', 502);
};

/**
 * A lawyer deleting THEIR OWN account, from Ajustes → «Su cuenta».
 *
 * The password is checked by signing in again: no separate verify endpoint,
 * no second source of truth about what the password is. The rules (last user,
 * last administrator, never the operator) are in `borrado.rules.ts`.
 *
 * WHAT GOES: the account, its push subscriptions and its interface
 * preferences. WHAT STAYS: drafts, reviews and transcripts, which are the
 * firm's work product and keep the author's e-mail as text. The caller
 * audits it under the firm: the firm is still there to read it.
 */
export const eliminarMiUsuario = async (input: {
  user: AuthenticatedUser;
  contrasena: string;
}): Promise<void> => {
  const client = requireSupabase();

  const usuarios = await listFirmUsers(input.user.firmId);
  validarBorradoDePropioUsuario({
    role: input.user.role,
    totalUsuarios: usuarios.length,
    totalAdministradores: usuarios.filter((u) => u.role === 'FIRM_ADMIN').length
  });

  try {
    await signIn(input.user.email, input.contrasena);
  } catch {
    throw new AuthError('WRONG_PASSWORD', 'La contraseña no es correcta.', 401);
  }

  // Their device rows first: after the account is gone nothing else names them.
  await client
    .from('push_subscriptions')
    .delete()
    .eq('firm_id', input.user.firmId)
    .eq('user_email', input.user.email);
  await client
    .from('user_preferences')
    .delete()
    .eq('firm_id', input.user.firmId)
    .eq('user_email', input.user.email);

  const { error } = await client.auth.admin.deleteUser(input.user.id);
  if (error) {
    throw new AuthError('USER_DELETE_FAILED', 'No se pudo eliminar su usuario.', 502);
  }
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

  /*
   * The plan travels with the session so the shell can hide the modules an
   * ESENCIAL firm does not have and show the expiry banner without a second
   * round trip. Read separately and cheaply (no user count): the count belongs
   * to the plan screen, which asks /api/subscription/plan.
   */
  const plan = describirPlan(await leerPlan(firmId), 0);

  return {
    id: data.firm_id,
    name: data.name,
    nit: data.nit,
    planTier: data.plan_tier,
    status: data.subscription_status,
    creditsBalance: Number(data.credit_balance_cop ?? 0),
    plan: {
      plan: plan.plan,
      period: plan.period,
      validUntil: plan.validUntil,
      maxUsers: plan.maxUsers,
      estado: plan.estado,
      diasRestantes: plan.diasRestantes,
      modulosPermitidos: plan.modulosPermitidos
    }
  };
};
