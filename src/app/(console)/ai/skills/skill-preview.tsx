'use client';

import { useState, useTransition } from 'react';
import { FlaskConicalIcon } from 'lucide-react';
import { previewSkills } from '../actions';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { OPERATION_LABELS, SITE_TYPE_LABELS, type SkillPreview } from '../types';

const ANY = '__unknown__';

/**
 * What a build would be told, without running one.
 *
 * Reads the stored skills, so a skill saved a moment ago shows here even
 * though a busy build may not see it for another few seconds. The point is
 * to answer "will my skill fire for this request?" before a customer's build
 * finds out.
 */
export function SkillPreviewPanel({
  operations,
  siteTypes,
}: {
  operations: string[];
  siteTypes: string[];
}) {
  const [operation, setOperation] = useState(operations[2] ?? operations[0]);
  const [siteType, setSiteType] = useState<string>(ANY);
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState<SkillPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const run = () =>
    start(async () => {
      const response = await previewSkills({
        operation,
        siteType: siteType === ANY ? null : siteType,
        prompt,
      });
      setError(response.error ?? null);
      setResult(response.result ?? null);
    });

  const over = result ? result.chars > result.budget.chars : false;

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label>Work</Label>
          <Select value={operation} onValueChange={setOperation}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {operations.map((op) => (
                <SelectItem key={op} value={op}>
                  {OPERATION_LABELS[op] ?? op}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Kind of site</Label>
          <Select value={siteType} onValueChange={setSiteType}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Not decided yet (specification)</SelectItem>
              {siteTypes.map((t) => (
                <SelectItem key={t} value={t}>
                  {SITE_TYPE_LABELS[t] ?? t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="preview-prompt">A request, as a customer would write it</Label>
        <Textarea
          id="preview-prompt"
          rows={3}
          value={prompt}
          placeholder="A shop for my coffee roastery that takes payments with Stripe"
          onChange={(e) => setPrompt(e.target.value)}
        />
      </div>
      <div>
        <Button onClick={run} disabled={pending}>
          <FlaskConicalIcon />
          {pending ? 'Checking…' : 'Show what the build receives'}
        </Button>
      </div>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}

      {result ? (
        <div className="grid gap-3">
          <p className="text-sm">
            {result.applied.length === 0
              ? 'No skill applies to this request.'
              : `${result.applied.length} ${result.applied.length === 1 ? 'skill applies' : 'skills apply'}: ${result.applied
                  .map((s) => s.name)
                  .join(', ')}.`}{' '}
            <span className={cn('tabular text-xs', over ? 'text-destructive' : 'text-muted-foreground')}>
              {result.chars.toLocaleString()} of {result.budget.chars.toLocaleString()} characters
            </span>
          </p>
          {result.dropped.length ? (
            <p className="text-sm text-warning">
              Left out to stay within budget: {result.dropped.map((s) => s.name).join(', ')}.
              Raise their priority or shorten the others.
            </p>
          ) : null}
          {result.text ? (
            <pre className="bg-muted max-h-80 overflow-auto rounded-md p-3 text-xs whitespace-pre-wrap">
              {result.text}
            </pre>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
