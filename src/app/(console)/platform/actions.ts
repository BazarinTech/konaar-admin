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
    error:
      err instanceof ApiError ? err.message : 'That did not go through. Try again.',
  };
}

export async function updateSetting(
  key: string,
  value: number,
): Promise<ActionResult> {
  if (!Number.isFinite(value)) return { error: 'Enter a number.' };
  try {
    await api('/admin/platform/settings', {
      method: 'POST',
      body: JSON.stringify({ key, value }),
    });
  } catch (err) {
    return failed(err);
  }
  revalidatePath('/platform');
  // Pricing shows on the dashboard's margin figure too.
  revalidatePath('/');
  return { ok: true, message: 'Saved. It applies from the next call.' };
}

export async function updatePlan(
  code: string,
  patch: Record<string, unknown>,
): Promise<ActionResult> {
  try {
    await api(`/admin/platform/plans/${code}`, {
      method: 'POST',
      body: JSON.stringify(patch),
    });
  } catch (err) {
    return failed(err);
  }
  revalidatePath('/platform/plans');
  revalidatePath('/platform');
  return { ok: true, message: `The ${code} plan has been updated.` };
}
