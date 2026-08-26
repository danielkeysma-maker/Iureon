import { supabase } from '../../config/supabase.config';
import type { CallUsage } from '../agent/openrouter.client';

/**
 * What a firm consumed, what it cost, and what it was charged.
 *
 * WHY THIS EXISTS AT ALL. Every firm draws from ONE OpenRouter account, which
 * is the correct arrangement — Iureon is OpenRouter's customer and the firms are
 * Iureon's, and no firm should ever hold a key to an upstream provider. But it
 * only works with attribution: without it, a per-firm balance is a decorative
 * number and the platform pays for everybody's work out of one pocket it cannot
 * account for.
 *
 * WHAT WAS THERE BEFORE. The pipeline reported `tokensConsumed: 4820` for every
 * draft it had ever produced — a hardcoded figure in the one place a client is
 * charged money — and the deduction ran in the browser, updating React state
 * that never reached the database. A firm at zero could draft for ever, and the
 * balance on screen was fiction.
 *
 * WHY BOTH AMOUNTS ARE STORED. The dollars it cost and the pesos charged. With
 * only the second you cannot answer whether the price covers the cost, which is
 * the question that decides whether the business exists; with only the first you
 * cannot answer a client asking why their balance moved.
 */

export type Operation = 'BORRADOR' | 'TRANSCRIPCION' | 'BUSQUEDA';

export class BillingError extends Error {
  readonly code: string;
  readonly status: number;
  /** What the firm has, so the message can say how short they are. */
  readonly balance: number;

  constructor(code: string, message: string, status: number, balance = 0) {
    super(message);
    this.name = 'BillingError';
    this.code = code;
    this.status = status;
    this.balance = balance;
  }
}

/**
 * The floor price of each operation, in Colombian pesos.
 *
 * A FLOOR AND NOT A FLAT FEE, because a flat fee loses money on exactly the
 * documents that matter most. Measured against the real model prices: a
 * five-page contestación costs about $528 and a forty-page demanda about
 * $2.862, so one price for both means the platform pays to write the long ones.
 * Past roughly 27 pages every draft was a loss, and nothing capped the length.
 *
 * So the floor covers an ordinary document and anything longer is charged on
 * what it actually cost — see `priceFor`. A lawyer understands this immediately
 * because it is how they bill: a forty-page demanda is more work than a
 * five-page memorial, and it is worth more.
 */
export const PRICE_COP: Record<Operation, number> = {
  BORRADOR: 2000,
  TRANSCRIPCION: 3000,
  BUSQUEDA: 0
};

/**
 * Pesos per dollar, for turning an upstream cost into a Colombian price.
 *
 * Deliberately generous rather than the day's exact rate: the alternative is a
 * live FX lookup on every draft, which adds a dependency and a failure mode to
 * the billing path in exchange for accuracy nobody needs at these amounts. A
 * few points of drift are absorbed by the margin.
 */
const COP_PER_USD = 4000;

/**
 * What the platform charges over its own cost.
 *
 * 2.3 holds the margin at about 56% at every document length, which is the same
 * margin the flat $2.000 gave on an ordinary draft. The price scales; the
 * business does not change shape.
 */
const MARKUP = 2.3;

/**
 * What one completed operation costs, given what it really consumed.
 *
 * The floor wins for ordinary work, so the common case has one predictable
 * price. Only a document long enough to cost more than the floor is charged on
 * measurement — and by then the lawyer has a forty-page demanda in their hands,
 * which is the moment a higher price is easiest to justify.
 */
export const priceFor = (operation: Operation, costUsd: number): number => {
  const piso = PRICE_COP[operation];
  if (piso <= 0) return 0;

  const medido = Math.round(costUsd * COP_PER_USD * MARKUP);
  return Math.max(piso, medido);
};

/**
 * How long a document this balance can pay for, in output tokens.
 *
 * THE BALANCE IS THE LENGTH LIMIT, and that is what removes the ugly choice.
 * Without it the model writes whatever it likes and the charge either truncates
 * a filing mid-sentence or lands above what the firm can pay — work already
 * done and unbillable. Capping the model at what the balance affords means a
 * firm can never generate something it cannot pay for, and never has a document
 * cut short by a rule it did not know about: it ran out of credit, which is a
 * thing it can see and fix.
 *
 * Undefined when the balance covers more than any sane filing, so the ordinary
 * case carries no cap at all.
 */
