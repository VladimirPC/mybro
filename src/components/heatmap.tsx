import { format, getISODay } from "date-fns";
import { ru } from "date-fns/locale";
import type { DayBucket } from "@/lib/stats";
import { cn } from "@/lib/utils";

const WD = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

export function HourHeatmap({ hourly }: { hourly: number[] }) {
  const max = Math.max(1, ...hourly);
  return (
    <div>
      <div className="flex h-24 items-end gap-0.5">
        {hourly.map((n, h) => (
          <div key={h} className="flex flex-1 flex-col items-center justify-end gap-1">
            <div
              className="w-full rounded-sm bg-primary"
              style={{ height: `${Math.max(6, (n / max) * 100)}%`, opacity: 0.25 + (n / max) * 0.75 }}
              title={`${h}:00 — ${n}`}
            />
          </div>
        ))}
      </div>
      <div className="mt-1 flex text-xs text-subtle">
        <span>0</span>
        <span className="mx-auto">12</span>
        <span>23</span>
      </div>
    </div>
  );
}

export function DayHeatmap({ series }: { series: DayBucket[] }) {
  const last = series.slice(-84);
  const max = Math.max(1, ...last.map((d) => d.count));
  const pad = last[0] ? (getISODay(last[0].start) - 1) : 0;
  const cells: (DayBucket | null)[] = [...Array.from({ length: pad }, () => null), ...last];

  return (
    <div>
      <div className="mb-2 flex justify-between text-xs text-subtle">
        {WD.map((d) => (
          <span key={d} className="w-[12.5%] text-center">
            {d}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (!d) return <div key={`p${i}`} />;
          const over = d.limit != null && d.count > d.limit;
          const t = d.count / max;
          return (
            <div
              key={d.key}
              title={`${format(d.start, "d MMM", { locale: ru })}: ${d.count}`}
              className={cn("aspect-square rounded-sm", over && "outline outline-1 outline-danger/70")}
              style={{
                background: d.count === 0 ? "var(--color-surface-2)" : "var(--color-primary)",
                opacity: d.count === 0 ? 1 : 0.2 + t * 0.8,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
