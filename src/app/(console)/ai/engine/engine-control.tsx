'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { CheckIcon, RotateCcwIcon } from 'lucide-react';
import { resetEngine, setEngine } from '../actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { EngineModel, EngineSetting } from '../types';

const ROLE_LABELS: Record<string, string> = {
  auto: 'Automatic',
  editor: 'Editor',
  architect: 'Architect',
  premium: 'Premium',
};

const EFFORT_LABELS: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  xhigh: 'Extra high',
  max: 'Max',
};

/**
 * One engine knob.
 *
 * Choices save the moment they are made — a select or a switch has no
 * half-typed state to protect. Numbers wait for Save, so a value mid-edit
 * ("3" on the way to "300") is never written. Reset deletes the override
 * rather than writing the default back, so a default that later changes in
 * the code still reaches this installation.
 */
export function EngineControl({
  setting,
  models,
  roles,
  efforts,
  compact = false,
}: {
  setting: EngineSetting;
  models: EngineModel[];
  roles: string[];
  efforts: string[];
  /** Inline in a table: no label, help or history line. */
  compact?: boolean;
}) {
  const [pending, start] = useTransition();
  const [draft, setDraft] = useState(String(setting.value));

  const save = (value: string | number | boolean) =>
    start(async () => {
      const result = await setEngine(setting.key, value);
      if (result.error) toast.error(result.error);
      else toast.success(result.message ?? 'Saved.');
    });

  const reset = () =>
    start(async () => {
      const result = await resetEngine(setting.key);
      if (result.error) toast.error(result.error);
      else {
        setDraft(String(setting.default));
        toast.success(result.message ?? 'Reset.');
      }
    });

  const control = (() => {
    switch (setting.kind) {
      case 'model': {
        // The editor answers in structured output. Offering a model that
        // cannot would invite a save the API refuses; showing it disabled
        // with the reason says why it is missing.
        return (
          <Select
            value={String(setting.value)}
            onValueChange={(v) => save(v)}
            disabled={pending}
          >
            <SelectTrigger className="w-full max-w-sm" aria-label={setting.label}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {models.map((m) => {
                const unusable =
                  setting.role === 'editor' && !m.supportsStructuredOutput;
                return (
                  <SelectItem key={m.id} value={m.id} disabled={unusable}>
                    <span className="flex items-baseline gap-2">
                      <span>{m.label}</span>
                      <span className="text-muted-foreground text-xs">
                        ${m.inputPerMTok} / ${m.outputPerMTok} per M
                        {unusable ? ' · no structured output' : ''}
                      </span>
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        );
      }
      case 'role':
        return (
          <Select
            value={String(setting.value)}
            onValueChange={(v) => save(v)}
            disabled={pending}
          >
            <SelectTrigger className="w-36" aria-label={setting.label}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {['auto', ...roles].map((r) => (
                <SelectItem key={r} value={r}>
                  {ROLE_LABELS[r] ?? r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'effort':
        return (
          <Select
            value={String(setting.value)}
            onValueChange={(v) => save(v)}
            disabled={pending}
          >
            <SelectTrigger className="w-32" aria-label={setting.label}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {efforts.map((e) => (
                <SelectItem key={e} value={e}>
                  {EFFORT_LABELS[e] ?? e}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'bool':
        return (
          <Switch
            checked={Boolean(setting.value)}
            onCheckedChange={(v) => save(v)}
            disabled={pending}
            aria-label={setting.label}
          />
        );
      case 'int': {
        const parsed = Number(draft);
        const valid =
          Number.isInteger(parsed) &&
          parsed >= (setting.min ?? -Infinity) &&
          parsed <= (setting.max ?? Infinity);
        const changed = valid && parsed !== setting.value;
        return (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              inputMode="numeric"
              step={1}
              min={setting.min}
              max={setting.max}
              value={draft}
              aria-label={setting.label}
              aria-invalid={!valid}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && changed) save(parsed);
              }}
              className={cn('tabular', compact ? 'w-28' : 'max-w-32')}
            />
            <Button
              size="sm"
              variant={compact ? 'ghost' : 'default'}
              disabled={!changed || pending}
              onClick={() => save(parsed)}
              aria-label={`Save ${setting.label}`}
            >
              <CheckIcon />
              {compact ? null : 'Save'}
            </Button>
          </div>
        );
      }
    }
  })();

  const resetButton = setting.overridden ? (
    <Button
      size="sm"
      variant="ghost"
      disabled={pending}
      onClick={reset}
      title={`Reset to ${formatValue(setting, setting.default)}`}
    >
      <RotateCcwIcon />
      {compact ? null : `Reset to ${formatValue(setting, setting.default)}`}
    </Button>
  ) : null;

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {control}
        {resetButton}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-sm font-medium">{setting.label}</span>
        {setting.overridden ? (
          <span className="text-xs text-warning">
            Changed from {formatValue(setting, setting.default)}
          </span>
        ) : (
          <span className="text-muted-foreground text-xs">Default</span>
        )}
      </div>
      <p className="text-muted-foreground text-xs">{setting.help}</p>
      <div className="flex flex-wrap items-center gap-2">
        {control}
        {setting.kind === 'int' && setting.min !== undefined ? (
          <span className="text-muted-foreground text-xs">
            {setting.min} – {setting.max}
          </span>
        ) : null}
        {resetButton}
      </div>
      <p className="text-muted-foreground text-xs">{setting.appliesTo}</p>
    </div>
  );
}

/** A value as the operator would say it. */
export function formatValue(
  setting: Pick<EngineSetting, 'kind'>,
  value: string | number | boolean,
): string {
  switch (setting.kind) {
    case 'bool':
      return value ? 'on' : 'off';
    case 'role':
      return (ROLE_LABELS[String(value)] ?? String(value)).toLowerCase();
    case 'effort':
      return (EFFORT_LABELS[String(value)] ?? String(value)).toLowerCase();
    case 'int':
      return Number(value).toLocaleString();
    default:
      return String(value);
  }
}
