'use client';

import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { SCOPE_LABEL, type Scope } from './pricing-types';

/** The fields a discount and an offer share: which plans, which billing, when. */

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <span className="text-muted-foreground text-xs">{label}</span>
      {children}
      {hint ? <span className="text-muted-foreground text-[11px]">{hint}</span> : null}
    </div>
  );
}

/**
 * Which plans a rule applies to. Nothing selected means every paid plan, which
 * is said in words — an empty row of chips reads as "none".
 */
export function PlanPicker({
  plans,
  value,
  onChange,
}: {
  plans: { code: string; name: string; priceCents: number }[];
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const paid = plans.filter((p) => p.priceCents > 0);
  return (
    <Field
      label="Plans"
      hint={value.length === 0 ? 'Every paid plan.' : undefined}
    >
      <div className="flex flex-wrap gap-1.5">
        {paid.map((plan) => {
          const on = value.includes(plan.code);
          return (
            <button
              key={plan.code}
              type="button"
              aria-pressed={on}
              onClick={() =>
                onChange(on ? value.filter((c) => c !== plan.code) : [...value, plan.code])
              }
              className={cn(
                'rounded-md border px-2 py-1 text-xs transition-colors',
                on
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {plan.name}
            </button>
          );
        })}
      </div>
    </Field>
  );
}

export function ScopeSelect({
  value,
  onChange,
}: {
  value: Scope;
  onChange: (next: Scope) => void;
}) {
  return (
    <Field label="Billing">
      <Select value={value} onValueChange={(v) => onChange(v as Scope)}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(SCOPE_LABEL) as Scope[]).map((s) => (
            <SelectItem key={s} value={s}>
              {SCOPE_LABEL[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

/** Start and end dates. Both optional: no start is "now", no end is "until stopped". */
export function WindowFields({
  startsAt,
  endsAt,
  onStartsAt,
  onEndsAt,
}: {
  startsAt: string;
  endsAt: string;
  onStartsAt: (v: string) => void;
  onEndsAt: (v: string) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Starts" hint="Empty starts it now.">
        <Input type="date" value={startsAt} onChange={(e) => onStartsAt(e.target.value)} />
      </Field>
      <Field label="Ends" hint="Empty runs until you stop it.">
        <Input type="date" value={endsAt} onChange={(e) => onEndsAt(e.target.value)} />
      </Field>
    </div>
  );
}

/** `2026-11-01` from an ISO timestamp, for a date input. */
export function dateInput(iso: string | null): string {
  return iso ? iso.slice(0, 10) : '';
}

/** A date input's value as the start (or end) of that UTC day, or null. */
export function isoFrom(date: string, edge: 'start' | 'end'): string | null {
  if (!date) return null;
  return edge === 'start' ? `${date}T00:00:00.000Z` : `${date}T23:59:59.999Z`;
}

/** "" → null, otherwise a positive whole number (or null if it is not one). */
export function wholeOrNull(text: string): number | null {
  const t = text.trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isInteger(n) && n > 0 ? n : null;
}
