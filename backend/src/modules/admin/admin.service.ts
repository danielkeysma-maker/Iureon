import { catalogService } from '../catalog/catalog.service';
import { supabase } from '../../config/supabase.config';
import {
  AuthError,
  addUserToFirm,
  listFirmUsers,
  type FirmUserRole
} from '../auth/auth.service';
import { consumoDelMesPorUsuario } from '../billing/billing.service';
import { auditService, type AuditLogEntry } from '../audit/audit.service';

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
  /** Lo cobrado en los últimos 30 días. Vuelve el saldo legible: días de vida, no pesos. */
  consumo30dCop: number;
  /** Verificaciones propias de la firma, contra el total del catálogo. */
  catalogoCuradas: number;
  catalogoTotal: number;
}

const requireClient = () => {
  if (!supabase) {
    throw new AuthError('AUTH_UNAVAILABLE', 'La base de datos no está configurada.', 503);
  }
  return supabase;
};

interface FirmRow {
  firm_id: string;
  name: string;
  nit: string;
  plan_tier: string;
  subscription_status: string;
  credit_balance_cop: number | string;
  created_at: string;
}

const FIRM_COLUMNS =
  'firm_id, name, nit, plan_tier, subscription_status, credit_balance_cop, created_at';

/** The volume figures a firm is judged by. Counts, never contents. */
interface FirmVolumes {
  users: number;
  transcriptions: number;
  consumo30dCop: number;
  catalogoCuradas: number;
}

/**
 * The volume figures, for every firm or for one.
 *
 * ONE IMPLEMENTATION, TWO SCREENS. The list (7a) and the firm's own page (7b)
 * show the same numbers and must agree; two copies of this arithmetic would
 * drift and the drift would only be visible to whoever compared the screens.
 * `scope` narrows each query when a single firm is asked for, so opening one
 * firm does not pay for reading the whole platform.
 *
 * ─── LAS DOS COLUMNAS DE PRIMERA CLASE DEL 7a ─────────────────────────────
 *
 * CONSUMO 30 DIAS: de credit_movements CONSUMO (la plata autoritativa),
 * agrupado en memoria. Es lo que vuelve el saldo LEGIBLE: $41.200 no dice
 * nada; "4 dias al ritmo actual" es una alarma operable.
 *
 * CATALOGO CURADO: verificaciones de la firma contadas contra el total del
 * catalogo. Es la salud del activo que la firma construye — una firma con 2%
 * curado a los seis meses esta usando el producto a medias, y eso se ve aqui
 * antes de que se vea en el churn.
 */
const firmVolumes = async (scope?: string): Promise<Map<string, FirmVolumes>> => {
  const client = requireClient();
  const volumes = new Map<string, FirmVolumes>();

  const bucket = (firmId: string): FirmVolumes => {
    let current = volumes.get(firmId);
    if (!current) {
      current = { users: 0, transcriptions: 0, consumo30dCop: 0, catalogoCuradas: 0 };
      volumes.set(firmId, current);
    }
    return current;
  };

  // GoTrue has no server-side filter on app_metadata, so the accounts are always
  // read whole and narrowed here.
  const { data: users } = await client.auth.admin.listUsers();
  for (const user of users?.users ?? []) {
    const firmId = (user.app_metadata as Record<string, unknown>)?.firm_id;
    if (typeof firmId !== 'string') continue;
    if (scope && firmId !== scope) continue;
    bucket(firmId).users += 1;
  }

  // One query for the ids alone, counted in memory: a per-firm round trip would
  // be a query per row on a screen whose whole point is seeing them together.
  let transcriptionsQuery = client.from('transcriptions').select('firm_id');
  if (scope) transcriptionsQuery = transcriptionsQuery.eq('firm_id', scope);
  const { data: transcritos } = await transcriptionsQuery;
  for (const row of (transcritos ?? []) as { firm_id: string }[]) {
    bucket(row.firm_id).transcriptions += 1;
  }

  const hace30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  let consumoQuery = client
    .from('credit_movements')
    .select('firm_id, amount_cop')
    .eq('kind', 'CONSUMO')
    .gte('created_at', hace30);
  if (scope) consumoQuery = consumoQuery.eq('firm_id', scope);
  const { data: consumos } = await consumoQuery;
  for (const row of (consumos ?? []) as { firm_id: string; amount_cop: number }[]) {
    bucket(row.firm_id).consumo30dCop += Math.abs(Number(row.amount_cop ?? 0));
  }

  let verificacionesQuery = client.from('catalog_verifications').select('firm_id');
  if (scope) verificacionesQuery = verificacionesQuery.eq('firm_id', scope);
  const { data: verificaciones } = await verificacionesQuery;
  for (const row of (verificaciones ?? []) as { firm_id: string }[]) {
    bucket(row.firm_id).catalogoCuradas += 1;
  }

  return volumes;
};

