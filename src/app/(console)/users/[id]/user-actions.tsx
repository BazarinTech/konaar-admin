'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { BanIcon, CoinsIcon, LogOutIcon, UndoIcon } from 'lucide-react';
import {
  banUser,
  grantCredits,
  revokeSessions,
  unbanUser,
  type ActionResult,
} from '../actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

/**
 * The four things support does to an account.
 *
 * Each one is confirmed, and the destructive ones ask for a reason rather than
 * offering a free-text box as an afterthought: the reason is what the next
 * administrator reads when they wonder why this account is locked.
 */
export function UserActions({
  userId,
  banned,
  workspaces,
}: {
  userId: string;
  banned: boolean;
  workspaces: { id: string; name: string }[];
}) {
  const [pending, start] = useTransition();
  const [banOpen, setBanOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [creditsOpen, setCreditsOpen] = useState(false);
  const [workspaceId, setWorkspaceId] = useState(workspaces[0]?.id ?? '');
  const [kind, setKind] = useState<'ai' | 'cloud'>('ai');
  const [credits, setCredits] = useState('100');
  const [creditReason, setCreditReason] = useState('');

  const report = (result: ActionResult, onOk?: () => void) => {
    if (result.error) toast.error(result.error);
    else {
      toast.success(result.message ?? 'Done.');
      onOk?.();
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() =>
          start(async () => report(await revokeSessions(userId)))
        }
      >
        <LogOutIcon />
        Sign out everywhere
      </Button>

      <Dialog open={creditsOpen} onOpenChange={setCreditsOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={workspaces.length === 0}
          >
            <CoinsIcon />
            Add credits
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add credits</DialogTitle>
            <DialogDescription>
              Recorded as an adjustment, not a payment — it will not appear as
              revenue.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <Label>Workspace</Label>
              <Select value={workspaceId} onValueChange={setWorkspaceId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a workspace" />
                </SelectTrigger>
                <SelectContent>
                  {workspaces.map((workspace) => (
                    <SelectItem key={workspace.id} value={workspace.id}>
                      {workspace.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label>Ledger</Label>
                <Select
                  value={kind}
                  onValueChange={(value) => setKind(value as 'ai' | 'cloud')}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ai">AI</SelectItem>
                    <SelectItem value="cloud">Cloud</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="credits">Credits</Label>
                <Input
                  id="credits"
                  type="number"
                  min={1}
                  value={credits}
                  onChange={(event) => setCredits(event.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="credit-reason">Reason</Label>
              <Input
                id="credit-reason"
                value={creditReason}
                onChange={(event) => setCreditReason(event.target.value)}
                placeholder="Goodwill after the failed build on Tuesday"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setCreditsOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button
              disabled={pending}
              onClick={() =>
                start(async () =>
                  report(
                    await grantCredits(userId, {
                      workspaceId,
                      kind,
                      credits: Number(credits),
                      reason: creditReason,
                    }),
                    () => {
                      setCreditsOpen(false);
                      setCreditReason('');
                    },
                  ),
                )
              }
            >
              Add credits
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {banned ? (
        <Button
          variant="secondary"
          size="sm"
          disabled={pending}
          onClick={() => start(async () => report(await unbanUser(userId)))}
        >
          <UndoIcon />
          Lift the ban
        </Button>
      ) : (
        <Dialog open={banOpen} onOpenChange={setBanOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive" size="sm">
              <BanIcon />
              Ban
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ban this account</DialogTitle>
              <DialogDescription>
                Sign-in is refused and every session is closed immediately. Their
                projects, data and ledger are kept, and the ban can be lifted.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2">
              <Label htmlFor="reason">Why</Label>
              <Input
                id="reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Abuse report #4821 — mining on the free plan"
                autoFocus
              />
              <p className="text-muted-foreground text-xs">
                Recorded against your name. The account is never shown this.
              </p>
            </div>
            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setBanOpen(false)}
                disabled={pending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={pending}
                onClick={() =>
                  start(async () =>
                    report(await banUser(userId, reason), () => {
                      setBanOpen(false);
                      setReason('');
                    }),
                  )
                }
              >
                Ban the account
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
