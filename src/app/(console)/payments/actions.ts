'use server';

import { revalidatePath } from 'next/cache';
import { api, ApiError } from '@/lib/api';

export interface ActionResult {
  ok?: boolean;
  error?: string;
  message?: string;
}

async function call(path: string, body?: unknown): Promise<ActionResult> {
  try {
    await api(path, {
      method: 'POST',
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    revalidatePath('/payments');
    return { ok: true };
  } catch (err) {
    return {
      error: err instanceof ApiError ? err.message : 'That did not go through. Try again.',
    };
  }
}

/** Credit an unclaimed M-Pesa payment to a workspace, as credits on one ledger. */
export async function assignPayment(
  txId: string,
  workspaceId: string,
  kind: 'ai' | 'cloud',
): Promise<ActionResult> {
  const r = await call(`/admin/payments/unclaimed/${encodeURIComponent(txId)}/assign`, {
    workspaceId: workspaceId.trim(),
    kind,
  });
  return { ...r, message: r.ok ? 'Credited to the workspace.' : undefined };
}

/** Match an unclaimed M-Pesa payment to the checkout it was meant for. */
export async function matchPayment(txId: string, paymentId: string): Promise<ActionResult> {
  const r = await call(`/admin/payments/unclaimed/${encodeURIComponent(txId)}/assign`, {
    paymentId: paymentId.trim(),
  });
  return { ...r, message: r.ok ? 'Matched to the checkout.' : undefined };
}

export async function dismissPayment(txId: string): Promise<ActionResult> {
  const r = await call(`/admin/payments/unclaimed/${encodeURIComponent(txId)}/dismiss`);
  return { ...r, message: r.ok ? 'Set aside.' : undefined };
}
