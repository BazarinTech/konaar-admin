'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { PlusIcon } from 'lucide-react';
import { createPlan } from '../actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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

const CADENCES = ['forever', 'per month', 'per year', 'per user / month'];

/** An empty ceiling is unlimited, which the API stores as `null`. */
function ceiling(text: string): number | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.trunc(parsed) : null;
}

/** `Scale plan` → `scale-plan`, which is what the code has to look like. */
function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 31);
}

export function NewPlan() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [codeTouched, setCodeTouched] = useState(false);
  const [price, setPrice] = useState('0');
  const [cadence, setCadence] = useState('per month');
  const [ai, setAi] = useState('0');
  const [cloud, setCloud] = useState('0');
  const [features, setFeatures] = useState('');
  const [projects, setProjects] = useState('');
  const [services, setServices] = useState('');
  const [spaces, setSpaces] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [pending, start] = useTransition();

  // The code follows the name until someone edits it themselves — after that it
  // is theirs, because it is the one field they can never correct later.
  const effectiveCode = codeTouched ? code : slug(name);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <PlusIcon />
          New plan
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New plan</DialogTitle>
          <DialogDescription>
            New plans start hidden. Put it in front of customers once the
            numbers are right.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="plan-name">Name</Label>
              <Input
                id="plan-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Scale"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="plan-code">Code</Label>
              <Input
                id="plan-code"
                value={effectiveCode}
                onChange={(event) => {
                  setCodeTouched(true);
                  setCode(slug(event.target.value));
                }}
                placeholder="scale"
                className="font-mono"
              />
              <p className="text-muted-foreground text-xs">
                Permanent. Workspaces reference it.
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="plan-price">Price (USD)</Label>
              <Input
                id="plan-price"
                type="number"
                min={0}
                step="0.01"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                className="tabular"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Billed</Label>
              <Select value={cadence} onValueChange={setCadence}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CADENCES.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="plan-ai">AI credits / month</Label>
              <Input
                id="plan-ai"
                type="number"
                min={0}
                value={ai}
                onChange={(event) => setAi(event.target.value)}
                className="tabular"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="plan-cloud">Cloud credits / month</Label>
              <Input
                id="plan-cloud"
                type="number"
                min={0}
                value={cloud}
                onChange={(event) => setCloud(event.target.value)}
                className="tabular"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="plan-projects">Projects</Label>
              <Input
                id="plan-projects"
                type="number"
                min={0}
                value={projects}
                onChange={(event) => setProjects(event.target.value)}
                placeholder="Unlimited"
                className="tabular"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="plan-services">Services</Label>
              <Input
                id="plan-services"
                type="number"
                min={0}
                value={services}
                onChange={(event) => setServices(event.target.value)}
                placeholder="Unlimited"
                className="tabular"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="plan-workspaces">Workspaces</Label>
              <Input
                id="plan-workspaces"
                type="number"
                min={0}
                value={spaces}
                onChange={(event) => setSpaces(event.target.value)}
                placeholder="Unlimited"
                className="tabular"
              />
            </div>
          </div>
          <p className="text-muted-foreground -mt-1 text-xs">
            Empty means unlimited. Projects count the builder and the cloud
            console together; workspaces are per owner.
          </p>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="plan-features">Features, one per line</Label>
            <textarea
              id="plan-features"
              rows={4}
              value={features}
              onChange={(event) => setFeatures(event.target.value)}
              placeholder={'Everything in Team\nDedicated compute\nPriority support'}
              className="border-input focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
            />
          </div>

          <Label className="text-sm font-normal">
            <Switch checked={isPublic} onCheckedChange={setIsPublic} />
            Show on the pricing page straight away
          </Label>
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
            disabled={pending || !name.trim() || !effectiveCode}
            onClick={() =>
              start(async () => {
                const result = await createPlan({
                  code: effectiveCode,
                  name,
                  priceCents: Math.round(Number(price) * 100),
                  cadence,
                  monthlyAiCredits: Number(ai),
                  monthlyCloudCredits: Number(cloud),
                  features: features
                    .split('\n')
                    .map((line) => line.trim())
                    .filter(Boolean),
                  isPublic,
                  maxProjects: ceiling(projects),
                  maxServices: ceiling(services),
                  maxWorkspaces: ceiling(spaces),
                });
                if (result.error) toast.error(result.error);
                else {
                  toast.success(result.message ?? 'Created.');
                  setOpen(false);
                  setName('');
                  setCode('');
                  setCodeTouched(false);
                  setFeatures('');
                }
              })
            }
          >
            Create plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
