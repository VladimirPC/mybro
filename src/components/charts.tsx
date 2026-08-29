import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AppStats } from "@/lib/stats";

const tooltipStyle = {
  background: "var(--color-surface-2)",
  border: "1px solid var(--color-border)",
  borderRadius: 12,
  color: "var(--color-fg)",
  fontSize: 12,
};

function dayLabel(ts: number) {
  return format(ts, "d MMM", { locale: ru });
}

export function DailyChart({ stats }: { stats: AppStats }) {
  const data = stats.series30.map((d) => ({
    t: d.start,
    label: dayLabel(d.start),
    count: d.count,
    limit: d.limit,
  }));
  return (
    <div className="h-52 w-full">
      <ResponsiveContainer>
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="fillCount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--color-border)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: "var(--color-subtle)", fontSize: 11 }} axisLine={false} tickLine={false} interval={4} />
          <YAxis tick={{ fill: "var(--color-subtle)", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Area type="monotone" dataKey="count" name="Сигареты" stroke="var(--color-primary)" fill="url(#fillCount)" strokeWidth={2} />
          <Line type="stepAfter" dataKey="limit" name="Лимит" stroke="var(--color-warn)" strokeDasharray="4 4" dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AverageChart({ stats }: { stats: AppStats }) {
  const data = stats.avgSeries.slice(-60).map((d) => ({
    label: dayLabel(d.start),
    avg: Number(d.avg.toFixed(2)),
    limit: d.limit,
  }));
  return (
    <div className="h-52 w-full">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid stroke="var(--color-border)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: "var(--color-subtle)", fontSize: 11 }} axisLine={false} tickLine={false} interval={6} />
          <YAxis tick={{ fill: "var(--color-subtle)", fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Line type="monotone" dataKey="avg" name="Среднее" stroke="var(--color-primary)" strokeWidth={2} dot={false} />
          <Line type="stepAfter" dataKey="limit" name="Лимит" stroke="var(--color-warn)" strokeDasharray="4 4" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function WeekdayChart({ weekday }: { weekday: number[] }) {
  const labels = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
  const data = weekday.map((n, i) => ({ label: labels[i], n }));
  return (
    <div className="h-40 w-full">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
          <XAxis dataKey="label" tick={{ fill: "var(--color-subtle)", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "var(--color-subtle)", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="n" name="Всего" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