const EMPTY_VOLUMES: FirmVolumes = {
  users: 0,
  transcriptions: 0,
  consumo30dCop: 0,
  catalogoCuradas: 0
};

const toSummary = (row: FirmRow, volumes: FirmVolumes, catalogoTotal: number): FirmSummary => ({
  id: row.firm_id,
  name: row.name,
  nit: row.nit,
  planTier: row.plan_tier,
  status: row.subscription_status,
  creditsBalance: Number(row.credit_balance_cop ?? 0),
  createdAt: row.created_at,
  users: volumes.users,
  transcriptions: volumes.transcriptions,
  consumo30dCop: volumes.consumo30dCop,
  catalogoCuradas: volumes.catalogoCuradas,
  catalogoTotal
});

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
    .select(FIRM_COLUMNS)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[ADMIN] No se pudieron listar las firmas:', error.message);
    throw new AuthError('FIRMS_UNAVAILABLE', 'No se pudieron listar las firmas.', 502);
  }

  const volumes = await firmVolumes();
  const catalogoTotal = catalogService.list().length;

  return ((firms ?? []) as unknown as FirmRow[]).map((row) =>
    toSummary(row, volumes.get(row.firm_id) ?? EMPTY_VOLUMES, catalogoTotal)
  );
};

/**
 * The actions the operator console itself performs on a firm.
 *
 * Nothing else in the product writes them — they are emitted only by this
 * module's controllers — so the trail filtered down to them is exactly "what
 * was done TO this firm from the outside", which is what both the operator and
 * the firm's own partners need to read.
 */
const OPERATION_ACTIONS = new Set([
  'FIRM_CREATED',
  'FIRM_UPDATED',
  'FIRM_CREDITS_ADDED',
  'FIRM_STATUS_CHANGED',
  'USER_CREATED'
]);

export interface FirmUserDetail {
  id: string;
  email: string;
  role: string;
  /** Charged this calendar month, from `ai_usage`. Zero means it drafted nothing. */
  consumoMesCop: number;
  /** `null` for an account that has never signed in — not a zero, an absence. */
  ultimoAcceso: string | null;
  creadoEl: string;
  desactivado: boolean;
}

export interface FirmDetail extends FirmSummary {
  /**
   * Days the balance lasts at the last 30 days' rate.
   *
   * `null` when nothing was consumed in those 30 days: there is no rate, so
   * there is no number of days, and inventing one would be the exact failure
   * this codebase refuses.
   */
  diasDeSaldo: number | null;
  /** Accounts that signed in over the last 14 days, of the firm's total. */
  usuariosActivos14d: number;
  usuarios: FirmUserDetail[];
  registroDeOperacion: AuditLogEntry[];
}

/**
 * One firm, whole: identity, money, accounts, catalogue health and the record of
 * what operation has done to it.
 *
 * WHAT IS ABSENT IS THE POINT. Not one field here reads a transcript, a draft, a
 * client or a document. Running a tenant and reading its privileged material are
 * different powers, and this endpoint only exercises the first.
 */
