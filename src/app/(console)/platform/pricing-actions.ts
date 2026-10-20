'use server';

import { revalidatePath } from 'next/cache';
import { api, ApiError } from '@/lib/api';
import type { ActionResult } from './actions';
import type { Redemption } from './pricing-types';

function failed(err: unknown): ActionResult {
  return {
    error:
      err instanceof ApiError ? err.message : 'That did not go through. Try again.',
  };
}

async function send(
  path: string,
  method: 'POST' | 'DELETE',
  body: unknown,
  page: string,
  message: string,
): Promise<ActionResult> {
  try {
    await api(path, {
      method,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (err) {
    return failed(err);
  }
  revalidatePath(page);
  // The plans page shows what is running against each plan.
  revalidatePath('/platform/plans');
  return { ok: true, message };
}

export async function saveDiscount(
  id: string | null,
  input: Record<string, unknown>,
): Promise<ActionResult> {
  return send(
    id ? `/admin/platform/discounts/${id}` : '/admin/platform/discounts',
    'POST',
    input,
    '/platform/discounts',
    id ? 'Discount updated.' : 'Discount created.',
  );
}

export async function removeDiscount(id: string): Promise<ActionResult> {
  return send(
    `/admin/platform/discounts/${id}`,
    'DELETE',
    undefined,
    '/platform/discounts',
    'Discount retired. Nobody new can get it.',
  );
}

export async function loadRedemptions(id: string): Promise<Redemption[]> {
  const res = await api<{ data: Redemption[] }>(
    `/admin/platform/discounts/${id}/redemptions`,
  );
  return res.data;
}

export async function saveOffer(
  id: string | null,
  input: Record<string, unknown>,
): Promise<ActionResult> {
  return send(
    id ? `/admin/platform/offers/${id}` : '/admin/platform/offers',
    'POST',
    input,
    '/platform/offers',
    id ? 'Offer updated.' : 'Offer created.',
  );
}

export async function removeOffer(id: string): Promise<ActionResult> {
  return send(
    `/admin/platform/offers/${id}`,
    'DELETE',
    undefined,
    '/platform/offers',
    'Offer retired. Perks already granted are kept.',
  );
}
