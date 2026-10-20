import Link from 'next/link';
import { SlidersHorizontalIcon } from 'lucide-react';
import { apiPage } from '@/lib/api';
import { ago } from '@/lib/format';
import { PageHeader } from '@/components/page-header';
import { Empty } from '@/components/empty';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { SkillForm } from './skill-form';
import { SkillDelete, SkillToggle } from './skill-row-actions';
import { SkillPreviewPanel } from './skill-preview';
import {
  OPERATION_LABELS,
  SITE_TYPE_LABELS,
  type Skill,
  type SkillsOverview,
} from '../types';

export const metadata = { title: 'Skills — Konaar Console' };

export default async function SkillsPage() {
  const { skills, operations, siteTypes, budget } =
    await apiPage<SkillsOverview>('/admin/ai/skills');
  const on = skills.filter((s) => s.enabled).length;
  const form = { operations, siteTypes, budgetChars: budget.chars };

  return (
    <>
      <PageHeader
        title="Skills"
        description="Standing instructions the engine applies where they fit — to the work you choose, for the kinds of site you choose, and optionally only when a request mentions something. Changes reach builds within ten seconds."
      >
        <Button variant="outline" size="sm" asChild>
          <Link href="/ai/engine">
            <SlidersHorizontalIcon />
            Engine
          </Link>
        </Button>
        <SkillForm {...form} />
      </PageHeader>

      <p className="text-muted-foreground mb-4 text-sm">
        {skills.length === 0
          ? 'No skills yet.'
          : `${on} of ${skills.length} on. A build receives at most ${budget.count} skills and ${budget.chars.toLocaleString()} characters of them; past that the lowest-priority ones are left out, and the build log says which.`}
      </p>

      {skills.length === 0 ? (
        <Empty>
          A skill is guidance the engine follows for one kind of work — how
          this platform does checkout, what every dashboard must include, a
          rule for reviews. Create one and it applies to matching builds from
          then on.
        </Empty>
      ) : (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-3">
          {skills.map((skill) => (
            <SkillCard key={skill.id} skill={skill} form={form} />
          ))}
        </div>
      )}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Test a request</CardTitle>
          <CardDescription>
            See exactly which skills a build would receive, and the text it
            would be given, before a customer&apos;s build finds out.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SkillPreviewPanel operations={operations} siteTypes={siteTypes} />
        </CardContent>
      </Card>
    </>
  );
}

function SkillCard({
  skill,
  form,
}: {
  skill: Skill;
  form: { operations: string[]; siteTypes: string[]; budgetChars: number };
}) {
  const inert = skill.operations.length === 0;
  return (
    <Card className={skill.enabled ? undefined : 'opacity-70'}>
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{skill.name}</span>
              <code className="text-muted-foreground font-mono text-xs">
                {skill.slug}
              </code>
              {skill.priority !== 0 ? (
                <Badge variant="outline">priority {skill.priority}</Badge>
              ) : null}
              {!skill.enabled ? <Badge variant="secondary">off</Badge> : null}
              {inert ? <Badge variant="warning">applies to nothing</Badge> : null}
            </div>
            {skill.description ? (
              <p className="text-muted-foreground text-sm">{skill.description}</p>
            ) : null}
          </div>
          <div className="flex items-center gap-1">
            <SkillToggle id={skill.id} name={skill.name} enabled={skill.enabled} />
            <SkillForm skill={skill} {...form} />
            <SkillDelete id={skill.id} name={skill.name} />
          </div>
        </div>

        <dl className="text-muted-foreground grid gap-1 text-xs sm:grid-cols-3">
          <Scope label="Work">
            {inert
              ? 'none chosen'
              : skill.operations.map((o) => OPERATION_LABELS[o] ?? o).join(', ')}
          </Scope>
          <Scope label="Sites">
            {skill.siteTypes.length
              ? skill.siteTypes.map((t) => SITE_TYPE_LABELS[t] ?? t).join(', ')
              : 'every kind'}
          </Scope>
          <Scope label="When">
            {skill.triggers.length
              ? `request mentions ${skill.triggers.join(', ')}`
              : 'always'}
          </Scope>
        </dl>

        <details className="group">
          <summary className="text-muted-foreground hover:text-foreground cursor-pointer text-xs">
            Instructions · {skill.instructions.length.toLocaleString()} characters ·
            changed {ago(skill.updatedAt)}
          </summary>
          <pre className="bg-muted mt-2 max-h-64 overflow-auto rounded-md p-3 text-xs whitespace-pre-wrap">
            {skill.instructions}
          </pre>
        </details>
      </CardContent>
    </Card>
  );
}

function Scope({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-1">
      <dt className="text-foreground font-medium">{label}:</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  );
}
