'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { updateCase } from '../actions';
import { STATUS_LABEL, type Agent, type CaseDetail, type CaseStatus } from '../types';

const NOBODY = '__nobody__';

/** Status, severity and owner. Each change is logged on the case for the team. */
export function CaseControls({ c, agents }: { c: CaseDetail; agents: Agent[] }) {
  const [pending, start] = React.useTransition();
  const save = (patch: Parameters<typeof updateCase>[1]) =>
    start(async () => {
      const r = await updateCase(c.id, patch);
      if (r.error) toast.error(r.error);
      else toast.success(r.message ?? 'Saved.');
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Case</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Field label="Status">
          <Select value={c.status} disabled={pending} onValueChange={(v) => save({ status: v as CaseStatus })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(STATUS_LABEL) as CaseStatus[]).map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Severity">
          <Select value={String(c.severity)} disabled={pending} onValueChange={(v) => save({ severity: Number(v) })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4].map((s) => (
                <SelectItem key={s} value={String(s)}>
                  Severity {s}
                  {s === 1 ? ' — production down' : s === 2 ? ' — impaired' : s === 3 ? ' — non-production' : ' — question'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Assigned to">
          <Select
            value={c.assignedTo ?? NOBODY}
            disabled={pending}
            onValueChange={(v) => save({ assignedTo: v === NOBODY ? null : v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NOBODY}>Unassigned</SelectItem>
              {agents.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <p className="text-muted-foreground text-[11px]">
          The assignee is emailed when the customer replies. Answering an unassigned case takes it.
        </p>
      </CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-muted-foreground text-xs">{label}</span>
      {children}
    </div>
  );
}
