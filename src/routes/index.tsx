import { createFileRoute, Link } from "@tanstack/react-router";
import { format, startOfDay } from "date-fns";
import { ru } from "date-fns/locale";
import { Undo2, Wind } from "lucide-react";
import { useState } from "react";
import { Breathe } from "@/components/breathe";
import { AppShell } from "@/components/layout";
import { Onboarding } from "@/components/onboarding";
import { CountRing } from "@/components/ring";
import { SmokeModal } from "@/components/smoke-modal";
import { TriggerChips } from "@/components/trigger-chips";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { InstallApp } from "@/components/install-app";
import { WidgetCard } from "@/components/widget-card";
import { cigWord, formatAgo, formatMoney, formatNum, formatTime } from "@/lib/format";
import { dayKey, nextTaperAt } from "@/lib/stats";
import { useSmokeStore } from "@/lib/store";
import { DEFAULT_TRIGGER, triggerLabel, type TriggerId } from "@/lib/types";
import { useStats } from "@/lib/use-stats";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const onboarded = useSmokeStore((s) => s.onboarded);
  const complete = useSmokeStore((s) => s.completeOnboarding);
  const addSmoke = useSmokeStore((s) => s.addSmoke);
  const undoSmoke = useSmokeStore((s) => s.undoSmoke);
  const addResisted = useSmokeStore((s) => s.addResisted);
  const setTrigger = useSmokeStore((s) => s.setTrigger);
  const setLastFactId = useSmokeStore((s) => s.setLastFactId);
  const lastFactId = useSmokeStore((s) => s.lastFactId);
  const logs = useSmokeStore((s) => s.logs);
  const settings = useSmokeStore((s) => s.settings);
  const plan = useSmokeStore((s) => s.plan);
  const stats = useStats();
  const { user, isPending } = useCurrentUserState();

  const [logId, setLogId] = useState<string | null>(null);
  const [factOpen, setFactOpen] = useState(false);
  const [craveOpen, setCraveOpen] = useState(false);
  const [confirmSoon, setConfirmSoon] = useState(false);
  const [editTriggerId, setEditTriggerId] = useState<string | null>(null);

  if (!onboarded) return <Onboarding onDone={complete} />;

  function logCigarette(trigger: TriggerId = DEFAULT_TRIGGER, force = false) {
    const lastGapMin = stats.lastAt ? (stats.now - stats.lastAt) / 60_000 : Infinity;
    if (!force && lastGapMin < 8) {
      setConfirmSoon(true);
      return;
    }
    const log = addSmoke(trigger);
    setLogId(log.id);
    setFactOpen(true);
  }

  const todayLogs = logs
    .filter((l) => l.at >= startOfDay(stats.now).getTime())
    .sort((a, b) => b.at - a.at);
  const taper = nextTaperAt(plan, stats.now);
  const reason = settings.reason;
  const activeLog = logs.find((l) => l.id === logId);

  return (
    <AppShell
      title={format(stats.now, "d MMMM", { locale: ru })}
      action={
        <button
          type="button"
          className="flex size-11 items-center justify-center rounded-lg text-muted hover:text-fg"
          onClick={() => undoSmoke()}
          aria-label="Отменить последнюю"
        >
          <Undo2 className="size-4" />
        </button>
      }
    >
      <div className="page-enter space-y-5">
        {!isPending && !user ? (
          <Link
            to="/login"
            className="block rounded-xl bg-surface px-4 py-3 text-sm shadow-[var(--shadow-border)]"
          >
            <span className="text-primary">Войдите</span>
            <span className="text-muted"> — сохраним учёт в облаке и откроем связь с другом.</span>
          </Link>
        ) : null}
        <InstallApp compact />
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
          <Stat label="Среднее" value={formatNum(stats.allTimeAvg)} hint={`${stats.daysTracked} дн.`} />
          <Stat label="Неделя" value={String(stats.week)} hint="пн–вс" />
          <Stat label="Отбил тягу" value={String(stats.resistedToday)} hint={`всего ${stats.resistedTotal}`} />
        </div>

        <div className="flex flex-col gap-2">
          <Button size="xl" className="w-full" onClick={() => logCigarette()}>
            Выкурил сигарету
          </Button>
          <Button size="lg" variant="secondary" className="w-full" onClick={() => setCraveOpen(true)}>
            <Wind className="size-4" />
            Тяга — подождать
          </Button>
        </div>

        {settings.pledgeDay === dayKey(stats.now) ? (
          <p className="text-center text-sm text-ok">Сегодня договор: не выходить за лимит.</p>
        ) : null}

        {reason ? (
          <p className="text-center text-sm text-muted">«{reason}»</p>
        ) : null}

        {stats.lastAt ? (
          <p className="text-center text-xs text-subtle">Последняя {formatAgo(stats.lastAt, stats.now)}</p>
        ) : (
          <p className="text-center text-xs text-subtle">Ещё ни одной сегодня. Так и должно быть.</p>
        )}

        <Card>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs tracking-wide text-muted uppercase">Все дни учёта</p>
              <p className="font-display mt-1 text-2xl tracking-tight tabular">{formatNum(stats.allTimeAvg)}</p>
              <p className="mt-1 text-sm text-muted">
                {stats.total} {cigWord(stats.total)} / {stats.daysTracked} дн.
              </p>
            </div>
            <Link to="/analytics" className="text-sm text-primary">
              Графики
            </Link>
          </div>
          {taper ? (
            <p className="mt-3 text-sm text-muted">
              Следующий спуск до {taper.limit} — {format(taper.at, "d MMMM", { locale: ru })}.
            </p>
          ) : null}
        </Card>

        <div className="grid grid-cols-2 gap-2">
          <Card>
            <p className="text-xs text-muted">Сэкономлено</p>
            <p className="font-display mt-1 text-xl tabular">
              {stats.moneySaved == null ? "—" : formatMoney(stats.moneySaved, settings.currency)}
            </p>
          </Card>
          <Card>
            <p className="text-xs text-muted">Минут жизни</p>
            <p className="font-display mt-1 text-xl tabular">{formatNum(stats.lifeMinutes, 0)}</p>
          </Card>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-display text-lg tracking-tight">Виджеты</h2>
            <Link to="/widget" className="text-sm text-primary">
              12 вариантов
            </Link>
          </div>
          <WidgetCard stats={stats} config={settings.widget} onAdd={() => logCigarette()} />
        </div>

        <div>
          <h2 className="font-display mb-2 text-lg tracking-tight">Сегодня по часам</h2>
          {todayLogs.length === 0 ? (
            <p className="text-sm text-muted">Пусто. Отметьте, когда выкурите — или не выкуривайте.</p>
          ) : (
            <ul className="divide-y divide-border">
              {todayLogs.map((l) => (
                <li key={l.id} className="py-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="tabular">{formatTime(l.at)}</span>
                    <button
                      type="button"
                      className="min-h-11 text-muted"
                      onClick={() => setEditTriggerId(editTriggerId === l.id ? null : l.id)}
                    >
                      {l.trigger ? triggerLabel(l.trigger) : "без пометки"}
                    </button>
                  </div>
                  {editTriggerId === l.id ? (
                    <div className="mt-2">
                      <TriggerChips
                        selected={l.trigger}
                        onSelect={(t) => {
                          setTrigger(l.id, t);
                          setEditTriggerId(null);
                        }}
                      />
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <SmokeModal
        open={factOpen}
        onOpenChange={setFactOpen}
        stats={stats}
        logId={logId}
        selected={activeLog?.trigger}
        showFact={settings.factOnLog}
        avoidFactId={lastFactId}
        onFact={setLastFactId}
        onTrigger={(t) => {
          if (logId) setTrigger(logId, t);
        }}
        onUndo={() => {
          if (logId) undoSmoke(logId);
          setFactOpen(false);
        }}
      />

      <Dialog open={confirmSoon} onOpenChange={setConfirmSoon}>
        <DialogContent>
          <DialogTitle>Слишком рано</DialogTitle>
          <p className="text-sm text-muted">
            С прошлой сигареты прошло меньше восьми минут. Часто это та же волна тяги, а не новая.
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <Button
              size="lg"
              variant="secondary"
              onClick={() => {
                setConfirmSoon(false);
                setCraveOpen(true);
              }}
            >
              Лучше подышать
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setConfirmSoon(false);
                logCigarette(DEFAULT_TRIGGER, true);
              }}
            >
              Всё равно записать
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={craveOpen} onOpenChange={setCraveOpen}>
        <DialogContent>
          <DialogTitle>Переждать тягу</DialogTitle>
          <Breathe
            totalSec={settings.cravingDelaySec}
            onDone={() => {
              addResisted();
              setCraveOpen(false);
            }}
            onSmokedAnyway={() => {
              setCraveOpen(false);
              logCigarette();
            }}
          />
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-xl bg-surface px-3 py-3 shadow-[var(--shadow-border)]">
      <div className="text-xs text-muted">{label}</div>
      <div className="font-display mt-1 text-2xl tracking-tight tabular">{value}</div>
      <div className="text-xs text-subtle">{hint}</div>
    </div>
  );
}
