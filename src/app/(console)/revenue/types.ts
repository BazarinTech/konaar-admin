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

export interface RecurringSchedule {
  id: string;
  kind: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  dayOfMonth: number;
  startsOn: string | null;
  endsOn: string | null;
  status: 'active' | 'paused';
  lastPostedFor: string | null;
  postedCount: number;
  createdBy: string | null;
  nextDue: string | null;
}

export interface PageInfo {
  nextCursor: string | null;
  hasMore: boolean;
}
