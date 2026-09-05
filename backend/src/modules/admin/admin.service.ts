import { catalogService } from '../catalog/catalog.service';
import { supabase } from '../../config/supabase.config';
import {
  AuthError,
  addUserToFirm,
  listFirmUsers,
  usuarioDeLaFirma,
  type FirmUserRole
} from '../auth/auth.service';
import { BackblazeB2TenantStorageService } from '../documents/b2.service';
import { validarBorradoDeFirma, validarContrasenaDeOperador } from './admin.rules';
import { consumoDelMesPorUsuario } from '../billing/billing.service';
import { auditService, type AuditLogEntry } from '../audit/audit.service';
import {
  DIAS_DE_PRUEBA,
  PLANES,
  esPeriodo,
  esPlan,
  etiquetaDePeriodo,
  type Plan,
  type PlanPeriod
} from '../subscriptions/plan.catalog';

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
  /** Opcional: hay litigantes y despachos sin NIT. NULL en la base, nunca ''. */
  nit: string | null;
  planTier: string;
  /**
   * The subscription. All three NULL = cortesía legacy: a firm from before the
   * plans existed, unrestricted until the operator assigns one.
   */
  plan: Plan | null;
  planPeriod: PlanPeriod | null;
  planValidUntil: string | null;
  planMaxUsers: number | null;
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
  /** Opcional: hay litigantes y despachos sin NIT. NULL en la base, nunca ''. */
  nit: string | null;
  plan_tier: string;
  plan?: string | null;
  plan_period?: string | null;
  plan_valid_until?: string | null;
  plan_max_users?: number | null;
  subscription_status: string;
  credit_balance_cop: number | string;
  created_at: string;
}

const FIRM_COLUMNS_LEGACY =
  'firm_id, name, nit, plan_tier, subscription_status, credit_balance_cop, created_at';

const FIRM_COLUMNS = `${FIRM_COLUMNS_LEGACY}, plan, plan_period, plan_valid_until, plan_max_users`;

/**
 * Reads firms with the plan columns, and without them if the database does
 * not have them yet.
 *
 * DEPLOY AND MIGRATION ARE TWO MOMENTS. `migration-suscripciones.sql` adds the
 * plan columns; until it runs, selecting them fails and the whole console
 * would go blank over four columns that are NULL anyway. The retry reads what
 * exists and the log names the migration, loudly, once per process.
 */
let columnasAvisadas = false;
const seleccionarFirmas = async (
  filtro?: (q: any) => any
): Promise<{ data: FirmRow[] | null; error: { message: string } | null }> => {
  const client = requireClient();
  const consulta = (columnas: string) => {
    let q: any = client.from('firms').select(columnas);
    if (filtro) q = filtro(q);
    return q;
  };

  const primera = await consulta(FIRM_COLUMNS);
  if (!primera.error) return { data: primera.data as FirmRow[] | null, error: null };

  if (!columnasAvisadas) {
    columnasAvisadas = true;
    console.error(
      '[ADMIN] Las columnas de plan no existen todavía; falta correr ' +
        `supabase/migration-suscripciones.sql. Detalle: ${primera.error.message}`
    );
  }

  const segunda = await consulta(FIRM_COLUMNS_LEGACY);
  return { data: segunda.data as FirmRow[] | null, error: segunda.error };
};

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
  plan: esPlan(row.plan) ? row.plan : null,
  planPeriod: esPeriodo(row.plan_period) ? row.plan_period : null,
  planValidUntil: row.plan_valid_until ?? null,
  planMaxUsers: typeof row.plan_max_users === 'number' ? row.plan_max_users : null,
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

  const { data: firms, error } = await seleccionarFirmas((q) =>
    q.order('created_at', { ascending: false })
  );

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
  'USER_CREATED',
  'PLAN_ACTUALIZADO',
  'PLAN_SUSPENDIDO',
  'CLAVE_RESTABLECIDA_POR_OPERADOR'
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

  const { data: firms, error } = await seleccionarFirmas((q) => q.eq('firm_id', firmId).limit(1));
  const firm = firms?.[0] ?? null;

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
/**
 * The one routine that brings a firm and its first administrator into being.
 *
 * WHY IT IS SHARED. Two doors open a tenant: the operator console (Premium on
 * a 14-day trial, five seats) and the public 7-day trial of Esencial (one
 * seat, no credit). Both must write the same row shape, retry without plan
 * columns the same way and stamp the administrator with the same metadata; a
 * second copy of this in the trial module would drift the day one of them is
 * touched. The caller decides the plan, the period, the days and the seats —
 * this function knows nothing about who is asking.
 *
 * `siFallaLaCuenta` decides what happens to the firm row when the account
 * cannot be created (almost always: the e-mail already exists). The operator
 * keeps it — a retry with a corrected e-mail reuses it, and an empty firm is
 * inert. The public trial deletes it: an anonymous visitor who types an
 * existing address must not leave a tenant behind on every attempt.
 */
