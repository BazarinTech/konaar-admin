'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { api, ApiError, TOKEN_COOKIE } from './api';

export interface Admin {
  id: string;
  email: string;
  name: string;
  roles: string[];
  status: string;
  lastLoginAt: string | null;
}

/**
 * Eight hours, to match the API's own token lifetime.
 *
 * A cookie that outlives the token it carries produces the worst version of
 * this: a console that looks signed in and fails on every request.
 */
const MAX_AGE_SECONDS = 8 * 60 * 60;

export async function signIn(
  _state: { error?: string } | undefined,
  form: FormData,
): Promise<{ error?: string }> {
  const email = String(form.get('email') ?? '').trim();
  const password = String(form.get('password') ?? '');
  if (!email || !password) return { error: 'Enter your email and password.' };

  try {
    const { token } = await api<{ token: string; admin: Admin }>(
      '/admin/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        anonymous: true,
      },
    );
    (await cookies()).set(TOKEN_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: MAX_AGE_SECONDS,
    });
  } catch (err) {
    return {
      error:
        err instanceof ApiError
          ? err.message
          : 'The API could not be reached. Try again.',
    };
  }
  redirect('/');
}

export async function signOut(): Promise<void> {
  (await cookies()).delete(TOKEN_COOKIE);
  redirect('/login');
}

/** The signed-in administrator, or a redirect to sign in. */
export async function currentAdmin(): Promise<Admin> {
  try {
    return await api<Admin>('/admin/me');
  } catch {
    redirect('/login');
  }
}
