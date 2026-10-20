/** Which billing interval a discount or offer applies to. */
export type Scope = 'month' | 'year' | 'any';

/** Where a rule stands right now, as the API computes it. */
export type RuleState = 'live' | 'scheduled' | 'ended' | 'paused';

export interface Discount {
  id: string;
  name: string;
  /** Null for an automatic discount: it applies without anyone typing it. */
  code: string | null;
  kind: 'percent' | 'fixed';
  percentOff: number | null;
  amountOffCents: number | null;
  /** Empty means every paid plan. */
  planCodes: string[];
  billingInterval: Scope;
  startsAt: string | null;
  endsAt: string | null;
  maxRedemptions: number | null;
  redemptionCount: number;
  durationCycles: number | null;
  status: 'active' | 'paused';
  savedCents: number;
  state: RuleState;
  createdAt: string;
}

export interface Redemption {
  workspaceId: string;
  workspaceName: string;
  planCode: string;
  interval: string;
  listPriceCents: number;
  amountOffCents: number;
  createdAt: string;
}

export type Perk = 'free_domain' | 'ai_credits' | 'cloud_credits';

export interface Offer {
  id: string;
  name: string;
  description: string;
  planCodes: string[];
  billingInterval: Scope;
  perk: Perk;
  /** free_domain: cents covered. Credits: how many. */
  perkValue: number;
  claimDays: number | null;
  startsAt: string | null;
  endsAt: string | null;
  status: 'active' | 'paused';
  state: RuleState;
  granted: number;
  claimed: number;
  createdAt: string;
}

export const PERK_LABEL: Record<Perk, string> = {
  free_domain: 'Free domain',
  ai_credits: 'AI credits',
  cloud_credits: 'Cloud credits',
};

export const SCOPE_LABEL: Record<Scope, string> = {
  any: 'Monthly and yearly',
  month: 'Monthly billing only',
  year: 'Yearly billing only',
};

export const STATE_VARIANT: Record<RuleState, 'success' | 'warning' | 'outline' | 'default'> = {
  live: 'success',
  scheduled: 'warning',
  ended: 'outline',
  paused: 'default',
};
