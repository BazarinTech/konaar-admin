'use client';

import { useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { PencilIcon, PlusIcon } from 'lucide-react';
import { createSkill, updateSkill } from '../actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
import { cn } from '@/lib/utils';
import {
  OPERATION_LABELS,
  SITE_TYPE_LABELS,
  type Skill,
  type SkillDraft,
} from '../types';

const EMPTY: SkillDraft = {
  slug: '',
  name: '',
  description: '',
  instructions: '',
  operations: [],
  siteTypes: [],
  triggers: [],
  enabled: true,
  priority: 0,
};

/** `Stripe checkout` → `stripe-checkout`, for a slug nobody has typed yet. */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

/**
 * Create or edit a skill.
 *
 * The scope is the part that decides cost, so it is shown as plainly as the
 * text: which work reads the skill, for which kinds of site, and whether it
 * waits for a word in the request. A skill with no work chosen applies to
 * nothing — the form says so rather than letting it look finished.
 */
export function SkillForm({
  skill,
  operations,
  siteTypes,
  budgetChars,
}: {
  skill?: Skill;
  operations: string[];
  siteTypes: string[];
  budgetChars: number;
}) {
  const editing = Boolean(skill);
  const initial: SkillDraft = skill
    ? {
        slug: skill.slug,
        name: skill.name,
        description: skill.description,
        instructions: skill.instructions,
        operations: skill.operations,
        siteTypes: skill.siteTypes,
        triggers: skill.triggers,
        enabled: skill.enabled,
        priority: skill.priority,
      }
    : EMPTY;

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<SkillDraft>(initial);
  const [triggerText, setTriggerText] = useState(initial.triggers.join(', '));
  const [slugTouched, setSlugTouched] = useState(editing);
  const [pending, start] = useTransition();

  const set = <K extends keyof SkillDraft>(key: K, value: SkillDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const toggle = (key: 'operations' | 'siteTypes', value: string) =>
    setDraft((d) => ({
      ...d,
      [key]: d[key].includes(value)
        ? d[key].filter((v) => v !== value)
        : [...d[key], value],
    }));

  const triggers = useMemo(
    () =>
      triggerText
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t.length >= 2),
    [triggerText],
  );

  const problems: string[] = [];
  if (draft.name.trim().length < 2) problems.push('a name');
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(draft.slug)) problems.push('a valid slug');
  if (draft.instructions.trim().length < 10) problems.push('instructions');
  const chars = draft.instructions.length;

  const submit = () =>
    start(async () => {
      const payload: SkillDraft = { ...draft, triggers };
      const result = editing
        ? await updateSkill(skill!.id, payload)
        : await createSkill(payload);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message ?? 'Saved.');
      setOpen(false);
      if (!editing) {
        setDraft(EMPTY);
        setTriggerText('');
        setSlugTouched(false);
      }
    });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        // Reopening an edit shows what is stored, not an abandoned draft.
        if (next && editing) {
          setDraft(initial);
          setTriggerText(initial.triggers.join(', '));
        }
      }}
    >
      <DialogTrigger asChild>
        {editing ? (
          <Button size="sm" variant="ghost" aria-label={`Edit ${skill!.name}`}>
            <PencilIcon />
            Edit
          </Button>
        ) : (
          <Button size="sm">
            <PlusIcon />
            New skill
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editing ? `Edit ${skill!.name}` : 'New skill'}</DialogTitle>
          <DialogDescription>
            Standing instructions the engine adds to its prompt for the work
            and sites you choose. The user&apos;s own request still wins where
            the two conflict.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="skill-name">Name</Label>
              <Input
                id="skill-name"
                value={draft.name}
                placeholder="Stripe checkout"
                onChange={(e) => {
                  set('name', e.target.value);
                  if (!slugTouched) set('slug', slugify(e.target.value));
                }}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="skill-slug">Slug</Label>
              <Input
                id="skill-slug"
                value={draft.slug}
                placeholder="stripe-checkout"
                className="font-mono text-xs"
                onChange={(e) => {
                  setSlugTouched(true);
                  set('slug', e.target.value.toLowerCase());
                }}
              />
              <p className="text-muted-foreground text-xs">
                What the build log records when this skill is applied.
              </p>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="skill-description">What it is for</Label>
            <Input
              id="skill-description"
              value={draft.description}
              placeholder="How every shop takes payment"
              onChange={(e) => set('description', e.target.value)}
            />
            <p className="text-muted-foreground text-xs">
              For the people reading this list. The model never sees it.
            </p>
          </div>

          <div className="grid gap-2">
            <div className="flex items-baseline justify-between">
              <Label htmlFor="skill-instructions">Instructions</Label>
              <span
                className={cn(
                  'tabular text-xs',
                  chars > 8000 ? 'text-destructive' : 'text-muted-foreground',
                )}
              >
                {chars.toLocaleString()} / 8,000
              </span>
            </div>
            <Textarea
              id="skill-instructions"
              value={draft.instructions}
              rows={10}
              className="font-mono text-xs"
              placeholder={
                'Take payment with Stripe Checkout, never with a card form of our own.\n' +
                'Create the session on the server; the browser only redirects.\n' +
                'Confirm the order from the webhook, not from the success page.'
              }
              onChange={(e) => set('instructions', e.target.value)}
            />
            <p className="text-muted-foreground text-xs">
              Written to the model, in the imperative. Every build that uses
              this pays for these words on every turn, and all the skills a
              build receives share a budget of{' '}
              {budgetChars.toLocaleString()} characters.
            </p>
          </div>

          <fieldset className="grid gap-2">
            <legend className="mb-1 text-sm font-medium">Work that reads it</legend>
            <div className="flex flex-wrap gap-2">
              {operations.map((op) => (
                <Chip
                  key={op}
                  label={OPERATION_LABELS[op] ?? op}
                  on={draft.operations.includes(op)}
                  onClick={() => toggle('operations', op)}
                />
              ))}
            </div>
            {draft.operations.length === 0 ? (
              <p className="text-xs text-warning">
                Choose at least one, or this skill applies to nothing.
              </p>
            ) : null}
          </fieldset>

          <fieldset className="grid gap-2">
            <legend className="mb-1 text-sm font-medium">Kinds of site</legend>
            <div className="flex flex-wrap gap-2">
              {siteTypes.map((t) => (
                <Chip
                  key={t}
                  label={SITE_TYPE_LABELS[t] ?? t}
                  on={draft.siteTypes.includes(t)}
                  onClick={() => toggle('siteTypes', t)}
                />
              ))}
            </div>
            <p className="text-muted-foreground text-xs">
              {draft.siteTypes.length === 0
                ? 'Every kind of site.'
                : 'Only these. The specification decides the kind of site, so a skill limited to some kinds is not read while writing the specification itself.'}
            </p>
          </fieldset>

          <div className="grid gap-2">
            <Label htmlFor="skill-triggers">Only when the request mentions</Label>
            <Input
              id="skill-triggers"
              value={triggerText}
              placeholder="stripe, payments, checkout"
              onChange={(e) => setTriggerText(e.target.value)}
            />
            <p className="text-muted-foreground text-xs">
              {triggers.length === 0
                ? 'Leave empty to apply whenever the work and site match.'
                : `Applies only if the request contains one of: ${triggers.join(', ')}. Whole words, so “art” does not match “start”.`}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="skill-priority">Priority</Label>
              <Input
                id="skill-priority"
                type="number"
                min={-100}
                max={100}
                step={1}
                value={draft.priority}
                className="tabular max-w-28"
                onChange={(e) => set('priority', Number(e.target.value) || 0)}
              />
              <p className="text-muted-foreground text-xs">
                Higher is read first, and kept first when a build is over its
                skills budget.
              </p>
            </div>
            <div className="flex items-start gap-3 pt-6">
              <Switch
                id="skill-enabled"
                checked={draft.enabled}
                onCheckedChange={(v) => set('enabled', v)}
              />
              <Label htmlFor="skill-enabled" className="leading-snug">
                On
                <span className="text-muted-foreground block text-xs font-normal">
                  Off keeps the skill without applying it.
                </span>
              </Label>
            </div>
          </div>
        </div>

        <DialogFooter className="items-center gap-2 sm:justify-between">
          <span className="text-muted-foreground text-xs">
            {problems.length ? `Needs ${problems.join(', ')}.` : ''}
          </span>
          <Button
            onClick={submit}
            disabled={pending || problems.length > 0 || chars > 8000}
          >
            {pending ? 'Saving…' : editing ? 'Save changes' : 'Create skill'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Chip({
  label,
  on,
  onClick,
}: {
  label: string;
  on: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1 text-xs transition-colors focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none',
        on
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-input text-muted-foreground hover:text-foreground',
      )}
    >
      {label}
    </button>
  );
}
