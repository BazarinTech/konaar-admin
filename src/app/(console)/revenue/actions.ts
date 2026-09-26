'use server';

import { revalidatePath } from 'next/cache';
import { api, ApiError } from '@/lib/api';
import type { LedgerLine } from './types';

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

export interface RecurringInput {
  kind: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  dayOfMonth: number;
  startsOn?: string;
  endsOn?: string;
}

/**
 * Schedules money that repeats.
 *
 * The dates are anchored to UTC noon for the same reason a one-off entry is: a
 * date picked as "the 1st" must not become the 31st of the previous month for
 * anyone east or west of the server.
 */
export async function createRecurring(
  input: RecurringInput,
): Promise<ActionResult> {
  if (!(input.amount > 0)) return { error: 'Enter an amount above zero.' };
  if (input.description.trim().length < 3) {
    return { error: 'Describe what this is, so the ledger reads by itself.' };
  }
  try {
    await api('/admin/revenue/recurring', {
      method: 'POST',
      body: JSON.stringify({
        ...input,
        description: input.description.trim(),
        startsOn: input.startsOn
          ? new Date(`${input.startsOn}T12:00:00Z`).toISOString()
          : undefined,
        endsOn: input.endsOn
          ? new Date(`${input.endsOn}T12:00:00Z`).toISOString()
          : undefined,
      }),
    });
  } catch (err) {
    return {
      error: err instanceof ApiError ? err.message : 'That did not go through.',
    };
  }
  refresh();
  return {
    ok: true,
    message: 'Scheduled. Anything already due has been posted.',
  };
}

export async function setRecurringStatus(
  id: string,
  status: 'active' | 'paused',
): Promise<ActionResult> {
  try {
    await api(`/admin/revenue/recurring/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    });
  } catch (err) {
    return {
      error: err instanceof ApiError ? err.message : 'That did not go through.',
    };
  }
  refresh();
  return {
    ok: true,
    message: status === 'active' ? 'Resumed.' : 'Paused — it posts nothing until resumed.',
  };
}

export async function removeRecurring(id: string): Promise<ActionResult> {
  try {
    await api(`/admin/revenue/recurring/${id}`, { method: 'DELETE' });
  } catch (err) {
    return {
      error: err instanceof ApiError ? err.message : 'That did not go through.',
    };
  }
  refresh();
  return { ok: true, message: 'Ended. The lines it posted stay in the ledger.' };
}

/** Fetches the next page of ledger lines for the "load more" button. */
export async function loadLedger(
  days: number,
  cursor: string,
): Promise<{
  data: LedgerLine[];
  pageInfo: { nextCursor: string | null; hasMore: boolean };
} | null> {
  try {
    return await api(
      `/admin/revenue/ledger?days=${days}&cursor=${encodeURIComponent(cursor)}`,
    );
  } catch {
    return null;
  }
}
