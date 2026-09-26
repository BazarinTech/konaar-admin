'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { SaveIcon } from 'lucide-react';
import { updatePlan } from '../actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { count } from '@/lib/format';
import type { Plan } from '../types';

/**
 * Editing a plan in place.
 *
 * Only what changed is sent. A plan is read by every pricing page and every
 * renewal, so sending the whole object back would overwrite a field another
 * administrator edited while this form sat open.
 */
export function PlanEditor({ plan }: { plan: Plan }) {
  const [name, setName] = useState(plan.name);
  const [price, setPrice] = useState(String(plan.priceCents / 100));
  const [ai, setAi] = useState(String(plan.monthlyAiCredits));
  const [cloud, setCloud] = useState(String(plan.monthlyCloudCredits));
  const [features, setFeatures] = useState(plan.features.join('\n'));
  const [isPublic, setIsPublic] = useState(plan.isPublic);
  const [pending, start] = useTransition();

  const patch = () => {
    const next: Record<string, unknown> = {};
    if (name !== plan.name) next.name = name;
    const cents = Math.round(Number(price) * 100);
    if (Number.isFinite(cents) && cents !== plan.priceCents) {
      next.priceCents = cents;
    }
    if (Number(ai) !== plan.monthlyAiCredits) next.monthlyAiCredits = Number(ai);
    if (Number(cloud) !== plan.monthlyCloudCredits) {
      next.monthlyCloudCredits = Number(cloud);
    }
    const list = features
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    if (list.join('\n') !== plan.features.join('\n')) next.features = list;
    if (isPublic !== plan.isPublic) next.isPublic = isPublic;
    return next;
  };

  const dirty = Object.keys(patch()).length > 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Name">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Price (USD)">
          <Input
            type="number"
            min={0}
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="tabular"
          />
        </Field>
        <Field label="AI credits / month">
          <Input
            type="number"
            min={0}
            value={ai}
            onChange={(e) => setAi(e.target.value)}
            className="tabular"
          />
        </Field>
        <Field label="Cloud credits / month">
          <Input
            type="number"
            min={0}
            value={cloud}
            onChange={(e) => setCloud(e.target.value)}
            className="tabular"
          />
        </Field>
      </div>

      <Field label="Features, one per line">
        <textarea
          value={features}
          onChange={(e) => setFeatures(e.target.value)}
          rows={4}
          className="border-input focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
        />
      </Field>

      <div className="flex items-center justify-between gap-3">
        <Label className="text-xs font-normal">
          <Switch checked={isPublic} onCheckedChange={setIsPublic} />
          Show on the pricing page
        </Label>
        <span className="text-muted-foreground text-xs">
          {count(plan.workspaces)} workspaces on this plan
        </span>
      </div>

      <Button
        size="sm"
        disabled={!dirty || pending}
        onClick={() =>
          start(async () => {
            const result = await updatePlan(plan.code, patch());
            if (result.error) toast.error(result.error);
            else toast.success(result.message ?? 'Saved.');
          })
        }
      >
        <SaveIcon />
        {dirty ? 'Save changes' : 'No changes'}
      </Button>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-muted-foreground text-xs">{label}</span>
      {children}
    </div>
  );
}
