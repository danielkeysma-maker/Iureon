import { config } from '../../config/env.config';
import { supabase } from '../../config/supabase.config';
import { COP_PER_USD, MARKUP } from '../billing/billing.service';

/**
 * Answers the only question that matters about the upstream account: when does
 * it have to be topped up, and by how much.
 *
 * WHY IT IS A LIABILITY AND NOT A BILL. A firm that recharges $100.000 has
 * bought drafts it has not asked for yet. That money is already in the bank,
 * and the obligation to produce those drafts is outstanding — the upstream cost
 * of honouring it has NOT been paid. If the OpenRouter account runs dry, the
 * drafts fail for firms that already paid, which is the one failure this
 * business cannot absorb: it is not a degraded feature, it is owing work.
 *
 * So the number to watch is not "how much credit is left" but "how much credit
 * would it take to honour every peso already sold". This computes both and says
 * whether one covers the other.
 *
 * THE CONVERSION IS THE PRICING RUN BACKWARDS. A draft is charged
 * `costUsd × COP_PER_USD × MARKUP`, so the upstream cost of one peso of balance
 * is `1 / (COP_PER_USD × MARKUP)`. Deriving it from those two constants rather
 * than writing 9200 means the day either moves, this moves with it instead of
 * quietly reporting a runway that stopped being true.
 */

/** Pesos of client balance that one dollar of upstream credit can serve. */
export const COP_POR_USD_DE_CREDITO = COP_PER_USD * MARKUP;

export type Cobertura =
  /** Upstream credit covers everything sold, with room to spare. */
  | 'HOLGADA'
  /** It covers what is sold but not by much. Recharge on the next quiet day. */
  | 'AJUSTADA'
  /** It does not cover what is already sold. Recharge now. */
  | 'INSUFICIENTE'
  /** The upstream balance could not be read, so nothing is claimed about it. */
  | 'DESCONOCIDA';

export interface Runway {
  /** Everything the firms have paid for and not yet consumed. */
  pasivoCop: number;
  /** What it would cost upstream to honour all of it. */
  creditoRequeridoUsd: number;
  /** What the OpenRouter account actually holds, when it could be read. */
  creditoDisponibleUsd: number | null;
  cobertura: Cobertura;
  /** Cuánto recargar hoy para volver a estar holgado, o 0 si no hace falta. */
  recargarUsd: number;
  /** Por qué se dice lo que se dice, en una frase, para el panel. */
  explicacion: string;
}

/**
 * Below this ratio the account is called AJUSTADA rather than HOLGADA.
 *
 * 1.5 and not 1.0 because reaching exactly the liability is already too late:
 * new recharges arrive while the old ones are being consumed, and a top-up
 * takes a card, a person and a moment nobody has during an outage.
 */
const HOLGURA = 1.5;

const leerPasivo = async (): Promise<number> => {
  if (!supabase) throw new Error('sin conexión a la base de datos');

  const { data, error } = await supabase.from('firms').select('credit_balance_cop');
  if (error) throw new Error(error.message);

  return (data ?? []).reduce((suma, fila) => {
    const saldo = Number((fila as { credit_balance_cop: number | string }).credit_balance_cop ?? 0);
    // Un saldo negativo es una firma en descubierto, no un crédito a favor de
    // la casa: sumarlo restaría de la obligación real con las demás.
    return suma + Math.max(0, saldo);
  }, 0);
};

/**
 * Reads the upstream balance, or returns null.
 *
 * Null and not zero, and not a throw. Zero would read as "the account is empty"
 * and trigger an alarm about money that may be perfectly fine; a throw would
 * take down a panel whose other half — what we owe — is known and useful on its
 * own. Not knowing is its own answer and gets its own state.
 */
export const leerCreditoOpenRouter = async (): Promise<number | null> => {
  if (!config.openRouter.apiKey) return null;

  try {
    const res = await fetch('https://openrouter.ai/api/v1/credits', {
      headers: { Authorization: `Bearer ${config.openRouter.apiKey}` },
      signal: AbortSignal.timeout(15_000)
    });

    if (!res.ok) return null;

    const body = (await res.json()) as {
      data?: { total_credits?: number; total_usage?: number };
    };

    const comprados = Number(body.data?.total_credits ?? NaN);
    const gastados = Number(body.data?.total_usage ?? NaN);
    if (!Number.isFinite(comprados) || !Number.isFinite(gastados)) return null;

    // OpenRouter reports what was bought and what was spent, never the
    // remainder. Restarlos aquí es la única forma de tener el saldo.
    return comprados - gastados;
  } catch {
    return null;
  }
};

export const calcularRunway = async (): Promise<Runway> => {
  const [pasivoCop, creditoDisponibleUsd] = await Promise.all([
    leerPasivo(),
    leerCreditoOpenRouter()
  ]);

  const creditoRequeridoUsd = Number((pasivoCop / COP_POR_USD_DE_CREDITO).toFixed(2));

  if (creditoDisponibleUsd === null) {
    return {
      pasivoCop,
      creditoRequeridoUsd,
      creditoDisponibleUsd: null,
      cobertura: 'DESCONOCIDA',
      recargarUsd: 0,
      explicacion:
        `Las firmas tienen $${pasivoCop.toLocaleString('es-CO')} COP comprados y sin consumir, ` +
        `que cuestan US$${creditoRequeridoUsd} de crédito. No se pudo leer el saldo de OpenRouter, ` +
        'así que no se afirma nada sobre la cobertura.'
    };
  }

  const objetivo = creditoRequeridoUsd * HOLGURA;
  const cobertura: Cobertura =
    creditoDisponibleUsd < creditoRequeridoUsd
      ? 'INSUFICIENTE'
      : creditoDisponibleUsd < objetivo
      ? 'AJUSTADA'
      : 'HOLGADA';

  const recargarUsd =
    cobertura === 'HOLGADA' ? 0 : Number(Math.max(0, objetivo - creditoDisponibleUsd).toFixed(2));

  const explicacion =
    cobertura === 'INSUFICIENTE'
      ? `Las firmas ya pagaron $${pasivoCop.toLocaleString('es-CO')} COP en borradores que aún no piden. ` +
        `Honrarlos cuesta US$${creditoRequeridoUsd} y en OpenRouter hay US$${creditoDisponibleUsd.toFixed(2)}. ` +
        `Recarga US$${recargarUsd} hoy: si el crédito se agota, fallan borradores ya pagados.`
      : cobertura === 'AJUSTADA'
      ? `Alcanza para lo vendido — US$${creditoRequeridoUsd} de US$${creditoDisponibleUsd.toFixed(2)} — ` +
        `pero sin margen para las recargas que entren esta semana. Recarga US$${recargarUsd} cuando puedas.`
      : `US$${creditoDisponibleUsd.toFixed(2)} en OpenRouter contra US$${creditoRequeridoUsd} comprometidos. ` +
        'No hay que recargar.';

  return { pasivoCop, creditoRequeridoUsd, creditoDisponibleUsd, cobertura, recargarUsd, explicacion };
};
