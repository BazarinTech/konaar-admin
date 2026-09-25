import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Konar Console',
  description: 'Platform administration for Konar.',
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // `dark` is set here rather than negotiated: the console is one surface for
    // one audience, and a flash of white while a theme loads is worse than not
    // offering the choice.
    <html lang="en" className={`dark ${inter.variable}`}>
      <body className="bg-background text-foreground antialiased">
        {children}
        <Toaster position="bottom-right" theme="dark" />
      </body>
    </html>
  );
}
