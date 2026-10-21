import Link from 'next/link';
import { apiPage } from '@/lib/api';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HtmlFrame } from '@/components/email/html-frame';
import type { TemplateInfo } from '../types';

export const metadata = { title: 'Email templates — Konaar Console' };

export default async function TemplatesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const pick = Array.isArray(params.t) ? params.t[0] : params.t;
  const list = await apiPage<{ data: TemplateInfo[] }>('/admin/email/templates');
  const current = list.data.find((t) => t.name === pick) ?? list.data[0];
  const preview = current
    ? await apiPage<{ subject: string; html: string; text: string }>(`/admin/email/templates/${current.name}`)
    : null;

  return (
    <>
      <PageHeader
        title="Templates"
        description="Every email the platform sends on its own, rendered with sample data exactly as a customer receives it."
      />
      <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
        <nav className="flex flex-col gap-1">
          {list.data.map((t) => (
            <Link
              key={t.name}
              href={{ pathname: '/email/templates', query: { t: t.name } }}
              aria-current={t.name === current?.name ? 'page' : undefined}
              className={cn(
                'hover:bg-accent/50 rounded-md border px-3 py-2.5 transition-colors',
                t.name === current?.name ? 'bg-accent border-transparent' : 'border-transparent',
              )}
            >
              <div className="text-sm font-medium">{t.label}</div>
              <div className="text-muted-foreground text-xs">{t.trigger}</div>
            </Link>
          ))}
        </nav>
        {preview && current ? (
          <Card className="min-w-0">
            <CardHeader>
              <CardTitle>{preview.subject}</CardTitle>
              <p className="text-muted-foreground text-xs">{current.trigger}</p>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <HtmlFrame html={preview.html} className="border" minHeight={420} />
              <details className="rounded-md border px-3 py-2">
                <summary className="cursor-pointer text-sm">Plain-text version</summary>
                <pre className="text-muted-foreground mt-2 overflow-x-auto text-xs whitespace-pre-wrap">{preview.text}</pre>
              </details>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </>
  );
}
