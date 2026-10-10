'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { MegaphoneIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { openIncident } from './actions';
import type { StatusComponentRecord } from './page';

const IMPACTS = [
  { value: 'minor', label: 'Minor — degraded, still usable' },
  { value: 'major', label: 'Major — a part of it is down' },
  { value: 'critical', label: 'Critical — it is down' },
  { value: 'maintenance', label: 'Maintenance — planned, announced' },
];

/**
 * Declaring an incident.
 *
 * The first update is part of the form, not a second step. An incident on
 * the page with no words under it tells a customer something is wrong and
 * nothing about what, which is worse than taking the extra minute.
 */
export function IncidentForm({
  components,
}: {
  components: StatusComponentRecord[];
}) {
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState('');
  const [impact, setImpact] = React.useState('major');
  const [body, setBody] = React.useState('');
  const [picked, setPicked] = React.useState<string[]>([]);
  const [pending, start] = React.useTransition();

  const ready = title.trim().length >= 4 && body.trim().length >= 5 && picked.length > 0;

  function post() {
    if (!ready) return;
    start(async () => {
      const result = await openIncident({
        title: title.trim(),
        impact,
        status: 'investigating',
        componentIds: picked,
        body: body.trim(),
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message ?? 'Posted.');
      setOpen(false);
      setTitle('');
      setBody('');
      setPicked([]);
    });
  }

  if (!open) {
    return (
      <Button
        variant="outline"
        className="self-start"
        disabled={components.length === 0}
        onClick={() => setOpen(true)}
      >
        <MegaphoneIcon className="size-4" />
        {components.length === 0 ? 'Add a service first' : 'Declare an incident'}
      </Button>
    );
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 py-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="incident-title">What is happening?</Label>
          <Input
            id="incident-title"
            value={title}
            maxLength={140}
            placeholder="Elevated error rates on the API"
            onChange={(event) => setTitle(event.target.value)}
          />
          <p className="text-muted-foreground text-xs">
            Customers read this first. Say what they will notice, not what
            broke internally.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>How bad</Label>
          <Select value={impact} onValueChange={setImpact}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {IMPACTS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-muted-foreground text-xs">
            This sets the services below to match, and decides how the day
            counts against their uptime. Maintenance is drawn but not charged.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>What it affects</Label>
          <div className="flex flex-wrap gap-1.5">
            {components.map((component) => {
              const on = picked.includes(component.id);
              return (
                <button
                  key={component.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() =>
                    setPicked((current) =>
                      on
                        ? current.filter((id) => id !== component.id)
                        : [...current, component.id],
                    )
                  }
                  className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${
                    on
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {component.name}
                </button>
              );
            })}
          </div>
          {picked.length === 0 ? (
            <p className="text-muted-foreground text-xs">
              Pick at least one — an incident attached to nothing moves no
              bars and warns nobody.
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="incident-body">First update</Label>
          <Textarea
            id="incident-body"
            value={body}
            rows={3}
            maxLength={2000}
            placeholder="We are seeing elevated error rates and are looking into it."
            onChange={(event) => setBody(event.target.value)}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" disabled={pending} onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button disabled={pending || !ready} onClick={post}>
            {pending ? 'Posting…' : 'Post it'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
