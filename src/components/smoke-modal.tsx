import { useEffect, useMemo } from "react";
import { TriggerChips } from "@/components/trigger-chips";
import { KIND_LABEL, pickBenefitFact, pickHarmFact, type Fact } from "@/lib/facts";
import { cigWord, formatNum } from "@/lib/format";
import { recoveryProgress } from "@/lib/recovery";
import type { AppStats } from "@/lib/stats";
import type { TriggerId } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

export function SmokeModal({
  open,
  onOpenChange,
  stats,
  logId,
  selected,
  showFact,
  avoidFactId,
  onFact,
  onTrigger,
  onUndo,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  stats: AppStats;
  logId: string | null;
  selected?: TriggerId | null;
  showFact?: boolean;
  avoidFactId: string | null;
  onFact: (id: string) => void;
  onTrigger: (id: TriggerId) => void;
  onUndo: () => void;
}) {
  const benefit: Fact | null = useMemo(
    () => (showFact !== false && logId ? pickBenefitFact(logId, avoidFactId) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [logId, showFact],
  );
  const harm: Fact | null = useMemo(
    () => (showFact !== false && logId ? pickHarmFact(logId, benefit?.id) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [logId, showFact],
  );
  const over = stats.overLimit;
  const next = recoveryProgress(0).next;

  useEffect(() => {
    if (open && benefit) onFact(benefit.id);
  }, [open, benefit, onFact]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <p className="text-xs tracking-wide text-muted uppercase">
          {over ? "Лимит на сегодня превышен" : "Отмечено"}
        </p>
        <DialogTitle className={over ? "text-danger" : undefined}>
          {stats.today} {cigWord(stats.today)} сегодня
        </DialogTitle>
        <DialogDescription>
          {stats.limit != null
            ? over
              ? `Лимит был ${stats.limit}. Следующая — уже сверх плана снижения.`
              : `Лимит ${stats.limit}, осталось ${stats.remaining}. Среднее за ${stats.daysTracked} дн. — ${formatNum(stats.allTimeAvg)}.`
            : `Среднее за все дни учёта: ${formatNum(stats.allTimeAvg)} в сутки.`}
        </DialogDescription>

        {benefit ? (
          <div className="mt-4 rounded-xl bg-surface-2 p-4">
            <p className="text-xs tracking-wide text-primary uppercase">
              {KIND_LABEL[benefit.kind]} · {benefit.source}
            </p>
            <p className="font-display mt-1 text-lg tracking-tight">{benefit.title}</p>
            <p className="mt-2 text-sm leading-normal text-muted">{benefit.body}</p>
            {next ? (
              <p className="mt-3 text-sm leading-normal text-fg">
                Если остановиться сейчас, через {next.title.toLowerCase()} — {next.body}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-4">
          <p className="text-sm text-muted">Почему выкурили?</p>
          <p className="mt-0.5 text-xs text-subtle">По умолчанию — работа. Нажмите, чтобы сменить.</p>
          <div className="mt-3">
            <TriggerChips selected={selected} onSelect={onTrigger} />
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <Button className="flex-1" onClick={() => onOpenChange(false)}>
            Понял
          </Button>
          <Button variant="ghost" onClick={onUndo}>
            Отменить
          </Button>
        </div>

        {harm ? (
          <p className="mt-4 text-[11px] leading-snug text-subtle">
            Вред: {harm.title}. {harm.body} ({harm.source})
          </p>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
