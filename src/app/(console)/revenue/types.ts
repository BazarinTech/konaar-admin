export interface RevenueSummary {
  windowDays: number;
  revenue: number;
  invoices: number;
  topups: number;
  otherIncome: number;
  modelCost: number;
  modelCharged: number;
  otherExpense: number;
  cost: number;
  profit: number;
  margin: number | null;
  unearnedCredits: number;
  grantedCredits: number;
  unpaidInvoices: number;
}

export interface LedgerLine {
  at: string | null;
  kind: string;
  category: string;
  amount: number;
  description: string;
  workspaceId: string | null;
  source: string;
  sourceId: string;
  recordedBy: string | null;
  editable: boolean;
}

export interface TopAccount {
  workspaceId: string;
  name: string;
  plan: string;
  ownerEmail: string;
  paid: number;
  cost: number;
  contribution: number;
}