export const maxOutputTokensFor = (balanceCop: number): number | undefined => {
  const disponibleUsd = balanceCop / MARKUP / COP_PER_USD;
  // What the analysis stages and Opus's own input already consumed.
  const restante = disponibleUsd - 0.05;
  if (restante <= 0) return 256;

  // Opus output, at 25 USD per million.
  const tokens = Math.floor((restante / 25) * 1_000_000);

  // Beyond this the cap stops being a protection and starts being a number
  // nobody will ever reach — about 260 pages.
  return tokens > 180_000 ? undefined : Math.max(512, tokens);
};

const requireDb = () => {
  if (!supabase) {
    throw new BillingError('DB_UNAVAILABLE', 'La base de datos no está configurada.', 503);
  }
  return supabase;
};

export const balanceOf = async (firmId: string): Promise<number> => {
  const db = requireDb();

  const { data } = await db
    .from('firms')
    .select('credit_balance_cop')
    .eq('firm_id', firmId)
    .maybeSingle();

  return Number((data as { credit_balance_cop: number | string } | null)?.credit_balance_cop ?? 0);
};

/**
 * Refuses BEFORE the money is spent upstream.
 *
 * Checking afterwards would mean the platform pays OpenRouter for work it
 * cannot charge for — and telling the lawyer their draft is ready but
 * unaffordable is worse than telling them up front that it is.
 */
export const ensureBalance = async (firmId: string, operation: Operation): Promise<void> => {
  const precio = PRICE_COP[operation];
  if (precio <= 0) return;

  const saldo = await balanceOf(firmId);

  if (saldo < precio) {
    throw new BillingError(
      'INSUFFICIENT_CREDITS',
      `Saldo insuficiente: esta operación cuesta $${precio.toLocaleString('es-CO')} COP y la firma tiene $${saldo.toLocaleString('es-CO')} COP.`,
      402,
      saldo
    );
  }
};

/**
 * Records what one model call consumed, without charging for it.
 *
 * A draft calls three models and is charged once, so the stages record their
 * cost and the charge lands separately. Never throws: an operation must not
 * fail because its accounting failed, and a gap in the ledger is visible in the
 * server log rather than silent.
 */
export const recordUsage = async (input: {
  firmId: string;
  userEmail: string;
  operation: Operation;
  operationId: string;
  usage: CallUsage | null;
}): Promise<void> => {
  if (!supabase || !input.usage) return;

  const { error } = await supabase.from('ai_usage').insert({
    firm_id: input.firmId,
    user_email: input.userEmail,
    operation: input.operation,
    operation_id: input.operationId,
    model: input.usage.model,
    prompt_tokens: input.usage.promptTokens,
    completion_tokens: input.usage.completionTokens,
    cost_usd: input.usage.costUsd,
    charged_cop: 0
  });

  if (error) console.error('[BILLING] No se pudo registrar el consumo:', error.message);
};

/**
 * Charges the firm for one completed operation.
 *
 * THE DEBIT IS ATOMIC, and that is not caution for its own sake. Reading the
 * balance, subtracting in the application and writing it back loses money the
 * moment two requests overlap: both read 10.000, both write 8.000, and the firm
 * paid for one draft out of two. With two lawyers of the same firm drafting at
 * once that is not an unlikely race, it is Tuesday.
 *
 * `debit_firm_credits` subtracts and returns in one statement, and refuses when
 * the balance is short — so a charge that cannot be covered leaves the balance
 * untouched instead of driving it negative.
 */