export const crearFirmaConAdministrador = async (input: {
  firmName: string;
  nit?: string;
  adminEmail: string;
  adminPassword: string;
  initialCredits?: number;
  plan: Plan;
  period: PlanPeriod;
  /** Days until `plan_valid_until`, counted from now. */
  diasDeVigencia: number;
  maxUsers: number;
  siFallaLaCuenta: 'CONSERVAR_FIRMA' | 'BORRAR_FIRMA';
}): Promise<{ firmId: string; firmName: string; nit: string | null; credits: number; validUntil: string }> => {
  const client = requireClient();

  const firmName = input.firmName.trim();
  /*
   * EL NIT ES OPCIONAL. Un abogado litigante que factura como persona natural
   * no tiene NIT, y tampoco lo tiene un despacho pequeno que aun no lo tramita;
   * exigirlo dejaba fuera a clientes reales. Cuando viene, sigue siendo unico.
   * Vacio se guarda como NULL: la columna es UNIQUE y dos '' chocarian, dos
   * NULL no.
   */
  const nit = (input.nit ?? '').trim() || null;

  if (!firmName) {
    throw new AuthError('INVALID_FIRM', 'Se requiere el nombre de la firma.');
  }

  if (nit) {
    const { data: existing } = await client
      .from('firms')
      .select('firm_id')
      .eq('nit', nit)
      .maybeSingle();

    if (existing) {
      throw new AuthError('FIRM_EXISTS', 'Ya hay una firma registrada con ese NIT.', 409);
    }
  }

  const firmId = `firm-${Date.now()}`;
  const credits = Number.isFinite(input.initialCredits) ? Number(input.initialCredits) : 0;
  const validUntil = new Date(Date.now() + input.diasDeVigencia * 24 * 60 * 60 * 1000).toISOString();
  const filaBase = {
    firm_id: firmId,
    name: firmName,
    nit,
    plan_tier: 'PRO_FIRM',
    subscription_status: 'active',
    credit_balance_cop: credits
  };

  let { error: firmError } = await client.from('firms').insert({
    ...filaBase,
    plan: input.plan,
    plan_period: input.period,
    plan_valid_until: validUntil,
    plan_max_users: input.maxUsers
  });

  // Before migration-suscripciones.sql the plan columns do not exist. The firm
  // is still created — as cortesía, like every firm before plans — and the log
  // says what is missing, so onboarding a client never waits on a migration.
  if (firmError) {
    console.error(
      '[ADMIN] No se pudo crear la firma con plan; se reintenta sin plan. ' +
        `Falta correr supabase/migration-suscripciones.sql. Detalle: ${firmError.message}`
    );
    ({ error: firmError } = await client.from('firms').insert(filaBase));
  }

  if (firmError) {
    console.error('[ADMIN] No se pudo crear la firma:', firmError.message);
    throw new AuthError('FIRM_NOT_CREATED', 'No se pudo crear la firma.', 502);
  }

  try {
    await addUserToFirm(firmId, {
      email: input.adminEmail,
      password: input.adminPassword,
      role: 'FIRM_ADMIN'
    });
  } catch (err) {
    if (input.siFallaLaCuenta === 'BORRAR_FIRMA') {
      // Best effort: a row that survives this delete is inert, and the caller's
      // error (EMAIL_EXISTS, almost always) is the one the visitor must see.
      await client.from('firms').delete().eq('firm_id', firmId);
    }
    throw err;
  }

  return { firmId, firmName, nit, credits, validUntil };
};

