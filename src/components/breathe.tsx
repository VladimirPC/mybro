import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Phase = { id: string; label: string; seconds: number };

const TECHNIQUES: { id: string; name: string; hint: string; phases: Phase[] }[] = [
  {
    id: "478",
    name: "4–7–8",
    hint: "Успокаивает нервную систему",
    phases: [
      { id: "in", label: "Вдох", seconds: 4 },
      { id: "hold", label: "Задержите", seconds: 7 },
      { id: "out", label: "Выдох", seconds: 8 },
    ],
  },
  {
    id: "box",
    name: "Квадрат",
    hint: "Ровный ритм 4–4–4–4",
    phases: [
      { id: "in", label: "Вдох", seconds: 4 },
      { id: "hold", label: "Пауза", seconds: 4 },
      { id: "out", label: "Выдох", seconds: 4 },
      { id: "rest", label: "Пауза", seconds: 4 },
    ],
  },
  {
    id: "calm",
    name: "4–6",
    hint: "Длинный выдох снимает тягу",
    phases: [
      { id: "in", label: "Вдох", seconds: 4 },
      { id: "out", label: "Выдох", seconds: 6 },
    ],
  },
];

function phaseAt(elapsed: number, phases: Phase[]) {
  const cycle = phases.reduce((s, p) => s + p.seconds, 0);
  let t = elapsed % cycle;
  for (const phase of phases) {
    if (t < phase.seconds) return { phase, left: phase.seconds - t };
    t -= phase.seconds;
  }
  return { phase: phases[0], left: phases[0].seconds };
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
  const [techId, setTechId] = useState(TECHNIQUES[0].id);
  const tech = TECHNIQUES.find((t) => t.id === techId) ?? TECHNIQUES[0];

  useEffect(() => {
    const t = window.setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => window.clearInterval(t);
  }, []);

  const { phase, left } = phaseAt(elapsed, tech.phases);
  const remain = Math.max(0, totalSec - elapsed);
  const done = remain === 0;

  return (
    <div className="flex flex-col items-center px-2 py-4 text-center">
      <p className="text-sm text-muted">Тяга длится несколько минут. Переждите волну.</p>
      <div className="mt-3 flex w-full gap-1">
        {TECHNIQUES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTechId(t.id)}
            className={cn(
              "min-h-11 flex-1 rounded-xl px-2 text-xs",
              t.id === techId ? "bg-primary text-bg" : "bg-surface-2 text-muted",
            )}
          >
            {t.name}
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-subtle">{tech.hint}</p>
      <div className="relative mt-6 mb-6 flex size-52 items-center justify-center">
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
