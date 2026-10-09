'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { CheckIcon, RotateCcwIcon } from 'lucide-react';
import { updateSetting } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ago } from '@/lib/format';
import type { Setting } from './types';

/**
 * One knob, with what it does and where it lands.
 *
 * Save is only enabled once the value differs from what is stored, so the
 * button never invites a write that changes nothing — and every field says out
 * loud when the change takes effect, because "from the next call" and "from the
 * next hour" are very different promises to make to an operator.
 */
export function SettingField({ setting }: { setting: Setting }) {
  const [value, setValue] = useState(String(setting.value));
  const [pending, start] = useTransition();
  const parsed = Number(value);
  const changed = Number.isFinite(parsed) && parsed !== setting.value;
  const outOfRange = parsed < setting.min || parsed > setting.max;

  const save = (next: number) =>
    start(async () => {
      const result = await updateSetting(setting.key, next);
      if (result.error) toast.error(result.error);
      else toast.success(result.message ?? 'Saved.');
    });

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={setting.key}>{setting.label}</Label>
        <span className="text-muted-foreground text-xs">
          {/* Suffix the bounds for units that read as a suffix — "0 – 400"
              says nothing about what 400 is, where "0% – 400%" does. */}
          {setting.unit === '×' || setting.unit === '%'
            ? `${setting.min}${setting.unit} – ${setting.max}${setting.unit}`
            : `${setting.min} – ${setting.max}`}
        </span>
      </div>
      <p className="text-muted-foreground text-xs">{setting.help}</p>
      <div className="flex items-center gap-2">
        <Input
          id={setting.key}
          type="number"
          step={setting.unit === '×' ? 0.1 : 1}
          min={setting.min}
          max={setting.max}
          value={value}
          aria-invalid={outOfRange}
          onChange={(event) => setValue(event.target.value)}
          className="tabular max-w-32"
        />
        <span className="text-muted-foreground text-sm">{setting.unit}</span>
        <Button
          size="sm"
          disabled={!changed || outOfRange || pending}
          onClick={() => save(parsed)}
        >
          <CheckIcon />
          Save
        </Button>
        {setting.value !== setting.default ? (
          <Button
            size="sm"
            variant="ghost"
            disabled={pending}
            onClick={() => {
              setValue(String(setting.default));
              save(setting.default);
            }}
          >
            <RotateCcwIcon />
            Reset to {setting.default}
          </Button>
        ) : null}
      </div>
      <p className="text-muted-foreground text-xs">
        {setting.appliesTo}
        {setting.updatedBy
          ? ` · last changed ${ago(setting.updatedAt)} by ${setting.updatedBy.name}`
          : ' · never changed'}
      </p>
    </div>
  );
}
