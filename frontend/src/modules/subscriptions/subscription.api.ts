import { httpClient } from '../../config/httpClient';
import type { CheckoutIntent } from '../billing/billing.api';
import type { PagoDePlan, PaidPeriod, Plan, PlanDeFirma, PlanDefinition } from './types';

/**
 * The firm's plan, from the server.
 *
 * What this replaces: a `sampleSubscriptionInfo` object in App.tsx with
 * invented token quotas and a renewal date typed by hand, fed to a modal that
 * "invited" lawyers by pushing them into local state. Nothing here is decided
 * in the browser — the price the checkout charges is the server's, signed.
 */
export const subscriptionApi = {
  plan: () =>
    httpClient.get<{ plan: PlanDeFirma; planes: Record<Plan, PlanDefinition> }>(
      '/api/subscription/plan'
    ),

  /** Starts a plan payment. The server picks the price from the catalogue. */
  checkout: (plan: Plan, period: PaidPeriod) =>
    httpClient
      .post<{ intent: CheckoutIntent & { plan: Plan; period: PaidPeriod; amountCop: number } }>(
        '/api/subscription/checkout',
        { body: { plan, period } }
      )
      .then((r) => r.intent),

  payments: () =>
    httpClient.get<{ payments: PagoDePlan[] }>('/api/subscription/payments').then((r) => r.payments)
};
