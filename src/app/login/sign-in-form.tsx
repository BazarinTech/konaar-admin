'use client';

import { useActionState } from 'react';
import { LoaderCircleIcon } from 'lucide-react';
import { signIn } from '@/lib/session';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function SignInForm() {
  const [state, action, pending] = useActionState(signIn, {});

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          autoFocus
          required
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>
      {state?.error ? (
        <p
          role="alert"
          className="text-destructive bg-destructive/10 border-destructive/20 rounded-md border px-3 py-2 text-sm"
        >
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? (
          <>
            <LoaderCircleIcon className="animate-spin" />
            Signing in
          </>
        ) : (
          'Sign in'
        )}
      </Button>
    </form>
  );
}
