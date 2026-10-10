'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Trash2Icon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ago } from '@/lib/format';
import { deleteIncident, postUpdate } from './actions';
import type { IncidentRecord } from './page';

const NEXT = [
  { value: 'investigating', label: 'Investigating' },
  { value: 'identified', label: 'Identified' },
  { value: 'monitoring', label: 'Monitoring' },
  { value: 'resolved', label: 'Resolved' },
];

/**
 * One incident, with the only thing anybody does to it: post an update.
 *
 * Updates are append-only, so there is no edit here and no way to add one.
 * The timeline is the record of what was said and when, and being able to
 * rewrite yesterday's note is how it stops being evidence.
 */
export function IncidentCard({ incident }: { incident: IncidentRecord }) {
  const resolved = incident.resolvedAt !== null;
  const [posting, setPosting] = React.useState(false);
  const [status, setStatus] = React.useState(
    resolved ? 'monitoring' : 'identified',
  );
  const [body, setBody] = React.useState('');
  const [confirming, setConfirming] = React.useState(false);
  const [pending, start] = React.useTransition();

  function send() {
    if (body.trim().length < 5) return;
    start(async () => {
      const result = await postUpdate(incident.id, status, body.trim());
      if (result.error) toast.error(result.error);
      else {
        toast.success(result.message ?? 'Posted.');
        setBody('');
        setPosting(false);
      }
    });
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-2 font-medium">
              {incident.title}
              <Badge variant={resolved ? 'secondary' : 'default'}>
                {incident.status}
              </Badge>
              <Badge variant="secondary">{incident.impact}</Badge>
            </p>
            <p className="text-muted-foreground pt-1 text-xs">
              started {ago(incident.startedAt)}
              {incident.components.length > 0
                ? ` · ${incident.components.join(', ')}`
                : ''}
              {resolved ? ` · resolved ${ago(incident.resolvedAt!)}` : ''}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!posting ? (
              <Button
                size="sm"
                variant={resolved ? 'outline' : 'default'}
                disabled={pending}
                onClick={() => setPosting(true)}
              >
                Post update
              </Button>
            ) : null}
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
                  const result = await deleteIncident(incident.id);
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
        </div>

        {posting ? (
          <div className="flex flex-col gap-2 border-t pt-3">
            <div className="flex flex-wrap gap-2">
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NEXT.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {status === 'resolved' ? (
                <p className="text-muted-foreground self-center text-xs">
                  This also sets the services back, unless another open
                  incident still names them.
                </p>
              ) : null}
            </div>
            <Textarea
              value={body}
              rows={2}
              maxLength={2000}
              placeholder="What has changed since the last update?"
              onChange={(event) => setBody(event.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button
                size="sm"
                variant="ghost"
                disabled={pending}
                onClick={() => setPosting(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={pending || body.trim().length < 5}
                onClick={send}
              >
                {pending ? 'Posting…' : 'Post'}
              </Button>
            </div>
          </div>
        ) : null}

        {incident.updates.length > 0 ? (
          <ul className="flex flex-col gap-1.5 border-t pt-3">
            {incident.updates.map((update) => (
              <li key={update.id} className="text-xs">
                <span className="text-muted-foreground mr-2 font-mono text-[10px] tracking-wider uppercase">
                  {update.status}
                </span>
                {update.body}
                <span className="text-muted-foreground ml-2">
                  {ago(update.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  );
}
