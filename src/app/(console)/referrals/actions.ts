'use server';

import { revalidatePath } from 'next/cache';
import { api, ApiError } from '@/lib/api';

export interface ActionResult {
  ok?: boolean;
  error?: string;
  message?: string;
}

function failed(err: unknown): ActionResult {
  return {
    error: err instanceof ApiError ? err.message : 'That did not go through.',
  };
}

/**
 * Send somebody their commission.
 *
 * The only step in the whole programme that moves money, and deliberately a
 * person's decision: a referral programme is the part of a platform that
 * attracts fraud, and an automatic payout hands a fraudster the money before
 * anybody has looked at the account.
 */
export async function approvePayout(id: string): Promise<ActionResult> {
  try {
    await api(`/admin/referrals/payouts/${id}/approve`, { method: 'POST' });
  } catch (err) {
    return failed(err);
  }
  revalidatePath('/referrals');
  return { ok: true, message: 'Sent.' };
}

/** Refuse one. The earnings go back to the person's available balance. */
export async function rejectPayout(id: string): Promise<ActionResult> {
  try {
    await api(`/admin/referrals/payouts/${id}/reject`, { method: 'POST' });
  } catch (err) {
    return failed(err);
  }
  revalidatePath('/referrals');
  return { ok: true, message: 'Declined. Their balance is back.' };
}