export const createFirm = async (input: {
  firmName: string;
  /** Opcional. Se guarda NULL cuando viene vacio: la columna es UNIQUE y '' repetido chocaria. */
  nit?: string;
  adminEmail: string;
  adminPassword: string;
  initialCredits?: number;
}): Promise<FirmSummary> => {
  /*
   * A NEW FIRM STARTS ON PREMIUM, ON TRIAL, FOR FOURTEEN DAYS. Premium so the
   * trial shows everything the product does; a date so the trial ends without
   * anyone remembering to end it. The operator can stretch or change it from
   * the ficha, with a written reason.
   *
   * Throws on a duplicate e-mail, leaving the firm row behind for a retry to
   * reuse — an empty firm is inert, an account pointing at nothing is not.
   */
  const creada = await crearFirmaConAdministrador({
    ...input,
    plan: 'PREMIUM',
    period: 'PRUEBA',
    diasDeVigencia: DIAS_DE_PRUEBA,
    maxUsers: PLANES.PREMIUM.maxUsuarios,
    siFallaLaCuenta: 'CONSERVAR_FIRMA'
  });

  return {
    id: creada.firmId,
    name: creada.firmName,
    nit: creada.nit,
    planTier: 'PRO_FIRM',
    plan: 'PREMIUM',
    planPeriod: 'PRUEBA',
    planValidUntil: creada.validUntil,
    planMaxUsers: PLANES.PREMIUM.maxUsuarios,
    status: 'active',
    creditsBalance: creada.credits,
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
/**
 * Acredita o descuenta saldo de una firma desde la consola del operador.
 *
 * EL MONTO PUEDE SER NEGATIVO, Y ESO ES UNA CAPACIDAD, NO UN DESCUIDO. Una
 * compensacion dada por error —el usuario toco «Recargar» dos veces probando
 * el boton y le quedaron $200.000 que nadie pago— tenia que revertirse a mano
 * en la base, sin motivo y sin rastro. Ahora se descuenta por la misma puerta,
 * con el mismo motivo obligatorio y la misma auditoria. Lo que no se puede es
 * dejar el saldo bajo cero: un saldo negativo es una deuda que este producto
 * no cobra.
 *
 * Y ESCRIBE EN `credit_movements`. Antes solo tocaba `firms.credit_balance_cop`,
 * asi que el socio abria su panel de Saldo, veia $200.000 mas y el libro de
 * movimientos —que es lo que el panel muestra— no decia de donde salieron. La
 * auditoria lo sabia; la pantalla del saldo no. El libro es la plata
 * autoritativa (asi lo declara `billing.service`), y un credito que no esta en
 * el no existe para quien lo mira.
 */
export const addCredits = async (
  firmId: string,
  amount: number,
  reason: unknown,
  actorEmail = 'operador'
): Promise<{ balance: number; reason: string }> => {
  const client = requireClient();

  // Before touching money: a recharge with no stated reason must not happen at
  // all, not happen and then fail to be explained.
  const motivo = requireReason(reason);

  if (!Number.isFinite(amount) || !Number.isInteger(amount) || amount === 0) {
    throw new AuthError('INVALID_AMOUNT', 'El monto debe ser un número entero de pesos distinto de cero.');
  }

  const { data: firm } = await client
    .from('firms')
    .select('credit_balance_cop')
    .eq('firm_id', firmId)
    .maybeSingle();

  if (!firm) {
    throw new AuthError('FIRM_NOT_FOUND', 'No existe esa firma.', 404);
  }

  const actual = Number((firm as { credit_balance_cop: number | string }).credit_balance_cop ?? 0);
  const nuevo = actual + amount;

  if (nuevo < 0) {
    throw new AuthError(
      'INSUFFICIENT_BALANCE',
      `No se puede descontar $${Math.abs(amount).toLocaleString('es-CO')}: la firma tiene $${actual.toLocaleString('es-CO')} y el saldo no puede quedar negativo.`,
      400
    );
  }

  const { error } = await client
    .from('firms')
    .update({ credit_balance_cop: nuevo, updated_at: new Date().toISOString() })
    .eq('firm_id', firmId);

  if (error) {
    console.error('[ADMIN] No se pudo recargar:', error.message);
    throw new AuthError('RECHARGE_FAILED', 'No se pudo aplicar la recarga.', 502);
  }

  // Al libro, con el motivo: es lo que el socio ve en su panel de Saldo.
  const { error: errorLibro } = await client.from('credit_movements').insert({
    firm_id: firmId,
    kind: amount > 0 ? 'RECARGA' : 'AJUSTE',
    amount_cop: amount,
    balance_after_cop: nuevo,
    description: `${amount > 0 ? 'Recarga' : 'Ajuste'} del operador · ${motivo}`,
    actor_email: actorEmail
  });
  if (errorLibro) {
    // El saldo ya cambio; un libro incompleto es visible en el log, no un
    // motivo para revertir el dinero a medias.
    console.error('[ADMIN] El ajuste se aplico pero no quedo en credit_movements:', errorLibro.message);
  }

  return { balance: nuevo, reason: motivo };
};

const PLAN_TIERS_LEGACY = new Set(['PRO_FIRM', 'INDEPENDIENTE', 'ENTERPRISE']);
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
    if (!PLAN_TIERS_LEGACY.has(changes.planTier)) {
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

/**
 * Sets a firm's plan by hand: plan, period and expiry, with a written reason.
 *
 * This is how a trial is extended, a courtesy granted, a firm moved to
 * ESENCIAL after a phone call. CORTESIA is the one period without a date;
 * every other period needs one, because a dated plan is what the guards
 * read — a MENSUAL plan with no expiry would be a courtesy wearing a price.
 * Returns what was written, for the audit line.
 */
export const updateFirmPlan = async (
  firmId: string,
  changes: { plan?: unknown; period?: unknown; validUntil?: unknown },
  reason: unknown
): Promise<{ plan: Plan; period: PlanPeriod; validUntil: string | null; reason: string }> => {
  const client = requireClient();
  const motivo = requireReason(reason);

  if (!esPlan(changes.plan)) {
    throw new AuthError('INVALID_PLAN', 'El plan debe ser ESENCIAL, PREMIUM o FIRMA.');
  }
  if (!esPeriodo(changes.period)) {
    throw new AuthError('INVALID_PERIOD', 'El periodo debe ser MENSUAL, ANUAL, PRUEBA o CORTESIA.');
  }

  let validUntil: string | null = null;
  const fechaDada = typeof changes.validUntil === 'string' && changes.validUntil.trim()
    ? new Date(changes.validUntil)
    : null;

  if (fechaDada && Number.isNaN(fechaDada.getTime())) {
    throw new AuthError('INVALID_DATE', 'La fecha de vencimiento no es válida.');
  }
  if (changes.period !== 'CORTESIA' && !fechaDada) {
    throw new AuthError('INVALID_DATE', 'Ese periodo necesita una fecha de vencimiento.');
  }
  // A dated courtesy is allowed: "free until March" is a real arrangement.
  if (fechaDada) validUntil = fechaDada.toISOString();

  const { error } = await client
    .from('firms')
    .update({
      plan: changes.plan,
      plan_period: changes.period,
      plan_valid_until: validUntil,
      plan_max_users: PLANES[changes.plan].maxUsuarios,
      // A plan set by hand is a plan in good standing; mora is for the guards
      // to derive from the date, not for this column to remember.
      subscription_status: 'active',
      updated_at: new Date().toISOString()
    })
    .eq('firm_id', firmId);

  if (error) {
    console.error('[ADMIN] No se pudo fijar el plan:', error.message);
    throw new AuthError('UPDATE_FAILED', 'No se pudo fijar el plan de la firma.', 502);
  }

  return { plan: changes.plan, period: changes.period, validUntil, reason: motivo };
};

/**
 * Cuts a firm's access NOW: `plan_valid_until = now`, plan and period kept.
 *
 * Nothing else is touched on purpose. The guards derive VENCIDO from the date
 * alone, so this is enough to turn the firm read-only this second, and it
 * leaves the plan the firm had visible in the console and in the plan screen
 * — "Renovar plan" is what the firm sees, and paying reactivates it exactly as
 * an ordinary expiry would (the payment starts the new period at now).
 * Reactivating by hand is the existing plan form; there is no second path.
 *
 * A firm with no plan at all (legacy cortesía, plan NULL) is given ESENCIAL as
 * the label of its suspended plan: `estadoDelPlan` needs only the date, but
 * the screens that name the plan must not read "Cortesía · vencido".
 */
export const suspenderAccesoDeFirma = async (
  firmId: string,
  reason: unknown
): Promise<{ plan: Plan; period: PlanPeriod; validUntil: string; reason: string }> => {
  const client = requireClient();
  const motivo = requireReason(reason);

  const { data: fila, error: lectura } = await client
    .from('firms')
    .select('plan, plan_period')
    .eq('firm_id', firmId)
    .maybeSingle();

  if (lectura || !fila) {
    throw new AuthError('FIRM_NOT_FOUND', 'No se encontró la firma.', 404);
  }

  const plan: Plan = esPlan(fila.plan) ? fila.plan : 'ESENCIAL';
  const period: PlanPeriod =
    esPeriodo(fila.plan_period) && fila.plan_period !== 'CORTESIA' ? fila.plan_period : 'MENSUAL';
  const validUntil = new Date().toISOString();

  const { error } = await client
    .from('firms')
    .update({
      plan,
      plan_period: period,
      plan_valid_until: validUntil,
      plan_max_users: PLANES[plan].maxUsuarios,
      updated_at: validUntil
    })
    .eq('firm_id', firmId);

  if (error) {
    console.error('[ADMIN] No se pudo suspender el acceso:', error.message);
    throw new AuthError('UPDATE_FAILED', 'No se pudo suspender el acceso de la firma.', 502);
  }

  return { plan, period, validUntil, reason: motivo };
};

/** The audit wording for a plan set by hand. */
export const describirCambioDePlan = (cambio: {
  plan: Plan;
  period: PlanPeriod;
  validUntil: string | null;
}): string =>
  `Plan ${PLANES[cambio.plan].nombre} · ${etiquetaDePeriodo(cambio.period)} · ` +
  (cambio.validUntil
    ? `vence el ${new Date(cambio.validUntil).toLocaleDateString('es-CO')}`
    : 'sin vencimiento');

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

/**
 * Sets a user's password by hand, for support.
 *
 * The account must belong to the firm named in the URL: `usuarioDeLaFirma`
 * answers 404 otherwise, so an id from another tenant cannot be reset through
 * a firm the operator happened to open. No e-mail is sent — the project has no
 * reset mail — which is why this exists: the operator hands the password over
 * by a channel the firm chose, and the firm's trail records that it happened.
 */
export const restablecerContrasenaDeUsuario = async (
  firmId: string,
  userId: string,
  contrasena: unknown
): Promise<{ email: string }> => {
  const client = requireClient();
  const nueva = validarContrasenaDeOperador(contrasena);
  const objetivo = await usuarioDeLaFirma(firmId, userId);

  const { error } = await client.auth.admin.updateUserById(userId, { password: nueva });
  if (error) {
    console.error('[ADMIN] No se pudo restablecer la contraseña:', error.message);
    throw new AuthError('USER_UPDATE_FAILED', 'No se pudo restablecer la contraseña.', 502);
  }

  return { email: objetivo.email ?? '' };
};

export interface FirmaEliminada {
  nombre: string;
  /** What the database function removed, table by table. */
  tablas: Array<{ tabla: string; filas: number }>;
  usuariosEliminados: number;
  /** Every step that did not complete and needs a hand: B2 objects, accounts. */
  advertencias: string[];
}

/** How many listing rounds the B2 sweep tolerates before it calls itself stuck. */
const MAX_RONDAS_B2 = 50;

/**
 * Deletes a firm with everything it owns, in this order and awaited whole:
 *
 *  1. Its accounts are LISTED (not yet deleted) while the firm still exists.
 *  2. Its B2 objects are deleted; a failure is a warning, never a stop —
 *     files in a bucket are recoverable by hand, a half-deleted tenant is not.
 *  3. `borrar_firma_completa` removes every row in one transaction (see
 *     supabase/migration-borrar-firma.sql for the table list and why
 *     trial_signups survives).
 *  4. The accounts are deleted LAST: had they gone first and step 3 failed,
 *     the firm would keep its data with nobody able to sign in.
 *
 * The caller audits it under the OPERATOR's firm: the deleted firm's own
 * trail went with it.
 */
export const eliminarFirmaCompleta = async (input: {
  firmId: string;
  firmIdDelOperador: string;
  motivo: unknown;
  confirmacion: unknown;
}): Promise<FirmaEliminada & { motivo: string }> => {
  const client = requireClient();
  const advertencias: string[] = [];

  const { data: fila } = await client
    .from('firms')
    .select('firm_id, name')
    .eq('firm_id', input.firmId)
    .maybeSingle();
  if (!fila) {
    throw new AuthError('FIRM_NOT_FOUND', 'No existe esa firma.', 404);
  }
  const nombre = String((fila as { name: string }).name ?? '');

  const motivo = validarBorradoDeFirma({
    firmId: input.firmId,
    firmIdDelOperador: input.firmIdDelOperador,
    nombreDeLaFirma: nombre,
    confirmacion: input.confirmacion,
    motivo: input.motivo
  });

  // 1. Accounts, listed now: after step 3 nothing says which users were hers.
  const cuentas = await listFirmUsers(input.firmId);

  // 2. B2. Unconfigured or failing storage is reported, not fatal.
  const b2 = new BackblazeB2TenantStorageService();
  try {
    let ronda = 0;
    let borradosEnRonda = -1;
    while (ronda < MAX_RONDAS_B2 && borradosEnRonda !== 0) {
      const objetos = await b2.listFirmDocuments(input.firmId);
      if (objetos.length === 0) break;
      borradosEnRonda = 0;
      for (const objeto of objetos) {
        const borrado = await b2.deleteObject(input.firmId, objeto.fileKey);
        if (borrado) borradosEnRonda += 1;
        else advertencias.push(`Archivo en B2 no borrado: ${objeto.fileKey}`);
      }
      // A round that deleted nothing would list the same objects forever.
      ronda += 1;
    }
  } catch (err) {
    advertencias.push(
      `No se pudieron listar ni borrar los archivos de la firma en B2: ${(err as Error).message}`
    );
  }

  // 3. The database, in one transaction.
  const { data: tablas, error } = await client.rpc('borrar_firma_completa', {
    p_firm_id: input.firmId
  });
  if (error) {
    // PostgREST answers PGRST202 when the function does not exist: the
    // migration has not run. Named, so the operator knows what to do.
    const sinFuncion =
      error.code === 'PGRST202' || /could not find the function|does not exist/i.test(error.message);
    if (sinFuncion) {
      throw new AuthError(
        'MIGRATION_REQUIRED',
        'Falta ejecutar supabase/migration-borrar-firma.sql en la base de datos antes de poder eliminar una firma.',
        503
      );
    }
    console.error('[ADMIN] borrar_firma_completa falló:', error.message);
    throw new AuthError('DELETE_FAILED', 'No se pudo eliminar la firma; no se borró nada.', 502);
  }

  // 4. Accounts, last.
  let usuariosEliminados = 0;
  for (const cuenta of cuentas) {
    const { error: errorCuenta } = await client.auth.admin.deleteUser(cuenta.id);
    if (errorCuenta) advertencias.push(`Cuenta no eliminada: ${cuenta.email} (${errorCuenta.message})`);
    else usuariosEliminados += 1;
  }

  return {
    nombre,
    tablas: ((tablas ?? []) as Array<{ tabla: string; filas: number | string }>).map((t) => ({
      tabla: t.tabla,
      filas: Number(t.filas ?? 0)
    })),
    usuariosEliminados,
    advertencias,
    motivo
  };
};
