import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { AppShell } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardHint, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { cigWord, dayWord, formatNum } from "@/lib/format";
import { currentLimit, dayKey, nextTaperAt } from "@/lib/stats";
import { useSmokeStore } from "@/lib/store";
import { useStats } from "@/lib/use-stats";

export const Route = createFileRoute("/plan")({ component: PlanPage });

function PlanPage() {
  const plan = useSmokeStore((s) => s.plan);
  const settings = useSmokeStore((s) => s.settings);
  const patchPlan = useSmokeStore((s) => s.patchPlan);
  const patchSettings = useSmokeStore((s) => s.patchSettings);
  const stats = useStats();
  const limit = currentLimit(plan, settings, stats.now);
  const next = nextTaperAt(plan, stats.now);
  const weeks =
    plan.stepSize > 0 ? Math.max(0, Math.ceil((limit ?? plan.startLimit) - plan.targetLimit) / plan.stepSize) : 0;

  return (
    <AppShell title="План снижения">
      <div className="page-enter space-y-4">
        <Card>
          <CardTitle>Договор на сегодня</CardTitle>
          <CardHint className="mt-1">
            Не «навсегда». Только до полуночи: не выходить за лимит.
          </CardHint>
          {settings.pledgeDay === dayKey(stats.now) ? (
            <p className="mt-3 text-sm text-ok">Договор действует. Сегодня — в рамках лимита.</p>
          ) : (
            <Button
              className="mt-4 w-full"
              onClick={() => patchSettings({ pledgeDay: dayKey(stats.now) })}
            >
              Держу лимит до полуночи
            </Button>
          )}
        </Card>

        <Card>
          <p className="text-xs tracking-wide text-muted uppercase">Сегодня можно</p>
          <p className="font-display mt-1 text-5xl tracking-tight tabular">{limit ?? "—"}</p>
          <p className="mt-2 text-sm text-muted">
            {stats.today} {cigWord(stats.today)} уже отмечено. Среднее за всё время — {formatNum(stats.allTimeAvg)}.
          </p>
          {stats.overLimit ? (
            <p className="mt-2 text-sm text-danger">Лимит превышен. Завтра можно начать с чистого счётчика.</p>
          ) : null}
        </Card>

        <Card className="flex items-center justify-between gap-4">
          <div>
            <CardTitle>Автоспуск</CardTitle>
            <CardHint className="mt-1">Лимит сам снижается, пока не дойдёт до цели.</CardHint>
          </div>
          <Switch
            checked={plan.enabled}
            onCheckedChange={(on) => {
              if (on) {
                patchPlan({
                  enabled: true,
                  startedAt: plan.startedAt || Date.now(),
                  startLimit: limit ?? plan.startLimit,
                  paused: false,
                  frozenLimit: null,
                });
              } else {
                patchPlan({ enabled: false, paused: false, frozenLimit: limit });
                if (limit != null) patchSettings({ dailyLimit: limit });
              }
            }}
          />
        </Card>

        {plan.enabled ? (
          <Card className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Пауза</CardTitle>
              <CardHint className="mt-1">Заморозить текущий лимит, не сбрасывая план.</CardHint>
            </div>
            <Switch
              checked={plan.paused}
              onCheckedChange={(on) =>
                patchPlan({ paused: on, frozenLimit: on ? limit : null })
              }
            />
          </Card>
        ) : null}

        <Card>
          <div className="mb-3 flex justify-between text-sm">
            <span className="text-muted">{plan.enabled ? "Лимит на старте плана" : "Ручной лимит"}</span>
            <span className="tabular">{plan.enabled ? plan.startLimit : (settings.dailyLimit ?? 0)}</span>
          </div>
          <Slider
            min={0}
            max={Math.max(40, settings.baselinePerDay ?? 20)}
            step={1}
            value={[plan.enabled ? plan.startLimit : (settings.dailyLimit ?? 0)]}
            onValueChange={(v) => {
              const n = v[0] ?? 0;
              if (plan.enabled) patchPlan({ startLimit: n });
              else patchSettings({ dailyLimit: n });
            }}
          />
          <p className="mt-3 text-xs text-subtle">
            Если среднее за неделю {formatNum(stats.rolling7Avg)}, логичный следующий потолок —{" "}
            {Math.max(0, Math.ceil(stats.rolling7Avg) - 1)}.
          </p>
        </Card>

        <Card>
          <div className="mb-3 flex justify-between text-sm">
            <span className="text-muted">Шаг снижения</span>
            <span className="tabular">
              −{plan.stepSize} / {plan.stepDays} {dayWord(plan.stepDays)}
            </span>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3].map((n) => (
              <Button
                key={n}
                variant={plan.stepSize === n ? "default" : "outline"}
                className="flex-1"
                onClick={() => patchPlan({ stepSize: n })}
              >
                −{n}
              </Button>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            {[3, 7, 14].map((n) => (
              <Button
                key={n}
                variant={plan.stepDays === n ? "default" : "outline"}
                className="flex-1"
                onClick={() => patchPlan({ stepDays: n })}
              >
                {n} дн.
              </Button>
            ))}
          </div>
        </Card>

        <Card>
          <div className="mb-3 flex justify-between text-sm">
            <span className="text-muted">Цель</span>
            <span className="tabular">{plan.targetLimit === 0 ? "бросить (0)" : plan.targetLimit}</span>
          </div>
          <Slider
            min={0}
            max={Math.max(plan.startLimit, 1)}
            step={1}
            value={[plan.targetLimit]}
            onValueChange={(v) => patchPlan({ targetLimit: v[0] ?? 0 })}
          />
        </Card>

        <Card>
          <CardTitle>Прогноз</CardTitle>
          {next ? (
            <p className="mt-2 text-sm text-muted">
              {format(next.at, "d MMMM", { locale: ru })} лимит станет {next.limit}.
            </p>
          ) : (
            <p className="mt-2 text-sm text-muted">Следующего шага нет — либо цель достигнута, либо план на паузе.</p>
          )}
          <p className="mt-2 text-sm text-muted">
            До цели примерно {formatNum(weeks, 0)} шагов. Исходная норма была {settings.baselinePerDay ?? "—"}.
            Уже не выкурено относительно неё: {stats.avoided} {cigWord(stats.avoided)}.
          </p>
        </Card>
      </div>
    </AppShell>
  );
}
