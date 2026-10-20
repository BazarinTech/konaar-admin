'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { PencilIcon, PlusIcon } from 'lucide-react';
import { saveDiscount } from '../pricing-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import type { Discount, Scope } from '../pricing-types';
import type { Plan } from '../types';

/**
 * Creating or changing a discount. One form for both, so an edit can never
 * offer fewer choices than the create did.
 */
export function DiscountDialog({
  plans,
  discount,
}: {
  plans: Plan[];
  discount?: Discount;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(discount?.name ?? '');
  const [automatic, setAutomatic] = useState(discount ? discount.code === null : false);
  const [code, setCode] = useState(discount?.code ?? '');
  const [kind, setKind] = useState<'percent' | 'fixed'>(discount?.kind ?? 'percent');
  const [percent, setPercent] = useState(String(discount?.percentOff ?? 20));
  const [amount, setAmount] = useState(
    discount?.amountOffCents ? String(discount.amountOffCents / 100) : '',
  );
  const [planCodes, setPlanCodes] = useState<string[]>(discount?.planCodes ?? []);
  const [scope, setScope] = useState<Scope>(discount?.billingInterval ?? 'any');
  const [startsAt, setStartsAt] = useState(dateInput(discount?.startsAt ?? null));
  const [endsAt, setEndsAt] = useState(dateInput(discount?.endsAt ?? null));
  const [maxUses, setMaxUses] = useState(
    discount?.maxRedemptions ? String(discount.maxRedemptions) : '',
  );
  const [cycles, setCycles] = useState(
    discount?.durationCycles ? String(discount.durationCycles) : '',
  );
  const [pending, start] = useTransition();

  const submit = () =>
    start(async () => {
      const result = await saveDiscount(discount?.id ?? null, {
        name: name.trim(),
        code: automatic ? null : code.trim() || null,
        kind,
        percentOff: kind === 'percent' ? Number(percent) : null,
        amountOffCents: kind === 'fixed' ? Math.round(Number(amount) * 100) : null,
        planCodes,
        billingInterval: scope,
        startsAt: isoFrom(startsAt, 'start'),
        endsAt: isoFrom(endsAt, 'end'),
        maxRedemptions: wholeOrNull(maxUses),
        durationCycles: wholeOrNull(cycles),
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
        {discount ? (
          <Button variant="ghost" size="icon" aria-label={`Edit ${discount.name}`}>
            <PencilIcon />
          </Button>
        ) : (
          <Button size="sm">
            <PlusIcon />
            New discount
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90svh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{discount ? `Edit ${discount.name}` : 'New discount'}</DialogTitle>
          <DialogDescription>
            A code is typed at checkout. An automatic discount applies by itself to
            every matching subscription while it runs — a sale.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <Field label="Name" hint="Shown to the customer next to the price.">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Launch week" />
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="How it applies">
              <Select
                value={automatic ? 'auto' : 'code'}
                onValueChange={(v) => setAutomatic(v === 'auto')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="code">With a code</SelectItem>
                  <SelectItem value="auto">Automatically (a sale)</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            {automatic ? null : (
              <Field label="Code" hint="Letters, digits, dashes. Not case-sensitive.">
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="WELCOME50"
                  className="font-mono"
                />
              </Field>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Discount">
              <Select value={kind} onValueChange={(v) => setKind(v as 'percent' | 'fixed')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">Percentage off</SelectItem>
                  <SelectItem value="fixed">Fixed amount off</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            {kind === 'percent' ? (
              <Field label="Percent off">
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={percent}
                  onChange={(e) => setPercent(e.target.value)}
                  className="tabular"
                />
              </Field>
            ) : (
              <Field label="Amount off (USD)" hint="Per billing period.">
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="tabular"
                />
              </Field>
            )}
          </div>

          <PlanPicker plans={plans} value={planCodes} onChange={setPlanCodes} />
          <ScopeSelect value={scope} onChange={setScope} />
          <WindowFields
            startsAt={startsAt}
            endsAt={endsAt}
            onStartsAt={setStartsAt}
            onEndsAt={setEndsAt}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Total uses" hint="Empty is unlimited. One per workspace either way.">
              <Input
                type="number"
                min={1}
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                placeholder="Unlimited"
                className="tabular"
              />
            </Field>
            <Field label="Lasts for (billing periods)" hint="Empty lasts as long as they stay.">
              <Input
                type="number"
                min={1}
                value={cycles}
                onChange={(e) => setCycles(e.target.value)}
                placeholder="Forever"
                className="tabular"
              />
            </Field>
          </div>
        </div>

        <DialogFooter>
          <Button disabled={pending || name.trim().length < 2} onClick={submit}>
            {pending ? 'Saving…' : discount ? 'Save changes' : 'Create discount'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