export const chargeOperation = async (input: {
  firmId: string;
  userEmail: string;
  operation: Operation;
  operationId: string;
  description: string;
}): Promise<{ charged: number; balance: number; costUsd: number }> => {
  const db = requireDb();

  /*
   * The price comes from what this operation actually consumed, floored at the
   * ordinary price. Summed across every stage of the operation, because a draft
   * is three model calls and the firm is charged for the document.
   */
  const { data: consumo } = await db
    .from('ai_usage')
    .select('cost_usd')
    .eq('operation_id', input.operationId)
    .eq('firm_id', input.firmId);

  const costUsd = ((consumo ?? []) as { cost_usd: number }[]).reduce(
    (total, fila) => total + Number(fila.cost_usd ?? 0),
    0
  );

  const precio = priceFor(input.operation, costUsd);

  if (precio <= 0) return { charged: 0, balance: await balanceOf(input.firmId), costUsd };

  const { data: nuevoSaldo, error } = await db.rpc('debit_firm_credits', {
    p_firm_id: input.firmId,
    p_amount: precio
  });

  if (error) {
    console.error('[BILLING] No se pudo descontar:', error.message);
    throw new BillingError('CHARGE_FAILED', 'No se pudo aplicar el cobro.', 502);
  }

  if (nuevoSaldo === null) {
    // The balance moved between the pre-flight check and here — another draft
    // finished first. The work is done and unbilled, which is the platform's
    // loss to notice rather than the client's to discover.
    console.error(`[BILLING] Saldo insuficiente al cobrar ${input.operation} a ${input.firmId}.`);
    throw new BillingError(
      'INSUFFICIENT_CREDITS',
      'El saldo se agotó mientras se procesaba la operación.',
      402,
      await balanceOf(input.firmId)
    );
  }

  const balance = Number(nuevoSaldo);

  await db.from('credit_movements').insert({
    firm_id: input.firmId,
    kind: 'CONSUMO',
    amount_cop: -precio,
    balance_after_cop: balance,
    // Says WHY it cost what it cost when it went above the floor, so a lawyer
    // reading their movements is not left guessing why one draft cost triple.
    description:
      precio > PRICE_COP[input.operation]
        ? `${input.description} (documento extenso)`
        : input.description,
    actor_email: input.userEmail
  });

  // The charge is attached to the operation's last usage row so the ledger can
  // be read either way: what one document cost, and what one firm was charged.
  await db
    .from('ai_usage')
    .update({ charged_cop: precio })
    .eq('operation_id', input.operationId)
    .eq('firm_id', input.firmId);

  return { charged: precio, balance, costUsd };
};

export interface UsageSummary {
  balance: number;
  /** What the firm has spent, in pesos. */
  spentCop: number;
  /** What that work cost the platform upstream, in dollars. */
  costUsd: number;
  operations: number;
}

/** What a firm has consumed, for its own screen. */
export const usageSummary = async (firmId: string): Promise<UsageSummary> => {
  const db = requireDb();

  /*
   * TWO TABLES BECAUSE THEY ANSWER TWO QUESTIONS, and conflating them lost the
   * charges.
   *
   * `ai_usage` records model calls: what the platform spent upstream. It only
   * has rows when a model actually answered — and the pipeline degrades to a
   * static template when every engine fails, so a firm can be charged for a
   * document that produced no usage rows at all.
   *
   * `credit_movements` records charges: what the firm was billed. That is the
   * authoritative answer to "what have I spent", and reading it from ai_usage
   * reported zero for a firm that had paid for three drafts. Caught by a check
   * that charged without recording usage first, which is exactly the shape of
   * the fallback path.
   */
  const { data: consumo } = await db.from('ai_usage').select('cost_usd').eq('firm_id', firmId);

  const { data: cobros } = await db
    .from('credit_movements')
    .select('amount_cop')
    .eq('firm_id', firmId)
    .eq('kind', 'CONSUMO');

  const filasConsumo = (consumo ?? []) as { cost_usd: number }[];
  const filasCobro = (cobros ?? []) as { amount_cop: number }[];

  return {
    balance: await balanceOf(firmId),
    // Charges are stored negative, because that is the direction they move the
    // balance; the summary states them as an amount spent.
    spentCop: filasCobro.reduce((total, f) => total + Math.abs(Number(f.amount_cop ?? 0)), 0),
    costUsd: filasConsumo.reduce((total, f) => total + Number(f.cost_usd ?? 0), 0),
    operations: filasCobro.length
  };
};

export interface Movement {
  kind: string;
  amountCop: number;
  balanceAfterCop: number;
  description: string;
  actorEmail: string;
  createdAt: string;
}

/** Why the balance is what it is, newest first. */
export const movements = async (firmId: string, limit = 50): Promise<Movement[]> => {
  const db = requireDb();

  const { data } = await db
    .from('credit_movements')
    .select('*')
    .eq('firm_id', firmId)
    .order('created_at', { ascending: false })
    .limit(limit);

  return ((data ?? []) as Record<string, unknown>[]).map((row) => ({
    kind: String(row.kind),
    amountCop: Number(row.amount_cop),
    balanceAfterCop: Number(row.balance_after_cop),
    description: String(row.description),
    actorEmail: String(row.actor_email),
    createdAt: String(row.created_at)
  }));
};
