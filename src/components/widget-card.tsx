import type { ReactNode } from "react";
import { formatTime } from "@/lib/format";
import type { AppStats } from "@/lib/stats";
import type { ReductionPlan, WidgetConfig, WidgetLayout, WidgetSize } from "@/lib/types";
import { presetById } from "@/lib/widget-presets";
import { cn } from "@/lib/utils";

const SIZE: Record<WidgetSize, string> = {
  s: "h-44 w-44 p-4",
  m: "h-44 w-full max-w-sm p-4",
  l: "min-h-72 w-full max-w-sm p-5",
  full: "min-h-[28rem] w-full p-6",
};

function Cell({
  label,
  value,
  warn,
  large,
}: {
  label: string;
  value: string;
  warn?: boolean;
  large?: boolean;
}) {
  return (
    <div className="min-w-0">
      <div className="text-xs tracking-wide text-[color:var(--w-muted)] uppercase">{label}</div>
      <div
        className={cn(
          "mt-0.5 truncate font-display leading-none tracking-tight tabular",
          large ? "text-3xl" : "text-xl",
          warn ? "text-[color:var(--w-danger)]" : "text-[color:var(--w-fg)]",
        )}
      >
        {value}
      </div>
    </div>
  );
}

function Ring({ pct, over, children }: { pct: number; over: boolean; children: ReactNode }) {
  const dash = Math.max(0, Math.min(100, pct));
  return (
    <div className="relative mx-auto size-[7.5rem]">
      <svg viewBox="0 0 36 36" className="size-full -rotate-90">
        <circle cx="18" cy="18" r="15.2" fill="none" stroke="var(--w-line)" strokeWidth="3.2" />
        <circle
          cx="18"
          cy="18"
          r="15.2"
          fill="none"
          stroke={over ? "var(--w-danger)" : "var(--w-accent)"}
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${100 - dash}`}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}

export function WidgetCard({
  stats,
  config,
  onAdd,
  onCrave,
  plan,
  currency = "₽",
  className,
  fill,
  layout: layoutProp,
}: {
  stats: AppStats;
  config: WidgetConfig;
  onAdd?: () => void;
  onCrave?: () => void;
  plan?: ReductionPlan;
  currency?: string;
  className?: string;
  fill?: boolean;
  layout?: WidgetLayout;
}) {
  const layout = layoutProp ?? config.layout ?? "full";
  const preset = presetById(layout);
  const size = fill || layout === "full" ? "full" : (preset?.size ?? config.size);
  const remain =
    stats.remaining == null ? "—" : stats.overLimit ? `+${stats.today - (stats.limit ?? 0)}` : String(stats.remaining);
  const last = stats.lastAt ? formatTime(stats.lastAt) : "—";
  const avg = stats.allTimeAvg.toFixed(1).replace(".", ",");
  const large = fill || size === "full";
  const pct = stats.limit && stats.limit > 0 ? Math.min(100, Math.round((stats.today / stats.limit) * 100)) : 0;
  const lifeH = Math.floor(stats.lifeMinutes / 60);
  const lifeM = stats.lifeMinutes % 60;
  const money = stats.moneySaved == null ? "—" : `${Math.round(stats.moneySaved)} ${currency}`;

  const face = (() => {
    if (layout === "today") {
      return (
        <div className="flex h-full flex-col">
          <div className="text-xs text-[color:var(--w-muted)] uppercase">Сегодня</div>
          <div className="mt-auto font-display text-6xl leading-none tabular" style={{ color: stats.overLimit ? "var(--w-danger)" : "var(--w-fg)" }}>
            {stats.today}
          </div>
          <div className="mt-2 text-sm text-[color:var(--w-muted)]">
            {stats.limit != null ? `лимит ${stats.limit}` : "без лимита"}
          </div>
        </div>
      );
    }
    if (layout === "remain") {
      return (
        <div className="flex h-full flex-col">
          <div className="text-xs text-[color:var(--w-muted)] uppercase">{stats.overLimit ? "Сверх плана" : "Осталось"}</div>
          <div
            className="mt-auto font-display text-6xl leading-none tabular"
            style={{ color: stats.overLimit ? "var(--w-danger)" : "var(--w-accent)" }}
          >
            {remain}
          </div>
          <div className="mt-2 text-sm text-[color:var(--w-muted)]">из {stats.limit ?? "—"} за день</div>
        </div>
      );
    }
    if (layout === "ring") {
      return (
        <div className="flex h-full flex-col items-center justify-center">
          <Ring pct={pct} over={stats.overLimit}>
            <div>
              <div className="font-display text-3xl leading-none tabular">{stats.today}</div>
              <div className="text-xs text-[color:var(--w-muted)]">/ {stats.limit ?? "—"}</div>
            </div>
          </Ring>
        </div>
      );
    }
    if (layout === "plus") {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-3">
          <button
            type="button"
            onClick={onAdd}
            className="grid size-20 place-items-center rounded-full text-4xl font-medium"
            style={{ background: "var(--w-accent)", color: config.theme === "paper" ? "#efece4" : "#121410" }}
            aria-label="Отметить сигарету"
          >
            +
          </button>
          <div className="font-display text-2xl tabular">{stats.today}</div>
          <div className="text-xs text-[color:var(--w-muted)]">сегодня</div>
        </div>
      );
    }
    if (layout === "last") {
      return (
        <div className="flex h-full flex-col">
          <div className="text-xs text-[color:var(--w-muted)] uppercase">Последняя</div>
          <div className="mt-auto font-display text-5xl leading-none tracking-tight tabular">{last}</div>
          <div className="mt-2 text-sm text-[color:var(--w-muted)]">{stats.today} за сегодня</div>
        </div>
      );
    }
    if (layout === "wide") {
      return (
        <div className="flex h-full flex-col">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs text-[color:var(--w-muted)] uppercase">Дыши</div>
              <div className="font-display text-lg">сегодня</div>
            </div>
            {onAdd ? (
              <button
                type="button"
                onClick={onAdd}
                className="grid size-10 place-items-center rounded-full text-xl"
                style={{ background: "var(--w-accent)", color: config.theme === "paper" ? "#efece4" : "#121410" }}
                aria-label="Отметить сигарету"
              >
                +
              </button>
            ) : null}
          </div>
          <div className="mt-auto grid grid-cols-3 gap-3">
            <Cell label="Сегодня" value={String(stats.today)} warn={stats.overLimit} />
            <Cell label="Лимит" value={stats.limit == null ? "нет" : String(stats.limit)} />
            <Cell label={stats.overLimit ? "Сверх" : "Ещё"} value={remain} warn={stats.overLimit} />
          </div>
        </div>
      );
    }
    if (layout === "stats") {
      return (
        <div className="flex h-full flex-col">
          <div className="text-xs text-[color:var(--w-muted)] uppercase">Сводка</div>
          <div className="mt-auto grid grid-cols-3 gap-3">
            <Cell label="Среднее" value={avg} />
            <Cell label="Серия" value={`${stats.streakUnder} д`} />
            <Cell label="Неделя" value={String(stats.week)} />
          </div>
        </div>
      );
    }
    if (layout === "money") {
      return (
        <div className="flex h-full flex-col">
          <div className="text-xs text-[color:var(--w-muted)] uppercase">Не потратили</div>
          <div className="mt-auto font-display text-4xl leading-none tracking-tight tabular">{money}</div>
          <div className="mt-2 text-sm text-[color:var(--w-muted)]">за счёт снижения</div>
        </div>
      );
    }
    if (layout === "life") {
      return (
        <div className="flex h-full flex-col">
          <div className="text-xs text-[color:var(--w-muted)] uppercase">Вернули жизни</div>
          <div className="mt-auto font-display text-4xl leading-none tracking-tight tabular">
            {lifeH > 0 ? `${lifeH} ч` : `${lifeM} мин`}
          </div>
          <div className="mt-2 text-sm text-[color:var(--w-muted)]">
            {lifeH > 0 ? `${lifeM} мин сверху` : "11 минут на сигарету"}
          </div>
        </div>
      );
    }
    if (layout === "plan") {
      return (
        <div className="flex h-full flex-col">
          <div className="text-xs text-[color:var(--w-muted)] uppercase">План снижения</div>
          <div className="mt-auto grid grid-cols-2 gap-3">
            <Cell label="Сейчас" value={stats.limit == null ? "нет" : String(stats.limit)} large />
            <Cell label="Цель" value={String(plan?.targetLimit ?? 0)} large />
          </div>
          <div className="mt-3 text-xs text-[color:var(--w-muted)]">
            {plan?.enabled ? `шаг −${plan.stepSize} каждые ${plan.stepDays} дн.` : "план выключен"}
          </div>
        </div>
      );
    }
    if (layout === "crave") {
      return (
        <div className="flex h-full flex-col justify-between">
          <div>
            <div className="text-xs text-[color:var(--w-muted)] uppercase">Тяга</div>
            <div className="font-display mt-1 text-2xl leading-tight">Подождать 90 секунд</div>
          </div>
          <button
            type="button"
            onClick={onCrave}
            className="h-12 rounded-2xl text-sm font-medium"
            style={{ background: "var(--w-accent)", color: config.theme === "paper" ? "#efece4" : "#121410" }}
          >
            Дышать
          </button>
        </div>
      );
    }

    const cells: { key: string; node: ReactNode }[] = [];
    if (config.showToday) {
      cells.push({
        key: "today",
        node: <Cell label="Сегодня" value={String(stats.today)} warn={stats.overLimit} large={large} />,
      });
    }
    if (config.showLimit) {
      cells.push({
        key: "limit",
        node: <Cell label="Лимит" value={stats.limit == null ? "нет" : String(stats.limit)} large={large} />,
      });
    }
    if (config.showRemaining) {
      cells.push({
        key: "left",
        node: <Cell label={stats.overLimit ? "Сверх" : "Осталось"} value={remain} warn={stats.overLimit} large={large} />,
      });
    }
    if (config.showAverage) cells.push({ key: "avg", node: <Cell label="Среднее" value={avg} large={large} /> });
    if (config.showStreak) {
      cells.push({ key: "streak", node: <Cell label="Серия" value={`${stats.streakUnder} д`} large={large} /> });
    }
    if (config.showLast) cells.push({ key: "last", node: <Cell label="Последняя" value={last} large={large} /> });
    if (config.showWeek) cells.push({ key: "week", node: <Cell label="Неделя" value={String(stats.week)} large={large} /> });

    return (
      <div className="flex h-full flex-col">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className={cn("font-display tracking-tight", large ? "text-2xl" : "text-sm")}>Дыши</div>
            <div className="text-xs text-[color:var(--w-muted)]">постепенно к нулю</div>
          </div>
          {onAdd ? (
            <button
              type="button"
              onClick={onAdd}
              className={cn(
                "flex items-center justify-center rounded-full font-medium",
                large ? "size-14 text-2xl" : "size-9 text-lg",
              )}
              style={{ background: "var(--w-accent)", color: config.theme === "paper" ? "#efece4" : "#121410" }}
              aria-label="Отметить сигарету"
            >
              +
            </button>
          ) : null}
        </div>
        {config.showRing && stats.limit ? (
          <div className={cn("overflow-hidden rounded-full", large ? "mt-6 h-2" : "mt-3 h-1.5")} style={{ background: "var(--w-line)" }}>
            <div
              className="h-full rounded-full"
              style={{ width: `${pct}%`, background: stats.overLimit ? "var(--w-danger)" : "var(--w-accent)" }}
            />
          </div>
        ) : null}
        <div className={cn("mt-auto grid gap-4", large ? "grid-cols-2" : "grid-cols-3")}>
          {cells.slice(0, large ? 8 : 3).map((c) => (
            <div key={c.key}>{c.node}</div>
          ))}
        </div>
      </div>
    );
  })();

  return (
    <div
      className={cn(
        "widget-night relative overflow-hidden rounded-3xl",
        config.theme === "paper" && "widget-paper",
        config.theme === "sage" && "widget-sage",
        fill ? "h-full min-h-0 w-full max-w-none rounded-none p-6" : SIZE[size],
        className,
      )}
      style={{ background: "var(--w-bg)", color: "var(--w-fg)" }}
    >
      {face}
    </div>
  );
}
