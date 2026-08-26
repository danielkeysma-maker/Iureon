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
}

export interface Movement {
  kind: string;
  amountCop: number;
  balanceAfterCop: number;
  description: string;
  actorEmail: string;
  createdAt: string;
}

export const billingApi = {
  summary: () =>
    httpClient.get<{ summary: BillingSummary; prices: Record<string, number> }>(
      '/api/billing/summary'
    ),

  movements: () =>
    httpClient.get<{ movements: Movement[] }>('/api/billing/movements').then((r) => r.movements)
};
