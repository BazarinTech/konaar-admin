'use client';

import * as React from 'react';
import { toast } from 'sonner';

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
import { createComponent } from './actions';
import type { StatusGroup } from './page';

/** Adding something for customers to watch. It appears on the page at once. */
export function ComponentForm({ groups }: { groups: StatusGroup[] }) {
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [groupId, setGroupId] = React.useState('none');
  const [pending, start] = React.useTransition();

  function add() {
    if (name.trim().length === 0) return;
    start(async () => {
      const result = await createComponent({
        name: name.trim(),
        description: description.trim() || null,
        groupId: groupId === 'none' ? null : groupId,
        sortIndex: 0,
      });
      if (result.error) toast.error(result.error);
      else {
        toast.success(result.message ?? 'Added.');
        setName('');
        setDescription('');
      }
    });
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 py-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="component-name">Add a service</Label>
          <p className="text-muted-foreground text-xs">
            Name it the way a customer would — &ldquo;Builder&rdquo;, not
            &ldquo;agent-worker&rdquo;.
          </p>
        </div>

        <Input
          id="component-name"
          value={name}
          placeholder="Builder"
          onChange={(event) => setName(event.target.value)}
        />
        <Input
          value={description}
          placeholder="What it is, in a few words (optional)"
          onChange={(event) => setDescription(event.target.value)}
        />
        <Select value={groupId} onValueChange={setGroupId}>
          <SelectTrigger className="w-full">
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

        <Button disabled={pending || name.trim().length === 0} onClick={add}>
          {pending ? 'Adding…' : 'Add service'}
        </Button>
      </CardContent>
    </Card>
  );
}
