export interface Setting {
  key: string;
  label: string;
  help: string;
  group: 'pricing' | 'limits';
  unit: string;
  min: number;
  max: number;
  appliesTo: string;
  value: number;
  default: number;
  updatedAt: string | null;
  updatedBy: { name: string; email: string } | null;
}

export interface Plan {
  code: string;
  name: string;
  priceCents: number;
  cadence: string;
  monthlyAiCredits: number;
  monthlyCloudCredits: number;
  includedUsageCents: number;
  features: string[];
  isPublic: boolean;
  sortOrder: number;
  workspaces: number;
  subscriptions: number;
}

export interface PlatformOverview {
  settings: Setting[];
  plans: Plan[];
  margin: {
    windowDays: number;
    charged: number;
    providerCost: number;
    grossProfit: number;
    byModel: {
      model: string;
      operations: number;
      charged: number;
      providerCost: number;
      margin: number | null;
    }[];
  };
  rateCard: {
    compute: {
      tier: string;
      unit: string;
      listPricePerHour: number;
      pricePerHour: number;
      pricePerMonth: number;
    }[];
    database: {
      tier: string;
      unit: string;
      listPricePerHour: number;
      pricePerHour: number;
      pricePerMonth: number;
    }[];
    bandwidth: { unit: string; listPricePerGb: number; pricePerGb: number };
  };
  models: {
    id: string;
    label: string;
    tier: string;
    contextTokens: number;
    maxOutputTokens: number;
    providerInputPerMTok: number;
    providerOutputPerMTok: number;
    chargedInputPerMTok: number;
    chargedOutputPerMTok: number;
  }[];
  engine: {
    readOnly: boolean;
    source: string;
    models: { architect: string; editor: string; premium: string };
    escalation: {
      premiumEnabled: boolean;
      afterFailures: number;
      maxPremiumOperationsPerRun: number;
    };
    repair: { maxAttemptsPerRun: number };
    review: { enabled: boolean; maxRounds: number; screenshotMaxHeight: number };
    verify: { required: string[] };
    maxTurns: Record<string, number>;
  };
}
