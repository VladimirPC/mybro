import { useEffect, useMemo } from "react";
import { TriggerChips } from "@/components/trigger-chips";
import { KIND_LABEL, pickFact, type Fact } from "@/lib/facts";
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
  const fact: Fact | null = useMemo(
    () => (showFact !== false && logId ? pickFact(logId, avoidFactId) : null),
    // Pick once per cigarette so updating lastFactId does not reshuffle the card.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [logId, showFact],
  );
  const over = stats.overLimit;
  const next = recoveryProgress(0).next;

  useEffect(() => {
    if (open && fact) onFact(fact.id);
  }, [open, fact, onFact]);

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

        {fact ? (
          <div className="mt-4 rounded-xl bg-surface-2 p-4">
            <p className="text-xs tracking-wide text-primary uppercase">
              {KIND_LABEL[fact.kind]} · {fact.source}
            </p>
            <p className="font-display mt-1 text-lg tracking-tight">{fact.title}</p>
            <p className="mt-2 text-sm leading-normal text-muted">{fact.body}</p>
          </div>
        ) : null}

        {next ? (
          <p className="mt-3 text-sm leading-normal text-muted">
            Если остановиться сейчас, через {next.title.toLowerCase()} — {next.body}
          </p>
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
      </DialogContent>
    </Dialog>
  );
}
