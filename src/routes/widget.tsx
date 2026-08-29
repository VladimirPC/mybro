import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Breathe } from "@/components/breathe";
import { Onboarding } from "@/components/onboarding";
import { SmokeModal } from "@/components/smoke-modal";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { WidgetCard } from "@/components/widget-card";
import { useSmokeStore } from "@/lib/store";
import { DEFAULT_TRIGGER, type WidgetLayout } from "@/lib/types";
import { useStats } from "@/lib/use-stats";
import { WIDGET_PRESETS, presetById } from "@/lib/widget-presets";
import { cn } from "@/lib/utils";

type WidgetSearch = { v?: string };

export const Route = createFileRoute("/widget")({
  validateSearch: (raw: Record<string, unknown>): WidgetSearch => ({
    v: typeof raw.v === "string" ? raw.v : undefined,
  }),
  component: WidgetPage,
});

function useStandalone() {
  const [standalone, setStandalone] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(display-mode: standalone), (display-mode: fullscreen), (display-mode: minimal-ui)");
    const nav = window.navigator as Navigator & { standalone?: boolean };
    const sync = () => setStandalone(media.matches || nav.standalone === true);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);
  return standalone;
}

function WidgetPage() {
  const { v } = Route.useSearch();
  const onboarded = useSmokeStore((s) => s.onboarded);
  const complete = useSmokeStore((s) => s.completeOnboarding);
  const settings = useSmokeStore((s) => s.settings);
  const plan = useSmokeStore((s) => s.plan);
  const patchWidget = useSmokeStore((s) => s.patchWidget);
  const addSmoke = useSmokeStore((s) => s.addSmoke);
  const undoSmoke = useSmokeStore((s) => s.undoSmoke);
  const addResisted = useSmokeStore((s) => s.addResisted);
  const setTrigger = useSmokeStore((s) => s.setTrigger);
  const setLastFactId = useSmokeStore((s) => s.setLastFactId);
  const lastFactId = useSmokeStore((s) => s.lastFactId);
  const logs = useSmokeStore((s) => s.logs);
  const stats = useStats();
  const standalone = useStandalone();
  const [logId, setLogId] = useState<string | null>(null);
  const [factOpen, setFactOpen] = useState(false);
  const [craveOpen, setCraveOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  if (!onboarded) return <Onboarding onDone={complete} />;

  function log() {
    const row = addSmoke(DEFAULT_TRIGGER);
    setLogId(row.id);
    setFactOpen(true);
  }

  const pinned = presetById(v);
  const layout = (pinned?.id ?? settings.widget.layout) as WidgetLayout;
  const themeClass =
    settings.widget.theme === "paper"
      ? "widget-paper"
      : settings.widget.theme === "sage"
        ? "widget-sage"
        : "widget-night";
  const activeLog = logs.find((l) => l.id === logId);
  const config = { ...settings.widget, layout, size: pinned?.size ?? settings.widget.size };

  const modals = (
    <>
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
              log();
            }}
          />
        </DialogContent>
      </Dialog>
      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent>
          <DialogTitle>Как поставить виджет</DialogTitle>
          <div className="mt-3 space-y-3 text-sm leading-normal text-muted">
            <p>
              Сайт не может положить карточку в меню «Виджеты» Android — для этого нужен нативный APK. Здесь это
              отдельные экраны-виджеты: откройте нужный и закрепите.
            </p>
            <p>
              <span className="text-fg">Уже установлено:</span> долгий тап по иконке «Дыши» → ярлыки «Сегодня»,
              «Остаток», «Выкурить».
            </p>
            <p>
              <span className="text-fg">Или</span> откройте вариант ниже → браузерное меню → «Добавить на главный
              экран».
            </p>
          </div>
          <Button className="mt-5 w-full" onClick={() => setHelpOpen(false)}>
            Понял
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );

  if (pinned) {
    return (
      <main
        className={cn("flex min-h-dvh flex-col", themeClass)}
        style={{ background: "var(--w-bg)", color: "var(--w-fg)" }}
      >
        <div className="min-h-0 flex-1">
          <WidgetCard
            stats={stats}
            config={config}
            plan={plan}
            currency={settings.currency}
            onAdd={log}
            onCrave={() => setCraveOpen(true)}
            fill
            layout={layout}
          />
        </div>
        {!standalone ? (
          <div className="flex items-center justify-between px-5 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))] text-sm">
            <Link to="/widget" className="min-h-11 py-3" search={{}}>
              Все виджеты
            </Link>
            <button type="button" className="min-h-11 py-3 text-[color:var(--w-muted)]" onClick={() => setHelpOpen(true)}>
              На экран
            </button>
          </div>
        ) : (
          <div className="pb-[max(0.75rem,env(safe-area-inset-bottom))]" />
        )}
        {modals}
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-bg px-5 pt-8 pb-16 text-fg">
      <p className="text-xs tracking-wide text-muted uppercase">Виджеты</p>
      <h1 className="font-display mt-2 text-3xl tracking-tight">Выберите карточку</h1>
      <p className="mt-2 max-w-md text-sm text-muted">
        Откройте вариант и закрепите на рабочем столе. Настоящий виджет лаунчера сайт поставить не может — это экраны
        приложения.
      </p>
      <div className="mt-4 flex gap-2">
        <Button variant="secondary" onClick={() => setHelpOpen(true)}>
          Как закрепить
        </Button>
        <Button variant="ghost" asChild>
          <Link to="/settings">Тема</Link>
        </Button>
      </div>
      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        {WIDGET_PRESETS.map((preset) => (
          <div key={preset.id}>
            <WidgetCard
              stats={stats}
              config={{ ...config, layout: preset.id, size: preset.size }}
              plan={plan}
              currency={settings.currency}
              layout={preset.id}
              onAdd={preset.id === "plus" || preset.id === "wide" || preset.id === "full" ? log : undefined}
              onCrave={preset.id === "crave" ? () => setCraveOpen(true) : undefined}
            />
            <div className="mt-3 flex items-center justify-between gap-2">
              <div>
                <div className="text-sm">{preset.name}</div>
                <div className="text-xs text-muted">{preset.hint}</div>
              </div>
              <Button
                size="sm"
                variant={settings.widget.layout === preset.id ? "default" : "outline"}
                onClick={() => {
                  patchWidget({ layout: preset.id, size: preset.size });
                }}
              >
                {settings.widget.layout === preset.id ? "Выбран" : "Выбрать"}
              </Button>
            </div>
            <Link
              to="/widget"
              search={{ v: preset.id }}
              className="mt-2 inline-flex h-11 items-center text-sm text-primary"
            >
              Открыть на весь экран
            </Link>
          </div>
        ))}
      </div>
      {modals}
    </main>
  );
}
