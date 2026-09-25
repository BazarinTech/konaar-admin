'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { PlusIcon } from 'lucide-react';
import { createEntry } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const CATEGORIES = [
  { value: 'infrastructure', label: 'Infrastructure' },
  { value: 'model_spend', label: 'Model spend (outside the platform)' },
  { value: 'refund', label: 'Refund' },
  { value: 'payroll', label: 'Payroll' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'other', label: 'Other' },
];

export function EntryForm() {
  const [kind, setKind] = useState<'income' | 'expense'>('expense');
  const [category, setCategory] = useState('infrastructure');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [occurredOn, setOccurredOn] = useState('');
  const [pending, start] = useTransition();

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>Direction</Label>
          <Select
            value={kind}
            onValueChange={(value) => setKind(value as 'income' | 'expense')}
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
          <Label htmlFor="amount">Amount (USD)</Label>
          <Input
            id="amount"
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className="tabular"
            placeholder="42.50"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="occurred">Date</Label>
          <Input
            id="occurred"
            type="date"
            value={occurredOn}
            onChange={(event) => setOccurredOn(event.target.value)}
          />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Hetzner invoice, September"
        />
      </div>
      <Button
        size="sm"
        className="self-start"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const result = await createEntry({
              kind,
              category,
              amount: Number(amount),
              description,
              occurredOn: occurredOn || undefined,
            });
            if (result.error) toast.error(result.error);
            else {
              toast.success(result.message ?? 'Recorded.');
              setAmount('');
              setDescription('');
            }
          })
        }
      >
        <PlusIcon />
        Record it
      </Button>
    </div>
  );
}
