import { createFileRoute } from "@tanstack/react-router";
import { AverageChart, DailyChart, WeekdayChart } from "@/components/charts";
import { DayHeatmap, HourHeatmap } from "@/components/heatmap";
import { AppShell } from "@/components/layout";
import { Card, CardHint, CardTitle } from "@/components/ui/card";
import { cigWord, formatNum, formatTime } from "@/lib/format";
import { peakHour } from "@/lib/stats";
import { useStats } from "@/lib/use-stats";

export const Route = createFileRoute("/analytics")({ component: AnalyticsPage });

function AnalyticsPage() {
  const stats = useStats();
  const peak = peakHour(stats.hourly);
  const topTriggers = stats.triggers.filter((t) => t.count > 0).slice(0, 4);

  return (
    <AppShell title="Аналитика">
      <div className="page-enter space-y-4">
        <Card>
          <CardHint>Среднее за все дни учёта</CardHint>
          <p className="font-display mt-1 text-4xl tracking-tight tabular">{formatNum(stats.allTimeAvg)}</p>
          <p className="mt-2 text-sm text-muted">
            {stats.total} {cigWord(stats.total)} делим на {stats.daysTracked}{" "}
            {stats.daysTracked === 1 ? "день" : "дней"} с начала. Пустые дни тоже в знаменателе.
          </p>
        </Card>

        <div className="grid grid-cols-2 gap-2">
          <Mini label="7 дней" value={formatNum(stats.rolling7Avg)} extra={`${stats.rolling7} шт.`} />
          <Mini label="30 дней" value={formatNum(stats.rolling30Avg)} extra={`${stats.rolling30} шт.`} />
          <Mini label="Вчера" value={String(stats.yesterday)} extra="сутки" />
          <Mini label="Серия в лимите" value={String(stats.streakUnder)} extra={`лучшая ${stats.bestStreak}`} />
        </div>

        <Card>
          <CardTitle>По дням</CardTitle>
          <CardHint className="mt-1">Столбики — факт, пунктир — лимит на тот день.</CardHint>
          <div className="mt-3">
            <DailyChart stats={stats} />
          </div>
        </Card>

        <Card>
          <CardTitle>Как падает среднее</CardTitle>
          <CardHint className="mt-1">Накопительное среднее: все сигареты / все дни к этой дате.</CardHint>
          <div className="mt-3">
            <AverageChart stats={stats} />
          </div>
        </Card>

        <Card>
          <CardTitle>Часы</CardTitle>
          <CardHint className="mt-1">
            Чаще всего в {String(peak.hour).padStart(2, "0")}:00 — {peak.count} {cigWord(peak.count)}. Тяга в это время
            предсказуема.
          </CardHint>
          <div className="mt-4">
            <HourHeatmap hourly={stats.hourly} />
          </div>
        </Card>

        <Card>
          <CardTitle>Дни недели</CardTitle>
          <div className="mt-3">
            <WeekdayChart weekday={stats.weekday} />
          </div>
        </Card>

        <Card>
          <CardTitle>Календарь</CardTitle>
          <CardHint className="mt-1">Ярче — больше. Обводка — день сверх лимита.</CardHint>
          <div className="mt-3">
            <DayHeatmap series={stats.series} />
          </div>
        </Card>

        {topTriggers.length ? (
          <Card>
            <CardTitle>Триггеры</CardTitle>
            <ul className="mt-3 space-y-2">
              {topTriggers.map((t) => (
                <li key={t.id} className="flex items-center justify-between text-sm">
                  <span>{t.label}</span>
                  <span className="tabular text-muted">{t.count}</span>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}

        {stats.lastAt ? (
          <p className="text-center text-xs text-subtle">Последняя отметка в {formatTime(stats.lastAt)}</p>
        ) : null}
      </div>
    </AppShell>
  );
}

function Mini({ label, value, extra }: { label: string; value: string; extra: string }) {
  return (
    <Card>
      <p className="text-xs text-muted">{label}</p>
      <p className="font-display mt-1 text-2xl tabular">{value}</p>
      <p className="text-xs text-subtle">{extra}</p>
    </Card>
  );
}
