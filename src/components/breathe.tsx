import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const PHASES = [
  { id: "in", label: "Вдох", seconds: 4 },
  { id: "hold", label: "Задержите", seconds: 7 },
  { id: "out", label: "Выдох", seconds: 8 },
] as const;

const CYCLE = PHASES.reduce((s, p) => s + p.seconds, 0);

function phaseAt(elapsed: number) {
  let t = elapsed % CYCLE;
  for (const phase of PHASES) {
    if (t < phase.seconds) return { phase, left: phase.seconds - t };
    t -= phase.seconds;
  }
  return { phase: PHASES[0], left: PHASES[0].seconds };
}

export function Breathe({
  totalSec,
  onDone,
  onSmokedAnyway,
}: {
  totalSec: number;
  onDone: (resisted: boolean) => void;
  onSmokedAnyway: () => void;
}) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const t = window.setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => window.clearInterval(t);
  }, []);

  const { phase, left } = phaseAt(elapsed);
  const remain = Math.max(0, totalSec - elapsed);
  const done = remain === 0;

  return (
    <div className="flex flex-col items-center px-2 py-4 text-center">
      <p className="text-sm text-muted">Тяга длится несколько минут. Переждите волну.</p>
      <div className="relative mt-8 mb-6 flex size-52 items-center justify-center">
        <div className="absolute size-52 rounded-full bg-surface-2" />
        <div className="breathe-orb absolute size-40 rounded-full bg-primary/30" />
        <div className="relative">
          <div className="font-display text-3xl tracking-tight">{phase.label}</div>
          <div className="mt-1 text-sm text-muted tabular">{left} с</div>
        </div>
      </div>
      <p className="text-xs text-subtle tabular">{done ? "Волна прошла" : `ещё ${remain} с`}</p>
      <div className="mt-6 flex w-full flex-col gap-2">
        <Button onClick={() => onDone(true)} size="lg">
          {done ? "Справился" : "Тяга прошла"}
        </Button>
        <Button variant="ghost" onClick={onSmokedAnyway}>
          Всё равно выкурил
        </Button>
      </div>
    </div>
  );
}
