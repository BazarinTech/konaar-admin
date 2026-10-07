import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { TOKEN_COOKIE } from '@/lib/api';
import { SignInForm } from './sign-in-form';

export const metadata = { title: 'Sign in — Konaar Console' };

export default async function LoginPage() {
  // Already signed in: the console, not the door.
  if ((await cookies()).get(TOKEN_COOKIE)) redirect('/');

  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <div className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-lg text-sm font-bold">
            K
          </div>
          <h1 className="text-lg font-semibold tracking-tight">
            Konaar Console
          </h1>
          <p className="text-muted-foreground text-sm">
            Platform administration. Sign in to continue.
          </p>
        </div>
        <SignInForm />
      </div>
    </main>
  );
}
