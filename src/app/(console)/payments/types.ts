export type PaymentStatus = 'pending' | 'succeeded' | 'underpaid' | 'failed' | 'expired';

export interface AdminPayment {
  id: string;
  purpose: 'topup' | 'subscription';
  creditKind: 'ai' | 'cloud' | null;
  planCode: string | null;
  interval: 'month' | 'year' | null;
  amountCents: number;
  amountKes: number;
  kesPerUsd: number;
  status: PaymentStatus;
  paidKes: number | null;
  creditedCents: number | null;
  mpesaReceipt: string | null;
  failureReason: string | null;
  createdAt: string;
  completedAt: string | null;
  workspaceName: string;
  matchedBy: 'client' | 'callback' | 'admin' | null;
}

export interface PaymentsSummary {
  configured: boolean;
  callbackConfigured: boolean;
  monthPaid: number;
  monthKes: number;
  pending: number;
  unclaimed: number;
  kesPerUsd: number;
}

export interface UnclaimedPayment {
  id: string;
  amountKes: number;
  phone: string | null;
  mpesaReceipt: string | null;
  reference: string | null;
  paidAt: string;
}

export const STATUS_LABEL: Record<PaymentStatus, string> = {
  pending: 'Waiting',
  succeeded: 'Paid',
  underpaid: 'Underpaid',
  failed: 'Failed',
  expired: 'Expired',
};

export function statusVariant(
  s: PaymentStatus,
): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (s === 'succeeded') return 'secondary';
  if (s === 'failed' || s === 'underpaid') return 'destructive';
  return 'outline';
}

export const kes = (n: number) =>
  `KES ${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
