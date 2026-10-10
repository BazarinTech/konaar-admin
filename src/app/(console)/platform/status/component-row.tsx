'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { EyeOffIcon, Trash2Icon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { deleteComponent, updateComponent } from './actions';
import type { ComponentStatus, StatusComponentRecord, StatusGroup } from './page';

export const STATUS_OPTIONS: { value: ComponentStatus; label: string }[] = [
  { value: 'operational', label: 'Operational' },
  { value: 'degraded', label: 'Degraded' },
  { value: 'partial_outage', label: 'Partial outage' },
  { value: 'major_outage', label: 'Major outage' },
  { value: 'maintenance', label: 'Maintenance' },
];

const DOT: Record<ComponentStatus, string> = {
  operational: 'bg-success',
  degraded: 'bg-warning',
  partial_outage: 'bg-warning',
  major_outage: 'bg-destructive',
  maintenance: 'bg-chart-1',
};

/**
 * One service, with the control that gets used.
 *
 * The status picker writes immediately rather than behind a save button:
 * the moment anybody touches this, something is on fire and a two-step
 * save is two steps too many. Everything else about a service is setup, and
 * setup can live behind the select beside it.
 */
export function ComponentRow({
  component,
  groups,
}: {
  component: StatusComponentRecord;
  groups: StatusGroup[];
}) {
  const [pending, start] = React.useTransition();
  const [confirming, setConfirming] = React.useState(false);

  function save(patch: Record<string, unknown>) {
    start(async () => {
      const result = await updateComponent(component.id, patch);
      if (result.error) toast.error(result.error);
      else toast.success(result.message ?? 'Saved.');
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3 p-4">
      <span
        aria-hidden
        className={`size-2 shrink-0 rounded-full ${DOT[component.status]}`}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {component.name}
          {!component.visible ? (
            <span className="text-muted-foreground ml-2 inline-flex items-center gap-1 text-xs">
              <EyeOffIcon className="size-3" />
              hidden
            </span>
          ) : null}
        </p>
        {component.description ? (
          <p className="text-muted-foreground truncate text-xs">
            {component.description}
          </p>
        ) : null}
      </div>

      <Select
        value={component.groupId ?? 'none'}
        onValueChange={(value) =>
          save({ groupId: value === 'none' ? null : value })
        }
      >
        <SelectTrigger className="w-40" disabled={pending}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No section</SelectItem>
          {groups.map((group) => (
            <SelectItem key={group.id} value={group.id}>
              {group.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={component.status}
        onValueChange={(value) => save({ status: value })}
      >
        <SelectTrigger className="w-40" disabled={pending}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        size="sm"
        variant="ghost"
        disabled={pending}
        onClick={() => save({ visible: !component.visible })}
      >
        {component.visible ? 'Hide' : 'Show'}
      </Button>

      <Button
        size="sm"
        variant={confirming ? 'destructive' : 'ghost'}
        disabled={pending}
        onClick={() => {
          if (!confirming) {
            setConfirming(true);
            return;
          }
          start(async () => {
            const result = await deleteComponent(component.id);
            if (result.error) toast.error(result.error);
            else toast.success(result.message ?? 'Removed.');
            setConfirming(false);
          });
        }}
      >
        <Trash2Icon className="size-3.5" />
        {confirming ? 'Confirm' : ''}
      </Button>
    </div>
  );
}
