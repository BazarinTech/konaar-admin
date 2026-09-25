'use client';

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { moneyShort } from '@/lib/format';

/** One place for the axis and grid styling, so every chart reads the same. */
const axis = {
  stroke: 'var(--muted-foreground)',
  fontSize: 11,
  tickLine: false,
  axisLine: false,
};

const tooltipStyle = {
  contentStyle: {
    background: 'var(--popover)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    fontSize: '12px',
    color: 'var(--popover-foreground)',
  },
  labelStyle: { color: 'var(--muted-foreground)', marginBottom: 4 },
};

/**
 * `2026-09-22` as `Sep 22`.
 *
 * Takes `unknown` because recharts types both the tick value and the tooltip
 * label as anything a chart could carry; the days here are always strings, and
 * anything else is passed through rather than rendered as `Invalid Date`.
 */
const day = (value: unknown): string => {
  if (typeof value !== 'string') return String(value ?? '');
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
      });
};

export interface GrowthPoint {
  day: string;
  total_users: number;
  new_users: number;
  active_users: number;
  builds: number;
}

/**
 * Users against active users.
 *
 * Two axes on purpose: cumulative signups and daily actives differ by an order
 * of magnitude, and drawing them on one scale flattens the line that matters
 * into the baseline.
 */
export function GrowthChart({ data }: { data: GrowthPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="total" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--border)" vertical={false} />
        <XAxis dataKey="day" tickFormatter={day} {...axis} />
        <YAxis yAxisId="left" {...axis} />
        <YAxis yAxisId="right" orientation="right" {...axis} />
        <Tooltip {...tooltipStyle} labelFormatter={day} />
        <Legend
          wrapperStyle={{ fontSize: 11, color: 'var(--muted-foreground)' }}
        />
        <Area
          yAxisId="left"
          type="monotone"
          dataKey="total_users"
          name="Total users"
          stroke="var(--chart-1)"
          strokeWidth={2}
          fill="url(#total)"
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="active_users"
          name="Active that day"
          stroke="var(--chart-2)"
          strokeWidth={2}
          dot={false}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="new_users"
          name="New signups"
          stroke="var(--chart-3)"
          strokeWidth={2}
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export interface MoneyPoint {
  day: string;
  revenue: number;
  cost: number;
  profit: number;
}

/** Revenue against what it cost to serve, with the profit line over it. */
export function RevenueChart({ data }: { data: MoneyPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <CartesianGrid stroke="var(--border)" vertical={false} />
        <XAxis dataKey="day" tickFormatter={day} {...axis} />
        <YAxis tickFormatter={moneyShort} {...axis} />
        <Tooltip
          {...tooltipStyle}
          labelFormatter={day}
          formatter={(value, name) => [
            moneyShort(typeof value === 'number' ? value : Number(value ?? 0)),
            name,
          ]}
        />
        <Legend
          wrapperStyle={{ fontSize: 11, color: 'var(--muted-foreground)' }}
        />
        <Bar
          dataKey="revenue"
          name="Revenue"
          fill="var(--chart-2)"
          radius={[3, 3, 0, 0]}
        />
        <Bar
          dataKey="cost"
          name="Cost"
          fill="var(--chart-4)"
          radius={[3, 3, 0, 0]}
        />
        <Line
          type="monotone"
          dataKey="profit"
          name="Profit"
          stroke="var(--chart-1)"
          strokeWidth={2}
          dot={false}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Builds per day — the platform's actual workload. */
export function BuildsChart({ data }: { data: GrowthPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid stroke="var(--border)" vertical={false} />
        <XAxis dataKey="day" tickFormatter={day} {...axis} />
        <YAxis {...axis} />
        <Tooltip {...tooltipStyle} labelFormatter={day} />
        <Bar
          dataKey="builds"
          name="Builds"
          fill="var(--chart-1)"
          radius={[3, 3, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
