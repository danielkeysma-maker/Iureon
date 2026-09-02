import { httpClient } from '../../config/httpClient';

/**
 * The firm's balance, as the server holds it.
 *
 * Never computed here. The old deduction subtracted a constant from React state
 * on every draft and never reached the database, so the number on screen was a
 * guess that drifted from the truth on the first reload — and a firm at zero
 * could draft for ever.
 */

export interface BillingSummary {
  balance: number;
  /** What the firm has been charged, in pesos. */
  spentCop: number;
  /** What that work cost the platform upstream, in dollars. */
  costUsd: number;
  operations: number;
  /** El mes en curso. `costoMedioEsReal` false = el promedio es el piso de tarifa. */
  mes?: {
    escritos: number;
    transcripciones: number;
    orientaciones: number;
    cobradoCop: number;
    costoMedioEscritoCop: number;
    costoMedioEsReal: boolean;
    escritosRestantes: number;
  };
}

export interface Movement {
  kind: string;
  amountCop: number;
  balanceAfterCop: number;
  description: string;
  actorEmail: string;
  createdAt: string;
}

export interface Suma {
  cantidad: number;
  total: number;
}

/** The month's arithmetic, added up by the server over the same ledger the table shows. */
export interface ResumenDelPeriodo {
  saldoInicial: number;
  saldoFinal: number;
  recargas: Suma;
  devoluciones: Suma;
  ajustes: Suma;
  consumo: {
    borradores: Suma;
    resumenes: Suma;
    orientaciones: Suma;
    otros: Suma;
    total: number;
  };
  entradas: number;
  salidas: number;
}

export interface Extracto {
  periodo: string;
  desde: string;
  hasta: string;
  truncado: boolean;
  movimientos: Movement[];
  resumen: ResumenDelPeriodo;
}

/** What the Wompi checkout needs, all of it decided by the server. */
export interface CheckoutIntent {
  reference: string;
  amountInCents: number;
  currency: 'COP';
  publicKey: string;
  /** Signs the amount so editing it in the page produces a checkout Wompi rejects. */
  signature: string;
  redirectUrl: string;
  sandbox: boolean;
}

export interface Recharge {
  reference: string;
  amountCop: number;
  status: string;
  createdAt: string;
}

export const billingApi = {
  summary: () =>
    httpClient.get<{
      summary: BillingSummary;
      prices: Record<string, number>;
      /** The smallest recharge a firm can buy, decided by the server. */
      minRecharge: number;
    }>('/api/billing/summary'),

  movements: () =>
    httpClient.get<{ movements: Movement[] }>('/api/billing/movements').then((r) => r.movements),

  /** The month's ledger and its totals. `periodo` is AAAA-MM; the server cuts it in Bogotá time. */
  statement: (periodo: string) =>
    httpClient.get<Extracto>(`/api/billing/statement?periodo=${encodeURIComponent(periodo)}`),

  /*
   * The amount is sent, but not trusted: the server bounds it by the minimum
   * and signs it, so what the checkout charges is what the server decided.
   */
  startRecharge: (amount: number) =>
    httpClient
      .post<{ intent: CheckoutIntent }>('/api/billing/recharge', { body: { amount } })
      .then((r) => r.intent),

  recharges: () =>
    httpClient.get<{ recharges: Recharge[] }>('/api/billing/recharges').then((r) => r.recharges)
};
