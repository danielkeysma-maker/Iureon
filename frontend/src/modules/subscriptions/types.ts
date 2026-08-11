export interface SubscriptionUserSummary {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

/** Plan and consumption snapshot shown in the firm subscription panel. */
export interface FirmSubscriptionInfo {
  firmName: string;
  planTier: string;
  subscriptionStatus: 'active' | 'past_due' | 'canceled';
  monthlyTokensUsed: number;
  monthlyTokensLimit: number;
  activeUsersCount: number;
  maxUsersAllowed: number;
  renewalDate: string;
  usersList: SubscriptionUserSummary[];
}
