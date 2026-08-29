import { createFileRoute, Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { AverageChart, DailyChart } from "@/components/charts";
import { AppShell } from "@/components/layout";
import { CountRing } from "@/components/ring";
import { Card, CardHint, CardTitle } from "@/components/ui/card";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { getCompanionState, type CloudSnapshot } from "@/lib/cloud";
import { cigWord, formatAgo, formatNum, formatTime } from "@/lib/format";
import { computeStats } from "@/lib/stats";
import { triggerLabel } from "@/lib/types";

export const Route = createFileRoute("/circle/$userId")({ component: CompanionPage });

function CompanionPage() {
  const { userId } = Route.useParams();
  const { user, isPending } = useCurrentUserState();
  const [name, setName] = useState("Друг");
  const [snap, setSnap] = useState<CloudSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || user.isDevFallback) return;
    let alive = true;
    void getCompanionState({ data: userId })
      .then((res) => {
        if (!alive) return;
        setName(res.name);
        setSnap(res.snapshot);
      })
      .catch((err: unknown) => {
        if (!alive) return;
        setError(err instanceof Error ? err.message : "Нет доступа");
      });
    const t = window.setInterval(() => {
      void getCompanionState({ data: userId })
        .then((res) => {
          if (!alive) return;
          setName(res.name);
          setSnap(res.snapshot);
        })
        .catch(() => undefined);
    }, 20_000);
    return () => {
      alive = false;
      window.clearInterval(t);
    };
  }, [user, userId]);

  const stats = useMemo(
    () => (snap ? computeStats(snap.logs, snap.resisted, snap.settings, snap.plan) : null),
    [snap],
  );

  if (isPending) {
    return (
      <AppShell title="Прогресс">
        <div className="h-40 animate-pulse rounded-2xl bg-surface" />
      </AppShell>
    );
  }
  if (!user) return <RedirectToSignIn />;

  if (error) {
    return (
      <AppShell title="Прогресс">
        <p className="text-sm text-danger">{error}</p>
        <Link to="/circle" className="mt-4 inline-flex text-sm text-primary">
          Назад к кругу
        </Link>
      </AppShell>
    );
  }

  if (!stats || !snap) {
    return (
      <AppShell title="Прогресс">
        <div className="h-40 animate-pulse rounded-2xl bg-surface" />
      </AppShell>
    );
  }

  return (
    <AppShell title={name}>
      <div className="page-enter space-y-5">
        <p className="text-center text-sm text-muted">Только просмотр. Учёт ведёт {name}.</p>
        <CountRing
          value={stats.today}
          max={stats.limit ?? 0}
          label="сегодня"
          sub={
            stats.limit == null
              ? "лимит не задан"
              : stats.overLimit
                ? "сверх лимита"
                : `осталось ${stats.remaining}`
          }
        />
        <div className="grid grid-cols-3 gap-2">
          <Mini label="Среднее" value={formatNum(stats.allTimeAvg)} hint={`${stats.daysTracked} дн.`} />
          <Mini label="Неделя" value={String(stats.week)} hint="пн–вс" />
          <Mini label="Месяц" value={String(stats.month)} hint="календарный" />
        </div>
        {stats.lastAt ? (
          <p className="text-center text-sm text-muted">Последняя {formatAgo(stats.lastAt, stats.now)}</p>
        ) : (
          <p className="text-center text-sm text-muted">Сегодня ещё без отметок.</p>
        )}
        {snap.plan.enabled ? (
          <Card>
            <CardTitle>План</CardTitle>
            <p className="mt-2 text-sm text-muted">
              Старт {snap.plan.startLimit}, шаг −{snap.plan.stepSize} каждые {snap.plan.stepDays} дн., цель{" "}
              {snap.plan.targetLimit}. {snap.plan.paused ? "Пауза." : ""}
            </p>
          </Card>
        ) : null}
        <Card>
          <CardTitle>По дням</CardTitle>
          <CardHint className="mt-1">Как у него на графике.</CardHint>
          <div className="mt-3">
            <DailyChart stats={stats} />
          </div>
        </Card>
        <Card>
          <CardTitle>Среднее</CardTitle>
          <div className="mt-3">
            <AverageChart stats={stats} />
          </div>
        </Card>
        <div>
          <h2 className="font-display mb-2 text-lg tracking-tight">Сегодня</h2>
          {snap.logs.filter((l) => format(l.at, "yyyy-MM-dd") === format(stats.now, "yyyy-MM-dd")).length === 0 ? (
            <p className="text-sm text-muted">Пусто.</p>
          ) : (
            <ul className="divide-y divide-border">
              {snap.logs
                .filter((l) => format(l.at, "yyyy-MM-dd") === format(stats.now, "yyyy-MM-dd"))
                .sort((a, b) => b.at - a.at)
                .map((l) => (
                  <li key={l.id} className="flex justify-between py-3 text-sm">
                    <span className="tabular">{formatTime(l.at)}</span>
                    <span className="text-muted">{l.trigger ? triggerLabel(l.trigger) : "без пометки"}</span>
                  </li>
                ))}
            </ul>
          )}
        </div>
        <p className="text-center text-xs text-subtle">
          {stats.total} {cigWord(stats.total)} за всё время · обновляется само
        </p>
        <Link to="/circle" className="inline-flex h-11 items-center text-sm text-primary">
          Назад к кругу
        </Link>
      </div>
    </AppShell>
  );
}

function Mini({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-xl bg-surface px-3 py-3 shadow-[var(--shadow-border)]">
      <div className="text-xs text-muted">{label}</div>
      <div className="font-display mt-1 text-2xl tracking-tight tabular">{value}</div>
      <div className="text-xs text-subtle">{hint}</div>
    </div>
  );
}
