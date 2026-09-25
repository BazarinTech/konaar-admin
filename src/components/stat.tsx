import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

/**
 * One number, with what it means under it.
 *
 * `hint` is for the thing a number cannot say on its own — how it was measured,
 * or what it is being compared against. A figure without that is the most
 * common way a dashboard misleads.
 */
export function Stat({
  label,
  value,
  hint,
  tone = 'default',
  icon,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: 'default' | 'positive' | 'negative' | 'warning';
  icon?: React.ReactNode;
}) {
  return (
    <Card className="p-4">
      <div className="text-muted-foreground flex items-center justify-between gap-2 text-xs font-medium">
        {label}
        {icon}
      </div>
      <div
        className={cn(
          'tabular mt-2 text-2xl font-semibold tracking-tight',
          tone === 'positive' && 'text-success',
          tone === 'negative' && 'text-destructive',
          tone === 'warning' && 'text-warning',
        )}
      >
        {value}
      </div>
      {hint ? (
        <div className="text-muted-foreground mt-1 text-xs">{hint}</div>
      ) : null}
    </Card>
  );
}
