import crypto from 'crypto';
import { config } from '../../../config/env.config';
import { supabase } from '../../../config/supabase.config';
import { BillingError, MIN_RECHARGE_COP } from '../billing.service';
import { auditService } from '../../audit/audit.service';

/**
 * Recharging through Wompi.
 *
 * TWO SECRETS DOING TWO DIFFERENT JOBS, and confusing them is how a payment
 * integration leaks money:
 *
 *   - The INTEGRITY secret signs what we ask the client to pay. It travels to
 *     the browser inside a signature the browser cannot recompute, so a client
 *     who edits the amount in the page gets rejected by Wompi, not by us.
 *   - The EVENTS secret verifies what Wompi tells us afterwards. Without it the
 *     webhook is an open endpoint that credits balances on request.
 *
 * Neither ever reaches the frontend. The public key does, because it is meant
 * to; the private key is not used here at all and is kept for reconciliation.
 */

/** Wompi works in cents. Pesos have no subdivision in practice, so this is x100. */
const centavos = (cop: number): number => Math.round(cop * 100);

const requireDb = () => {
  if (!supabase) {
    throw new BillingError('DB_UNAVAILABLE', 'La base de datos no está configurada.', 503);
  }
  return supabase;
};

const requireGateway = () => {
  if (!config.wompi.enabled) {
    throw new BillingError(
      'GATEWAY_UNAVAILABLE',
      'Las recargas en línea no están habilitadas. Escríbenos para recargar.',
      503
    );
  }
  return config.wompi;
};

/**
 * A reference nobody else can guess, and nobody can collide with.
 *
 * It is the only thread between a payment and a firm, so it carries the firm
 * and enough randomness that two recharges started in the same millisecond
 * cannot produce the same one. Wompi rejects a repeated reference, which would
 * surface as a checkout that mysteriously refuses to open.
 */
