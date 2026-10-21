'use server';

import { revalidatePath } from 'next/cache';
import { api, ApiError } from '@/lib/api';
import type { CaseStatus } from './types';

export interface ActionResult {
  ok?: boolean;
  error?: string;
  message?: string;
}

async function post(path: string, body: unknown): Promise<ActionResult & { status?: string }> {
  try {
    const r = await api<{ status?: string }>(path, { method: 'POST', body: JSON.stringify(body) });
    return { ok: true, status: r?.status };
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : 'That did not go through. Try again.' };
  }
}

export async function replyToCase(
  id: string,
  input: { body: string; internal: boolean; status?: CaseStatus },
): Promise<ActionResult> {
  const r = await post(`/admin/support/cases/${id}/messages`, input);
  if (r.error) return r;
  revalidatePath(`/support/${id}`);
  revalidatePath('/support');
  return {
    ok: true,
    message: input.internal ? 'Note added.' : 'Reply sent — the customer has been emailed.',
  };
}

export async function updateCase(
  id: string,
  patch: { status?: CaseStatus; severity?: number; assignedTo?: string | null },
): Promise<ActionResult> {
  const r = await post(`/admin/support/cases/${id}`, patch);
  if (r.error) return r;
  revalidatePath(`/support/${id}`);
  revalidatePath('/support');
  return { ok: true, message: 'Case updated.' };
}
