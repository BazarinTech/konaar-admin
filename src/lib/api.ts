import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const TOKEN_COOKIE = 'konar_admin_session';

function base(): string {
  const url = process.env.KONAR_API_URL;
  if (!url) throw new Error('KONAR_API_URL is not set.');
  return url.replace(/\/$/, '');
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

/**
 * Calls the Konaar admin API as the signed-in administrator.
 *
 * Server-only, and deliberately so: the session token lives in an httpOnly
 * cookie and is attached here, which means it never reaches the browser at all.
 * An administrator's token is total access to every workspace on the platform —
 * keeping it out of `localStorage` removes the entire class of attacks where
 * one piece of injected script walks away with it.
 */
export async function api<T>(
  path: string,
  init: RequestInit & { anonymous?: boolean } = {},
): Promise<T> {
  const { anonymous, ...rest } = init;
  const token = anonymous
    ? null
    : (await cookies()).get(TOKEN_COOKIE)?.value ?? null;

  const response = await fetch(`${base()}${path}`, {
    ...rest,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...rest.headers,
    },
    // Admin screens are about what is true now; nothing here is cacheable.
    cache: 'no-store',
  });

  if (response.status === 204) return undefined as T;

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error = (body as { error?: { code?: string; message?: string } })
      ?.error;
    throw new ApiError(
      response.status,
      error?.code ?? 'UNKNOWN',
      error?.message ?? `The API returned ${response.status}.`,
    );
  }
  return body as T;
}

/**
 * The same call, but an expired session sends the administrator to sign in
 * again instead of throwing into an error boundary.
 *
 * Used by pages. Actions use `api` directly so they can report the failure in
 * place rather than navigating away from a half-filled form.
 */
export async function apiPage<T>(path: string): Promise<T> {
  try {
    return await api<T>(path);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) redirect('/login');
    throw err;
  }
}
