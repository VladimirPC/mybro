import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { cigWord, dayWord, formatNum } from "@/lib/format";
import type { OnboardingInput } from "@/lib/types";
import { cn } from "@/lib/utils";

const STEPS = ["Привет", "Сколько", "План", "Зачем"];

export function Onboarding({ onDone }: { onDone: (input: OnboardingInput) => void }) {
  const [step, setStep] = useState(0);
  const [baseline, setBaseline] = useState(15);
  const [startLimit, setStartLimit] = useState(14);
  const [stepSize, setStepSize] = useState(1);
  const [stepDays, setStepDays] = useState(7);
  const [target, setTarget] = useState(0);
  const [reason, setReason] = useState("");
  const [price, setPrice] = useState("250");

  const weeks = stepSize > 0 ? Math.ceil((startLimit - target) / stepSize) * stepDays / 7 : 0;

  function next() {
    if (step === 1 && startLimit > baseline) setStartLimit(baseline);
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  }

  function finish(useDemo: boolean) {
    const packPrice = Number(price.replace(",", "."));
    onDone({
      baselinePerDay: baseline,
      startLimit: Math.min(startLimit, baseline),
      stepSize,
      stepDays,
      targetLimit: target,
      reason: reason.trim(),
      packPrice: Number.isFinite(packPrice) && packPrice > 0 ? packPrice : null,
      useDemo,
    });
  }

  return (
    <div className="grid min-h-dvh place-items-center px-5 py-8">
    <main className="flex w-full max-w-lg flex-col">
      <div className="flex gap-1.5">
        {STEPS.map((name, i) => (
          <div key={name} className={cn("h-1 flex-1 rounded-full", i <= step ? "bg-primary" : "bg-surface-2")} />
        ))}
      </div>

      {step === 0 ? (
        <div className="page-enter mt-10 flex flex-1 flex-col">
          <p className="text-sm tracking-wide text-muted uppercase">Счётчик и план снижения</p>
          <h1 className="font-display mt-3 text-4xl leading-tight tracking-tight">Дыши. Чуть меньше — уже сегодня.</h1>
          <p className="mt-4 text-base leading-normal text-muted">
            Вы вошли. План заполняется один раз и сохраняется в аккаунте — на любом телефоне те же цифры. Не героический
            понедельник: сначала честный учёт, потом лимит чуть ниже среднего.
          </p>
          <div className="mt-8 space-y-3 text-sm text-muted">
            <p>Каждая сигарета — время, триггер и справка о вреде.</p>
            <p>Среднее считается за все дни учёта: сумма делится на число дней, даже пустых.</p>
            <p>Виджет настраивается и открывается отдельным экраном для главного экрана.</p>
          </div>
          <div className="mt-auto pt-8">
            <Button size="lg" className="w-full" onClick={next}>
              Начать
            </Button>
          </div>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="page-enter mt-10 flex flex-1 flex-col">
          <h1 className="font-display text-3xl tracking-tight">Сколько сейчас в день?</h1>
          <p className="mt-2 text-sm text-muted">Честная цифра, не «хорошая». От неё пойдёт среднее и первый лимит.</p>
          <div className="mt-10 text-center">
            <div className="font-display text-6xl tracking-tight tabular">{baseline}</div>
            <div className="mt-1 text-muted">{cigWord(baseline)} в сутки</div>
          </div>
          <Slider
            className="mt-10"
            min={1}
            max={40}
            step={1}
            value={[baseline]}
            onValueChange={(v) => {
              const n = v[0] ?? 15;
              setBaseline(n);
              if (startLimit > n) setStartLimit(Math.max(0, n - 1));
            }}
          />
          <div className="mt-auto pt-8">
            <Button size="lg" className="w-full" onClick={next}>
              Дальше
            </Button>
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="page-enter mt-10 flex flex-1 flex-col">
          <h1 className="font-display text-3xl tracking-tight">Лимит и спуск</h1>
          <p className="mt-2 text-sm text-muted">
            Первый потолок чуть ниже обычного. Дальше приложение само снижает его на заданный шаг.
          </p>

          <div className="mt-8 space-y-6">
            <div>
              <div className="mb-3 flex justify-between text-sm">
                <span className="text-muted">Лимит на старте</span>
                <span className="tabular">{startLimit}</span>
              </div>
              <Slider min={0} max={baseline} step={1} value={[startLimit]} onValueChange={(v) => setStartLimit(v[0] ?? 0)} />
            </div>
            <div>
              <div className="mb-3 flex justify-between text-sm">
                <span className="text-muted">Снижать на</span>
                <span className="tabular">
                  {stepSize} каждые {stepDays} {dayWord(stepDays)}
                </span>
              </div>
              <div className="flex gap-2">
                {[1, 2].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setStepSize(n)}
                    className={cn(
                      "h-10 flex-1 rounded-lg text-sm shadow-[var(--shadow-border)]",
                      stepSize === n && "bg-surface-2 text-primary",
                    )}
                  >
                    −{n}
                  </button>
                ))}
                {[3, 7, 14].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setStepDays(n)}
                    className={cn(
                      "h-10 flex-1 rounded-lg text-sm shadow-[var(--shadow-border)]",
                      stepDays === n && "bg-surface-2 text-primary",
                    )}
                  >
                    {n}д
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-3 flex justify-between text-sm">
                <span className="text-muted">Цель</span>
                <span className="tabular">{target === 0 ? "ноль — бросить" : target}</span>
              </div>
              <Slider min={0} max={Math.max(0, startLimit)} step={1} value={[target]} onValueChange={(v) => setTarget(v[0] ?? 0)} />
            </div>
            <p className="text-sm text-muted">
              При таком темпе цель около {formatNum(weeks, 0)} {weeks === 1 ? "недели" : "недель"}. Это не приговор —
              темп можно менять.
            </p>
          </div>
          <div className="mt-auto pt-8">
            <Button size="lg" className="w-full" onClick={next}>
              Дальше
            </Button>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="page-enter mt-10 flex flex-1 flex-col">
          <h1 className="font-display text-3xl tracking-tight">Зачем вам это</h1>
          <p className="mt-2 text-sm text-muted">Коротко, своими словами. Напомним в тяжёлый день. Можно пропустить.</p>
          <Label className="mt-6" htmlFor="reason">
            Причина
          </Label>
          <Input
            id="reason"
            className="mt-2"
            placeholder="Спокойно дышать, дети, спорт, зубы…"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <Label className="mt-5" htmlFor="price">
            Цена пачки, необязательно
          </Label>
          <Input
            id="price"
            className="mt-2"
            inputMode="decimal"
            placeholder="250"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          <p className="mt-2 text-xs text-subtle">Считаем потраченное и сэкономленное относительно старой нормы.</p>
          <div className="mt-auto flex flex-col gap-2 pt-8">
            <Button size="lg" className="w-full" onClick={() => finish(false)}>
              Начать с сегодня
            </Button>
            <Button variant="secondary" size="lg" className="w-full" onClick={() => finish(true)}>
              Посмотреть на примере
            </Button>
          </div>
        </div>
      ) : null}
    </main>
    </div>
  );
}
