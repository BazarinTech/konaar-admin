'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { PencilIcon, PlusIcon } from 'lucide-react';
import { saveOffer } from '../pricing-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Field,
  PlanPicker,
  ScopeSelect,
  WindowFields,
  dateInput,
  isoFrom,
  wholeOrNull,
} from '../rule-fields';
import { PERK_LABEL, type Offer, type Perk, type Scope } from '../pricing-types';
import type { Plan } from '../types';

/** "Subscribe to Pro, get…" — creating or changing one. */
export function OfferDialog({ plans, offer }: { plans: Plan[]; offer?: Offer }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(offer?.name ?? '');
  const [description, setDescription] = useState(offer?.description ?? '');
  const [perk, setPerk] = useState<Perk>(offer?.perk ?? 'free_domain');
  // A free domain is set in dollars (the most a covered name may cost);
  // credits are a count.
  const [value, setValue] = useState(
    offer
      ? String(offer.perk === 'free_domain' ? offer.perkValue / 100 : offer.perkValue)
      : '15',
  );
  const [claimDays, setClaimDays] = useState(offer?.claimDays ? String(offer.claimDays) : '');
  const [planCodes, setPlanCodes] = useState<string[]>(offer?.planCodes ?? []);
  const [scope, setScope] = useState<Scope>(offer?.billingInterval ?? 'any');
  const [startsAt, setStartsAt] = useState(dateInput(offer?.startsAt ?? null));
  const [endsAt, setEndsAt] = useState(dateInput(offer?.endsAt ?? null));
  const [pending, start] = useTransition();

  const submit = () =>
    start(async () => {
      const amount = Number(value);
      const result = await saveOffer(offer?.id ?? null, {
        name: name.trim(),
        description: description.trim(),
        perk,
        perkValue: perk === 'free_domain' ? Math.round(amount * 100) : Math.round(amount),
        claimDays: perk === 'free_domain' ? wholeOrNull(claimDays) : null,
        planCodes,
        billingInterval: scope,
        startsAt: isoFrom(startsAt, 'start'),
        endsAt: isoFrom(endsAt, 'end'),
      });
      if (result.error) toast.error(result.error);
      else {
        toast.success(result.message ?? 'Saved.');
        setOpen(false);
      }
    });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {offer ? (
          <Button variant="ghost" size="icon" aria-label={`Edit ${offer.name}`}>
            <PencilIcon />
          </Button>
        ) : (
          <Button size="sm">
            <PlusIcon />
            New offer
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90svh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{offer ? `Edit ${offer.name}` : 'New offer'}</DialogTitle>
          <DialogDescription>
            Something extra with a plan. Each workspace gets it once, the first
            time it subscribes to a matching plan while the offer runs.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <Field label="Name" hint="Shown on the pricing card.">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Free domain with Pro"
            />
          </Field>
          <Field label="Description">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Your first year of any .com is on us."
            />
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="What they get">
              <Select value={perk} onValueChange={(v) => setPerk(v as Perk)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(PERK_LABEL) as Perk[]).map((p) => (
                    <SelectItem key={p} value={p}>
                      {PERK_LABEL[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field
              label={perk === 'free_domain' ? 'Covers names up to (USD)' : 'Credits'}
              hint={
                perk === 'free_domain'
                  ? 'First year free for any name at or below this price.'
                  : 'Added to the workspace when they subscribe.'
              }
            >
              <Input
                type="number"
                min={0}
                step={perk === 'free_domain' ? '0.01' : '1'}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="tabular"
              />
            </Field>
          </div>
          {perk === 'free_domain' ? (
            <Field label="Claim within (days)" hint="Empty keeps it until used.">
              <Input
                type="number"
                min={1}
                value={claimDays}
                onChange={(e) => setClaimDays(e.target.value)}
                placeholder="No limit"
                className="tabular"
              />
            </Field>
          ) : null}

          <PlanPicker plans={plans} value={planCodes} onChange={setPlanCodes} />
          <ScopeSelect value={scope} onChange={setScope} />
          <WindowFields
            startsAt={startsAt}
            endsAt={endsAt}
            onStartsAt={setStartsAt}
            onEndsAt={setEndsAt}
          />
        </div>

        <DialogFooter>
          <Button disabled={pending || name.trim().length < 2 || !(Number(value) > 0)} onClick={submit}>
            {pending ? 'Saving…' : offer ? 'Save changes' : 'Create offer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
