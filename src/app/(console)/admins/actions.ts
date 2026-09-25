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

export async function createAdmin(input: {
  email: string;
  name: string;
  password: string;
  roles: string[];
}): Promise<ActionResult> {
  try {
    await api('/admin/admins', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  } catch (err) {
    return failed(err);
  }
  revalidatePath('/admins');
  return {
    ok: true,
    message: `${input.email} can sign in now. Tell them their password over something other than email.`,
  };
}

export async function setRoles(
  id: string,
  roles: string[],
): Promise<ActionResult> {
  try {
    await api(`/admin/admins/${id}/roles`, {
      method: 'POST',
      body: JSON.stringify({ roles }),
    });
  } catch (err) {
    return failed(err);
  }
  revalidatePath('/admins');
  return { ok: true, message: 'Areas updated.' };
}

export async function setStatus(
  id: string,
  status: 'active' | 'suspended',
): Promise<ActionResult> {
  try {
    await api(`/admin/admins/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    });
  } catch (err) {
    return failed(err);
  }
  revalidatePath('/admins');
  return {
    ok: true,
    message: status === 'active' ? 'Restored.' : 'Suspended.',
  };
}

export async function resetPassword(
  id: string,
  password: string,
): Promise<ActionResult> {
  if (password.length < 8) {
    return { error: 'Use at least eight characters.' };
  }
  try {
    await api(`/admin/admins/${id}/password`, {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  } catch (err) {
    return failed(err);
  }
  revalidatePath('/admins');
  return { ok: true, message: 'Password set.' };
}

export async function removeAdmin(id: string): Promise<ActionResult> {
  try {
    await api(`/admin/admins/${id}`, { method: 'DELETE' });
  } catch (err) {
    return failed(err);
  }
  revalidatePath('/admins');
  return { ok: true, message: 'Removed. Their record of changes is kept.' };
}
