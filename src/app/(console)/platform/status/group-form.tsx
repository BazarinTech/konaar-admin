'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Trash2Icon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createGroup, deleteGroup } from './actions';
import type { StatusGroup } from './page';

/**
 * The headings on the public page.
 *
 * Removing one keeps its services, ungrouped — deleting somebody's services
 * as a side effect of tidying a heading is the kind of surprise an operator
 * finds out about from a customer.
 */
export function GroupForm({ groups }: { groups: StatusGroup[] }) {
  const [name, setName] = React.useState('');
  const [pending, start] = React.useTransition();

  function add() {
    if (name.trim().length === 0) return;
    start(async () => {
      const result = await createGroup(name.trim(), groups.length);
      if (result.error) toast.error(result.error);
      else {
        toast.success(result.message ?? 'Added.');
        setName('');
      }
    });
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 py-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="group-name">Sections</Label>
          <p className="text-muted-foreground text-xs">
            Applications, Platform, Providers — the headings services are
            listed under.
          </p>
        </div>

        {groups.length > 0 ? (
          <ul className="flex flex-col divide-y border-y">
            {groups.map((group) => (
              <li
                key={group.id}
                className="flex items-center justify-between py-2 text-sm"
              >
                {group.name}
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={pending}
                  onClick={() =>
                    start(async () => {
                      const result = await deleteGroup(group.id);
                      if (result.error) toast.error(result.error);
                      else toast.success(result.message ?? 'Removed.');
                    })
                  }
                >
                  <Trash2Icon className="size-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="flex gap-2">
          <Input
            id="group-name"
            value={name}
            placeholder="Applications"
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') add();
            }}
          />
          <Button disabled={pending || name.trim().length === 0} onClick={add}>
            Add
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
