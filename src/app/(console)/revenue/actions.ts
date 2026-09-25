'use server';

import { revalidatePath } from 'next/cache';
import { api, ApiError } from '@/lib/api';

export interface ActionResult {
  ok?: boolean;
  error?: string;
  message?: string;
}

export interface EntryInput {
  kind: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  occurredOn?: string;
}

function refresh() {
  revalidatePath('/revenue');
  revalidatePath('/revenue/ledger');
  // The dashboard's profit figure includes hand-entered lines.
  revalidatePath('/');
}

export async function createEntry(input: EntryInput): Promise<ActionResult> {
  if (!(input.amount > 0)) return { error: 'Enter an amount above zero.' };
  if (input.description.trim().length < 3) {
    return { error: 'Describe what this is, so the ledger reads by itself.' };
  }
  try {
    await api('/admin/revenue/entries', {
      method: 'POST',
      body: JSON.stringify({
        ...input,
        description: input.description.trim(),
        // A date without a time is ambiguous across zones; anchor it to UTC
        // noon so it lands on the day the operator picked wherever they are.
        occurredOn: input.occurredOn
          ? new Date(`${input.occurredOn}T12:00:00Z`).toISOString()
          : undefined,
      }),
    });
  } catch (err) {
    return {
      error: err instanceof ApiError ? err.message : 'That did not go through.',
    };
  }
  refresh();
  return { ok: true, message: 'Recorded.' };
}

export async function deleteEntry(id: string): Promise<ActionResult> {
  try {
    await api(`/admin/revenue/entries/${id}`, { method: 'DELETE' });
  } catch (err) {
    return {
      error: err instanceof ApiError ? err.message : 'That did not go through.',
    };
  }
  refresh();
  return { ok: true, message: 'Withdrawn. The line is kept, marked deleted.' };
}
