'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import {
  CalendarClockIcon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  Trash2Icon,
} from 'lucide-react';
import {
  createRecurring,
  removeRecurring,
  setRecurringStatus,
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
import { date, money } from '@/lib/format';
import type { RecurringSchedule } from './types';

const CATEGORIES = [
  { value: 'infrastructure', label: 'Infrastructure' },
  { value: 'payroll', label: 'Payroll' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'model_spend', label: 'Model spend (outside the platform)' },
  { value: 'refund', label: 'Refund' },
  { value: 'other', label: 'Other' },
];

/** "1st", "2nd", "21st" — a day of the month, written the way people say it. */
function ordinal(day: number): string {
  const suffix =
    day % 10 === 1 && day !== 11
      ? 'st'
      : day % 10 === 2 && day !== 12
        ? 'nd'
        : day % 10 === 3 && day !== 13
          ? 'rd'
          : 'th';
  return `${day}${suffix}`;
}

/**
 * Money that repeats every month.
 *
 * The list is the schedule, not the postings: what it owes, when it next
 * lands, and how many lines it has produced so far. The lines themselves are
 * in the ledger with everything else, which is where someone looking at a
 * month's costs will actually be.
 */
export function Recurring({ schedules }: { schedules: RecurringSchedule[] }) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<'income' | 'expense'>('expense');
  const [category, setCategory] = useState('infrastructure');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [dayOfMonth, setDayOfMonth] = useState('1');
  const [startsOn, setStartsOn] = useState('');
  const [endsOn, setEndsOn] = useState('');
  const [pending, start] = useTransition();

  const report = (result: ActionResult, onOk?: () => void) => {
    if (result.error) toast.error(result.error);
    else {
      toast.success(result.message ?? 'Done.');
      onOk?.();
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {schedules.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Nothing is scheduled. A server bill or a salary entered here posts
          itself every month, on the day you choose.
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
                  {ordinal(schedule.dayOfMonth)} of each month
                  {schedule.nextDue ? ` · next ${date(schedule.nextDue)}` : ''}
                  {schedule.postedCount
                    ? ` · ${schedule.postedCount} posted, last ${date(schedule.lastPostedFor)}`
                    : ' · nothing posted yet'}
                  {schedule.endsOn ? ` · ends ${date(schedule.endsOn)}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-1">
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline" className="self-start">
            <PlusIcon />
            Schedule a monthly amount
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Monthly, from now on</DialogTitle>
            <DialogDescription>
              Posted to the ledger on this day every month, without anyone
              typing it again. Anything already due since the start date is
              posted straight away.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label>Direction</Label>
                <Select
                  value={kind}
                  onValueChange={(value) =>
                    setKind(value as 'income' | 'expense')
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">Money out</SelectItem>
                    <SelectItem value="income">Money in</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="recurring-start">First month</Label>
                <Input
                  id="recurring-start"
                  type="date"
                  value={startsOn}
                  onChange={(event) => setStartsOn(event.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="recurring-end">Last month (optional)</Label>
                <Input
                  id="recurring-end"
                  type="date"
                  value={endsOn}
                  onChange={(event) => setEndsOn(event.target.value)}
                />
              </div>
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
            <Button
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button
              disabled={pending}
              onClick={() =>
                start(async () =>
                  report(
                    await createRecurring({
                      kind,
                      category,
                      amount: Number(amount),
                      description,
                      dayOfMonth: Number(dayOfMonth),
                      startsOn: startsOn || undefined,
                      endsOn: endsOn || undefined,
                    }),
                    () => {
                      setOpen(false);
                      setAmount('');
                      setDescription('');
                      setEndsOn('');
                    },
                  ),
                )
              }
            >
              <CalendarClockIcon />
              Schedule it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