export const getFirmDetail = async (firmId: string): Promise<FirmDetail> => {
  const client = requireClient();

  const { data: firm, error } = await client
    .from('firms')
    .select(FIRM_COLUMNS)
    .eq('firm_id', firmId)
    .maybeSingle();

  if (error) {
    console.error('[ADMIN] No se pudo leer la firma:', error.message);
    throw new AuthError('FIRM_UNAVAILABLE', 'No se pudo leer la firma.', 502);
  }
  if (!firm) {
    throw new AuthError('FIRM_NOT_FOUND', 'No existe esa firma.', 404);
  }

  const row = firm as unknown as FirmRow;

  const [volumes, cuentas, consumoPorUsuario, trail] = await Promise.all([
    firmVolumes(firmId),
    listFirmUsers(firmId),
    consumoDelMesPorUsuario(firmId),
    auditService.getAuditLogs(firmId, 200)
  ]);

  const summary = toSummary(
    row,
    volumes.get(firmId) ?? EMPTY_VOLUMES,
    catalogService.list().length
  );

  const ritmoDiario = summary.consumo30dCop / 30;
  const hace14 = Date.now() - 14 * 24 * 60 * 60 * 1000;

  return {
    ...summary,
    // The account count comes from the same listing the rows come from, so the
    // header and the table can never disagree.
    users: cuentas.length,
    diasDeSaldo: ritmoDiario > 0 ? Math.floor(summary.creditsBalance / ritmoDiario) : null,
    usuariosActivos14d: cuentas.filter(
      (u) => u.ultimoAcceso && new Date(u.ultimoAcceso).getTime() >= hace14
    ).length,
    usuarios: cuentas.map((u) => ({
      id: u.id,
      email: u.email,
      role: u.role,
      consumoMesCop: consumoPorUsuario[u.email] ?? 0,
      ultimoAcceso: u.ultimoAcceso,
      creadoEl: u.creadoEl,
      desactivado: u.desactivado
    })),
    registroDeOperacion: trail.filter((entry) => OPERATION_ACTIONS.has(entry.action))
  };
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
    transcriptions: 0,
    consumo30dCop: 0,
    catalogoCuradas: 0,
    catalogoTotal: catalogService.list().length
  };
};

/** Shortest reason that can actually say something. "ok", "test" and "." cannot. */
const MIN_REASON_LENGTH = 10;

/**
 * The written reason every operation mutation must carry.
 *
 * WHY IT IS ENFORCED HERE AND NOT AT THE EDGE. The reason is not input
 * validation, it is the substance of the audit line: the firm's partners read
 * this trail and "plan cambiado" tells them nothing, "plan cambiado a Despacho a
 * solicitud de C. Restrepo, ticket 412" tells them whether to object. A rule
 * that lives in the service cannot be forgotten by a controller added later.
 *
 * WHITESPACE IS COLLAPSED BEFORE MEASURING because a field padded with spaces or
 * newlines to clear a length check is exactly the empty reason the rule exists
 * to reject. The normalized text is what gets recorded.
 */
export const requireReason = (raw: unknown): string => {
  const reason = typeof raw === 'string' ? raw.replace(/\s+/g, ' ').trim() : '';

  if (reason.length < MIN_REASON_LENGTH) {
    throw new AuthError(
      'REASON_REQUIRED',
      'Toda acción de operación exige un motivo escrito: al menos 10 caracteres, y lo leerán los socios de la firma.',
      400
    );
  }

  return reason;
};

/**
 * Adds credit to a firm's balance.
 *
 * Read-then-write rather than a raw increment, so the amount added and the
 * resulting balance can both be recorded: an audit line saying "recharged" with
 * no figures explains nothing when a client disputes it.
 */
export const addCredits = async (
  firmId: string,
  amount: number,
  reason: unknown
): Promise<{ balance: number; reason: string }> => {
  const client = requireClient();

  // Before touching money: a recharge with no stated reason must not happen at
  // all, not happen and then fail to be explained.
  const motivo = requireReason(reason);

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

  return { balance: nuevo, reason: motivo };
};

const PLANES = new Set(['PRO_FIRM', 'INDEPENDIENTE', 'ENTERPRISE']);
const ESTADOS = new Set(['active', 'past_due', 'canceled']);

/** Changes a firm's plan or subscription status. */
export const updateFirm = async (
  firmId: string,
  changes: { planTier?: string; status?: string; name?: string },
  reason: unknown
): Promise<string> => {
  const client = requireClient();

  const motivo = requireReason(reason);

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

  return motivo;
};

/** Adds an account to any firm, for onboarding and support. */
export const addUserToAnyFirm = async (
  firmId: string,
  input: { email: string; password: string; role: FirmUserRole; reason: unknown }
) => {
  const client = requireClient();

  const motivo = requireReason(input.reason);

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

  const user = await addUserToFirm(firmId, { email: input.email, password: input.password, role });

  return { user, role, reason: motivo };
};