const nuevaReferencia = (firmId: string): string =>
  `IUR-${firmId}-${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;

/**
 * The signature Wompi requires so the browser cannot alter what it pays.
 *
 * SHA256 over reference + amount in cents + currency + the integrity secret, in
 * that order. Any of them changed in the page produces a signature Wompi will
 * not accept, which is precisely the point: the amount is decided here and
 * proven here.
 */
export const firmaDeIntegridad = (
  referencia: string,
  montoCentavos: number,
  moneda: string,
  secreto: string
): string =>
  crypto
    .createHash('sha256')
    .update(`${referencia}${montoCentavos}${moneda}${secreto}`)
    .digest('hex');

export interface CheckoutIntent {
  reference: string;
  amountInCents: number;
  currency: 'COP';
  publicKey: string;
  signature: string;
  redirectUrl: string;
  sandbox: boolean;
}

/**
 * Records what a firm intends to pay, and returns what the checkout needs.
 *
 * WRITTEN BEFORE THE CLIENT PAYS, not after, because the confirmation that
 * arrives later says only "this reference was paid". Whose balance it belongs
 * to and how much was promised has to already exist, or the only source for
 * both is whatever the browser claims — and a browser that names its own credit
 * is not a payment system.
 */
export const crearIntencion = async (input: {
  firmId: string;
  userEmail: string;
  amountCop: number;
  /**
   * RECARGA credits balance (the default, and every caller before plans
   * existed). SUSCRIPCION extends the firm's plan instead; `plan` and `period`
   * are then written with the intent so the webhook applies what was bought and
   * not what the confirmation happens to say.
   */
  purpose?: 'RECARGA' | 'SUSCRIPCION';
  plan?: 'ESENCIAL' | 'PREMIUM';
  period?: 'MENSUAL' | 'ANUAL';
}): Promise<CheckoutIntent> => {
  const gateway = requireGateway();
  const db = requireDb();
  const purpose = input.purpose ?? 'RECARGA';

  if (!Number.isFinite(input.amountCop) || !Number.isInteger(input.amountCop)) {
    throw new BillingError('INVALID_AMOUNT', 'El monto debe ser un número entero de pesos.', 400);
  }

  /*
   * The minimum is enforced HERE and not only on screen.
   *
   * The panel states it before the firm picks an amount, which is where a rule
   * belongs for the person following it. But a rule that lives only in the page
   * is a suggestion: this endpoint is reachable without the page.
   *
   * Only for recharges: the minimum exists because Wompi's fixed fee makes a
   * small top-up expensive to collect, and a plan's price is not chosen by the
   * client — it is the catalogue's, and the monthly ESENCIAL sits below it.
   */
  if (purpose === 'RECARGA' && input.amountCop < MIN_RECHARGE_COP) {
    throw new BillingError(
      'BELOW_MINIMUM',
      `La recarga mínima es $${MIN_RECHARGE_COP.toLocaleString('es-CO')} COP.`,
      400
    );
  }

  if (purpose === 'SUSCRIPCION' && (!input.plan || !input.period)) {
    throw new BillingError('INVALID_PLAN', 'Un pago de plan debe decir qué plan y qué periodo.', 400);
  }

  const reference = nuevaReferencia(input.firmId);
  const amountInCents = centavos(input.amountCop);

  /*
   * The plan columns travel only on a plan intent. A recharge inserts the same
   * row it always did, so recharging keeps working on a database where
   * migration-suscripciones.sql has not run yet — a key the schema cache does
   * not know fails the whole insert.
   */
  const fila: Record<string, unknown> = {
    reference,
    firm_id: input.firmId,
    user_email: input.userEmail,
    amount_cop: input.amountCop,
    status: 'PENDING'
  };
  if (purpose === 'SUSCRIPCION') {
    fila.purpose = purpose;
    fila.plan = input.plan;
    fila.plan_period = input.period;
  }

  const { error } = await db.from('payment_intents').insert(fila);

  if (error) {
    console.error('[WOMPI] No se pudo registrar la intención:', error.message);
    throw new BillingError('INTENT_FAILED', 'No se pudo iniciar la recarga.', 502);
  }

  return {
    reference,
    amountInCents,
    currency: 'COP',
    publicKey: gateway.publicKey,
    signature: firmaDeIntegridad(reference, amountInCents, 'COP', gateway.integritySecret),
    redirectUrl: gateway.redirectUrl,
    sandbox: gateway.sandbox
  };
};

/** The shape Wompi posts. Only what is read is declared. */
export interface WompiEvent {
  event?: string;
  data?: { transaction?: Record<string, unknown> };
  signature?: { properties?: string[]; checksum?: string };
  timestamp?: number;
}

/** Reads "transaction.status" out of the event's data object. */
const valorEn = (evento: WompiEvent, ruta: string): string => {
  const partes = ruta.split('.');
  let actual: unknown = evento.data;

  for (const parte of partes) {
    if (actual === null || typeof actual !== 'object') return '';
    actual = (actual as Record<string, unknown>)[parte];
  }

  return actual === undefined || actual === null ? '' : String(actual);
};

/**
 * Whether this event really came from Wompi.
 *
 * THE ONE CHECK THAT MAKES THE WEBHOOK SAFE. The endpoint is public — it has to
 * be, Wompi calls it — so without this anyone who learns the URL can POST
 * "APPROVED" and credit any firm any amount, for ever. Every other guard in
 * this module is bookkeeping; this one is the lock.
 *
 * The event names the fields it signed in `signature.properties`, and the
 * checksum is SHA256 over those values concatenated, then the timestamp, then
 * the events secret. Reading the field list FROM the event is safe and
 * deliberate: an attacker choosing a shorter list still cannot produce a
 * checksum without the secret, and Wompi can add fields without breaking this.
 *
 * Compared with timingSafeEqual, because a plain === leaks how much of the
 * checksum matched through how long the comparison took, and a webhook can be
 * called as many times as an attacker likes.
 */
export const eventoEsAutentico = (evento: WompiEvent, secreto: string): boolean => {
  const propiedades = evento.signature?.properties;
  const recibido = evento.signature?.checksum;

  if (!Array.isArray(propiedades) || propiedades.length === 0) return false;
  if (typeof recibido !== 'string' || recibido.length === 0) return false;
  if (typeof evento.timestamp !== 'number') return false;

  const concatenado = propiedades.map((ruta) => valorEn(evento, ruta)).join('');
  const esperado = crypto
    .createHash('sha256')
    .update(`${concatenado}${evento.timestamp}${secreto}`)
    .digest('hex');

  const a = Buffer.from(esperado, 'utf8');
  const b = Buffer.from(recibido.toLowerCase(), 'utf8');

  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

export type EventOutcome =
  | { handled: 'CREDITED'; balance: number }
  | { handled: 'PLAN_EXTENDED'; firmId: string; plan: string; validUntil: string }
  | { handled: 'ALREADY_CREDITED' }
  | { handled: 'NOT_APPROVED'; status: string }
  | { handled: 'IGNORED'; reason: string };

/**
 * Turns a verified event into credit, at most once.
 *
 * The amount comes from the intention written before the payment, never from
 * the event — a confirmation says what was paid, and what we promised to credit
 * for it is our own record. Idempotency lives in the database function, where
 * two simultaneous retries cannot both win.
 */
export const aplicarEvento = async (evento: WompiEvent): Promise<EventOutcome> => {
  const db = requireDb();
  const transaccion = evento.data?.transaction;

  if (!transaccion) return { handled: 'IGNORED', reason: 'sin transacción' };

  const referencia = String(transaccion.reference ?? '');
  const estado = String(transaccion.status ?? '');
  const idTransaccion = String(transaccion.id ?? '');

  if (!referencia) return { handled: 'IGNORED', reason: 'sin referencia' };

  /*
   * Only APPROVED adds credit. DECLINED, VOIDED and ERROR are recorded so the
   * firm can see that its attempt was seen and failed — a recharge that simply
   * vanishes is the state that produces a support call and then a chargeback.
   */
  if (estado !== 'APPROVED') {
    await db
      .from('payment_intents')
      .update({
        status: estado || 'ERROR',
        wompi_transaction_id: idTransaccion || null,
        updated_at: new Date().toISOString()
      })
      .eq('reference', referencia)
      .eq('status', 'PENDING');

    return { handled: 'NOT_APPROVED', status: estado };
  }

  /*
   * WHAT AN APPROVED PAYMENT BUYS IS WRITTEN ON THE INTENT, NOT ON THE EVENT.
   * A recharge and a plan payment arrive through the same webhook and look the
   * same; the intent's `purpose` — fixed before the client paid — decides which
   * database function applies it. Before the migration the column does not
   * exist and the read fails: every intent is then a recharge, which is the
   * only kind that could have been created.
   */
  const { data: intencion } = await db
    .from('payment_intents')
    .select('purpose')
    .eq('reference', referencia)
    .maybeSingle();
  const purpose = String((intencion as { purpose?: string } | null)?.purpose ?? 'RECARGA');

  if (purpose === 'SUSCRIPCION') return aplicarPagoDePlan(db, referencia, idTransaccion);

  const { data, error } = await db.rpc('credit_payment_intent', {
    p_reference: referencia,
    p_transaction_id: idTransaccion
  });

  if (error) {
    console.error('[WOMPI] No se pudo acreditar:', error.message);
    throw new BillingError('CREDIT_FAILED', 'No se pudo acreditar la recarga.', 502);
  }

  // NULL means the row was no longer PENDING: a retry of something already
  // credited. That is a success, not a failure — answering anything else makes
  // Wompi retry for ever.
  if (data === null) return { handled: 'ALREADY_CREDITED' };

  return { handled: 'CREDITED', balance: Number(data) };
};

/**
 * Extends the firm's plan for a paid intent, at most once.
 *
 * The period arithmetic (extend from the current expiry, never lose days)
 * lives in `apply_subscription_payment`, next to the row lock that makes two
 * simultaneous retries produce one period. The audit line is written here,
 * to the paying firm's own trail, naming who started the payment.
 */
const aplicarPagoDePlan = async (
  db: NonNullable<typeof supabase>,
  referencia: string,
  idTransaccion: string
): Promise<EventOutcome> => {
  const { data, error } = await db.rpc('apply_subscription_payment', {
    p_reference: referencia,
    p_transaction_id: idTransaccion
  });

  if (error) {
    console.error('[WOMPI] No se pudo aplicar el pago del plan:', error.message);
    throw new BillingError('PLAN_PAYMENT_FAILED', 'No se pudo aplicar el pago del plan.', 502);
  }

  if (data === null || data === undefined) return { handled: 'ALREADY_CREDITED' };

  const pago = data as Record<string, unknown>;
  const firmId = String(pago.firm_id);
  const plan = String(pago.plan);
  const period = String(pago.plan_period);
  const validUntil = String(pago.valid_until);
  const monto = Number(pago.amount_cop);

  await auditService.record({
    firmId,
    userEmail: String(pago.user_email ?? 'desconocido'),
    action: 'PLAN_PAGADO',
    resource:
      `Plan ${plan === 'PREMIUM' ? 'Premium' : 'Esencial'} · ${period === 'ANUAL' ? 'anual' : 'mensual'} · ` +
      `$${monto.toLocaleString('es-CO')} COP · vigente hasta ${new Date(validUntil).toLocaleDateString('es-CO')} · ${referencia}`,
    ipAddress: null
  });

  return { handled: 'PLAN_EXTENDED', firmId, plan, validUntil };
};

export interface IntentSummary {
  reference: string;
  amountCop: number;
  status: string;
  createdAt: string;
}

/** A firm's own recharge attempts, so a pending one is visible while it waits. */
export const intencionesDe = async (firmId: string, limit = 10): Promise<IntentSummary[]> => {
  const db = requireDb();

  const { data } = await db
    .from('payment_intents')
    .select('reference, amount_cop, status, created_at')
    .eq('firm_id', firmId)
    .order('created_at', { ascending: false })
    .limit(limit);

  return ((data ?? []) as Array<Record<string, unknown>>).map((fila) => ({
    reference: String(fila.reference),
    amountCop: Number(fila.amount_cop),
    status: String(fila.status),
    createdAt: String(fila.created_at)
  }));
};
