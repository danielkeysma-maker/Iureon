import { supabase } from '../../config/supabase.config';
import { AuthError, addUserToFirm, type FirmUserRole } from '../auth/auth.service';

/**
 * Running the platform: the firms on it, their plans, their balances.
 *
 * Everything here crosses the tenant boundary, which is why every function is
 * behind `requireSuperAdmin` and every mutation writes to the affected firm's
 * own audit trail — the client can read what was done to them, not only the
 * operator.
 *
 * What is absent is deliberate: no function reads a firm's transcripts, drafts
 * or documents. Managing a tenant and reading its privileged material are
 * different powers, and only the first belongs to running a business.
 */

export interface FirmSummary {
  id: string;
  name: string;
  nit: string;
  planTier: string;
  status: string;
  creditsBalance: number;
  createdAt: string;
  /** How many accounts belong to it. Counts, never contents. */
  users: number;
  /** How many hearings it has transcribed. Counts, never contents. */
  transcriptions: number;
}

const requireClient = () => {
  if (!supabase) {
    throw new AuthError('AUTH_UNAVAILABLE', 'La base de datos no está configurada.', 503);
  }
  return supabase;
};

/**
 * Every firm, with the numbers needed to run the business.
 *
 * The counts are volume, not content: how many hearings a firm has transcribed
 * is billing information, what any of them says is theirs.
 */
export const listFirms = async (): Promise<FirmSummary[]> => {
  const client = requireClient();

  const { data: firms, error } = await client
    .from('firms')
    .select('firm_id, name, nit, plan_tier, subscription_status, credit_balance_cop, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[ADMIN] No se pudieron listar las firmas:', error.message);
    throw new AuthError('FIRMS_UNAVAILABLE', 'No se pudieron listar las firmas.', 502);
  }

  const { data: users } = await client.auth.admin.listUsers();
  const porFirma = new Map<string, number>();
  for (const user of users?.users ?? []) {
    const firmId = (user.app_metadata as Record<string, unknown>)?.firm_id;
    if (typeof firmId === 'string') porFirma.set(firmId, (porFirma.get(firmId) ?? 0) + 1);
  }

  // One query for the ids alone, counted in memory: a per-firm round trip would
  // be a query per row on a screen whose whole point is seeing them together.
  const { data: transcritos } = await client.from('transcriptions').select('firm_id');
  const transcritosPorFirma = new Map<string, number>();
  for (const row of (transcritos ?? []) as { firm_id: string }[]) {
    transcritosPorFirma.set(row.firm_id, (transcritosPorFirma.get(row.firm_id) ?? 0) + 1);
  }

  return (firms ?? []).map((f) => {
    const row = f as {
      firm_id: string;
      name: string;
      nit: string;
      plan_tier: string;
      subscription_status: string;
      credit_balance_cop: number | string;
      created_at: string;
    };

    return {
      id: row.firm_id,
      name: row.name,
      nit: row.nit,
      planTier: row.plan_tier,
      status: row.subscription_status,
      creditsBalance: Number(row.credit_balance_cop ?? 0),
      createdAt: row.created_at,
      users: porFirma.get(row.firm_id) ?? 0,
      transcriptions: transcritosPorFirma.get(row.firm_id) ?? 0
    };
  });
};

/**
 * Creates a client firm and its first administrator, on the operator's behalf.
 *
 * The same shape as self-registration, and for the same reason: an account is
 * issued with its firm already stamped, so one belonging to no firm cannot
 * exist. The difference is who asks — a firm that signs itself up, or an
 * operator onboarding a client who called on the phone.
 */
