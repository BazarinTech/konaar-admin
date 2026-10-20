'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import {
  CalendarClockIcon,
  PauseIcon,
  PencilIcon,
  PlayIcon,
  PlusIcon,
  Trash2Icon,
} from 'lucide-react';
import {
  createRecurring,
  removeRecurring,
  setRecurringStatus,
  updateRecurring,
  type ActionResult,
} from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import { cn } from '@/lib/utils';
import { date, money } from '@/lib/format';
import type { Frequency, RecurringSchedule } from './types';

const CATEGORIES = [
  { value: 'infrastructure', label: 'Infrastructure' },
  { value: 'payroll', label: 'Payroll' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'model_spend', label: 'Model spend (outside the platform)' },
  { value: 'refund', label: 'Refund' },
  { value: 'other', label: 'Other' },
];

const FREQUENCIES: { value: Frequency; label: string }[] = [
  { value: 'monthly', label: 'Every month' },
  { value: 'quarterly', label: 'Every three months' },
  { value: 'yearly', label: 'Once a year' },
  { value: 'months', label: 'In chosen months' },
  { value: 'once', label: 'Once, on a date' },
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Money the ledger knows is coming.
 *
 * The list is the schedule, not the postings: what it owes, when it next
 * lands, and how many lines it has produced so far. The lines themselves are
 * in the ledger with everything else, which is where someone looking at a
 * month's costs will actually be.
 */
export function Recurring({ schedules }: { schedules: RecurringSchedule[] }) {
  const [pending, start] = useTransition();

  return (
    <div className="flex flex-col gap-3">
      {schedules.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Nothing is scheduled. A server bill, a salary, a yearly domain renewal
          or a bill you know is coming posts itself to the ledger on its date.
        </p>
      ) : (
        <ul className="flex flex-col divide-y">
          {schedules.map((schedule) => (
            <li
              key={schedule.id}
              className="flex flex-wrap items-start justify-between gap-3 py-3 first:pt-0"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="tabular text-sm font-medium">
                    {schedule.kind === 'income' ? '+' : '−'}
                    {money(schedule.amount)}
                  </span>
                  <Badge variant="outline">{schedule.category}</Badge>
                  {schedule.status === 'paused' ? (
                    <Badge variant="warning">paused</Badge>
                  ) : null}
                </div>
                <p className="mt-1 text-sm">{schedule.description}</p>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  {capitalize(schedule.when)}
                  {schedule.nextDue ? ` · next ${date(schedule.nextDue)}` : ''}
                  {schedule.postedCount
                    ? ` · ${schedule.postedCount} posted, last ${date(schedule.lastPostedFor)}`
                    : ' · nothing posted yet'}
                  {schedule.endsOn ? ` · ends ${date(schedule.endsOn)}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <ScheduleDialog schedule={schedule} />
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={pending}
                  title={schedule.status === 'active' ? 'Pause' : 'Resume'}
                  onClick={() =>
                    start(async () =>
                      report(
                        await setRecurringStatus(
                          schedule.id,
                          schedule.status === 'active' ? 'paused' : 'active',
                        ),
                      ),
                    )
                  }
                >
                  {schedule.status === 'active' ? (
                    <PauseIcon className="size-4" />
                  ) : (
                    <PlayIcon className="size-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={pending}
                  title="End this schedule"
                  onClick={() =>
                    start(async () => report(await removeRecurring(schedule.id)))
                  }
                >
                  <Trash2Icon className="text-muted-foreground size-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ScheduleDialog />
    </div>
  );
}

function report(result: ActionResult, onOk?: () => void) {
  if (result.error) toast.error(result.error);
  else {
    toast.success(result.message ?? 'Done.');
    onOk?.();
  }
}

/**
 * Scheduling something new, or changing one that exists. An edit cannot move
 * the start or the direction: those describe lines already in the ledger.
 */
function ScheduleDialog({ schedule }: { schedule?: RecurringSchedule }) {
  const editing = Boolean(schedule);
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<'income' | 'expense'>(schedule?.kind ?? 'expense');
  const [category, setCategory] = useState(schedule?.category ?? 'infrastructure');
  const [amount, setAmount] = useState(schedule ? String(schedule.amount) : '');
  const [description, setDescription] = useState(schedule?.description ?? '');
  const [frequency, setFrequency] = useState<Frequency>(schedule?.frequency ?? 'monthly');
  const [months, setMonths] = useState<number[]>(schedule?.months ?? []);
  const [dayOfMonth, setDayOfMonth] = useState(String(schedule?.dayOfMonth ?? 1));
  const [startsOn, setStartsOn] = useState(schedule?.startsOn?.slice(0, 10) ?? '');
  const [endsOn, setEndsOn] = useState(schedule?.endsOn?.slice(0, 10) ?? '');
  const [pending, start] = useTransition();

  const once = frequency === 'once';
  const submit = () =>
    start(async () => {
      if (frequency === 'months' && months.length === 0) {
        toast.error('Pick at least one month.');
        return;
      }
      if (once && !startsOn && !editing) {
        toast.error('Pick the date it is due.');
        return;
      }
      const result = schedule
        ? await updateRecurring(schedule.id, {
            category,
            amount: Number(amount),
            description: description.trim(),
            frequency,
            months: frequency === 'months' ? months : undefined,
            dayOfMonth: Number(dayOfMonth),
            endsOn: endsOn || null,
          })
        : await createRecurring({
            kind,
            category,
            amount: Number(amount),
            description,
            dayOfMonth: Number(dayOfMonth),
            frequency,
            months: frequency === 'months' ? months : undefined,
            startsOn: startsOn || undefined,
            endsOn: once ? undefined : endsOn || undefined,
          });
      report(result, () => {
        setOpen(false);
        if (!editing) {
          setAmount('');
          setDescription('');
          setEndsOn('');
          setMonths([]);
        }
      });
    });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {schedule ? (
          <Button variant="ghost" size="icon" title="Edit">
            <PencilIcon className="size-4" />
          </Button>
        ) : (
          <Button size="sm" variant="outline" className="self-start">
            <PlusIcon />
            Schedule an amount
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90svh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? 'Change this schedule' : 'Posts itself to the ledger'}</DialogTitle>
          <DialogDescription>
            {editing
              ? 'Changes apply from the next posting. Lines already in the ledger keep the amount they were posted at.'
              : 'Entered once, posted on every date it is due without anyone typing it again. Anything already due since the start is posted straight away.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            {editing ? null : (
              <div className="flex flex-col gap-1.5">
                <Label>Direction</Label>
                <Select value={kind} onValueChange={(v) => setKind(v as 'income' | 'expense')}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">Money out</SelectItem>
                    <SelectItem value="income">Money in</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="recurring-amount">Amount (USD)</Label>
              <Input
                id="recurring-amount"
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="120.00"
                className="tabular"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>How often</Label>
              <Select value={frequency} onValueChange={(v) => setFrequency(v as Frequency)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCIES.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {frequency === 'months' ? (
            <div className="flex flex-col gap-1.5">
              <Label>Months</Label>
              <div className="grid grid-cols-6 gap-1.5">
                {MONTHS.map((label, i) => {
                  const m = i + 1;
                  const on = months.includes(m);
                  return (
                    <button
                      key={label}
                      type="button"
                      aria-pressed={on}
                      onClick={() =>
                        setMonths(on ? months.filter((x) => x !== m) : [...months, m])
                      }
                      className={cn(
                        'rounded-md border py-1 text-xs transition-colors',
                        on
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            {once ? null : (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="recurring-day">Day of the month</Label>
                <Input
                  id="recurring-day"
                  type="number"
                  min={1}
                  max={31}
                  value={dayOfMonth}
                  onChange={(event) => setDayOfMonth(event.target.value)}
                  className="tabular"
                />
                <p className="text-muted-foreground text-xs">
                  31 means the last day, so February is not skipped.
                </p>
              </div>
            )}
            {editing ? null : (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="recurring-start">{once ? 'Due on' : 'Starting'}</Label>
                <Input
                  id="recurring-start"
                  type="date"
                  value={startsOn}
                  onChange={(event) => setStartsOn(event.target.value)}
                />
                {frequency === 'yearly' || frequency === 'quarterly' ? (
                  <p className="text-muted-foreground text-xs">
                    {frequency === 'yearly'
                      ? 'It posts in this month every year.'
                      : 'Every third month counts from this one.'}
                  </p>
                ) : null}
              </div>
            )}
            {once ? null : (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="recurring-end">Last date (optional)</Label>
                <Input
                  id="recurring-end"
                  type="date"
                  value={endsOn}
                  onChange={(event) => setEndsOn(event.target.value)}
                />
              </div>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="recurring-description">Description</Label>
            <Input
              id="recurring-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Hetzner dedicated server"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
            Cancel
          </Button>
          <Button disabled={pending} onClick={submit}>
            <CalendarClockIcon />
            {editing ? 'Save changes' : 'Schedule it'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