export const createFirm = async (input: {
  firmName: string;
  nit: string;
  adminEmail: string;
  adminPassword: string;
  initialCredits?: number;
}): Promise<FirmSummary> => {
  const client = requireClient();

  const firmName = input.firmName.trim();
  const nit = input.nit.trim();

  if (!firmName || !nit) {
    throw new AuthError('INVALID_FIRM', 'Se requieren el nombre y el NIT de la firma.');
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
  const credits = Number.isFinite(input.initialCredits) ? Number(input.initialCredits) : 0;

  const { error: firmError } = await client.from('firms').insert({
    firm_id: firmId,
    name: firmName,
    nit,
    plan_tier: 'PRO_FIRM',
    subscription_status: 'active',
    credit_balance_cop: credits
  });

  if (firmError) {
    console.error('[ADMIN] No se pudo crear la firma:', firmError.message);
    throw new AuthError('FIRM_NOT_CREATED', 'No se pudo crear la firma.', 502);
  }

  // Throws on a duplicate e-mail, leaving the firm row behind for a retry to
  // reuse — the same trade the self-registration path makes, and for the same
  // reason: an empty firm is inert, an account pointing at nothing is not.
  await addUserToFirm(firmId, {
    email: input.adminEmail,
    password: input.adminPassword,
    role: 'FIRM_ADMIN'
  });

  return {
    id: firmId,
    name: firmName,
    nit,
    planTier: 'PRO_FIRM',
    status: 'active',
    creditsBalance: credits,
    createdAt: new Date().toISOString(),
    users: 1,
    transcriptions: 0
  };
};

/**
 * Adds credit to a firm's balance.
 *
 * Read-then-write rather than a raw increment, so the amount added and the
 * resulting balance can both be recorded: an audit line saying "recharged" with
 * no figures explains nothing when a client disputes it.
 */
export const addCredits = async (firmId: string, amount: number): Promise<number> => {
  const client = requireClient();

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new AuthError('INVALID_AMOUNT', 'El monto de la recarga debe ser mayor que cero.');
  }

  const { data: firm } = await client
    .from('firms')
    .select('credit_balance_cop')
    .eq('firm_id', firmId)
    .maybeSingle();

  if (!firm) {
    throw new AuthError('FIRM_NOT_FOUND', 'No existe esa firma.', 404);
  }

  const nuevo = Number((firm as { credit_balance_cop: number | string }).credit_balance_cop ?? 0) + amount;

  const { error } = await client
    .from('firms')
    .update({ credit_balance_cop: nuevo, updated_at: new Date().toISOString() })
    .eq('firm_id', firmId);

  if (error) {
    console.error('[ADMIN] No se pudo recargar:', error.message);
    throw new AuthError('RECHARGE_FAILED', 'No se pudo aplicar la recarga.', 502);
  }

  return nuevo;
};

const PLANES = new Set(['PRO_FIRM', 'INDEPENDIENTE', 'ENTERPRISE']);
const ESTADOS = new Set(['active', 'past_due', 'canceled']);

/** Changes a firm's plan or subscription status. */
export const updateFirm = async (
  firmId: string,
  changes: { planTier?: string; status?: string; name?: string }
): Promise<void> => {
  const client = requireClient();

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (changes.name?.trim()) patch.name = changes.name.trim();

  if (changes.planTier) {
    if (!PLANES.has(changes.planTier)) {
      throw new AuthError('INVALID_PLAN', 'Ese plan no existe.');
    }
    patch.plan_tier = changes.planTier;
  }

  if (changes.status) {
    if (!ESTADOS.has(changes.status)) {
      throw new AuthError('INVALID_STATUS', 'Ese estado de suscripción no existe.');
    }
    patch.subscription_status = changes.status;
  }

  // Only the timestamp would change, which reads in the audit trail as an edit
  // that never happened.
  if (Object.keys(patch).length === 1) {
    throw new AuthError('NOTHING_TO_UPDATE', 'No hay nada que cambiar.');
  }

  const { error } = await client.from('firms').update(patch).eq('firm_id', firmId);

  if (error) {
    console.error('[ADMIN] No se pudo actualizar la firma:', error.message);
    throw new AuthError('UPDATE_FAILED', 'No se pudo actualizar la firma.', 502);
  }
};

/** Adds an account to any firm, for onboarding and support. */
export const addUserToAnyFirm = async (
  firmId: string,
  input: { email: string; password: string; role: FirmUserRole }
) => {
  const client = requireClient();

  const { data: firm } = await client
    .from('firms')
    .select('firm_id')
    .eq('firm_id', firmId)
    .maybeSingle();

  if (!firm) {
    throw new AuthError('FIRM_NOT_FOUND', 'No existe esa firma.', 404);
  }

  // Never SUPER_ADMIN through an endpoint, not even this one: the operator role
  // is created against the database on purpose, so it can never be granted by
  // something reachable over the network.
  const role: FirmUserRole = input.role === 'FIRM_ADMIN' ? 'FIRM_ADMIN' : 'LAWYER';

  return addUserToFirm(firmId, { email: input.email, password: input.password, role });
};
