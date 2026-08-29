import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout";
import { Card, CardHint, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FACTS, KIND_LABEL } from "@/lib/facts";
import { formatDuration } from "@/lib/format";
import { RECOVERY, minutesSince, recoveryProgress } from "@/lib/recovery";
import { useStats } from "@/lib/use-stats";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/health")({ component: HealthPage });

function HealthPage() {
  const stats = useStats();
  const sinceLast = stats.lastAt ? minutesSince(stats.lastAt, stats.now) : minutesSince(stats.startAt, stats.now);
  const neverSmokedLogged = stats.total === 0;
  const progress = recoveryProgress(neverSmokedLogged ? minutesSince(stats.startAt, stats.now) : sinceLast);

  return (
    <AppShell title="Тело и факты">
      <div className="page-enter space-y-4">
        <Card>
          <CardHint>{neverSmokedLogged ? "С начала учёта" : "С последней сигареты"}</CardHint>
          <p className="font-display mt-1 text-3xl tracking-tight">{formatDuration(sinceLast)}</p>
          {progress.next ? (
            <p className="mt-2 text-sm text-muted">
              Следующая отметка: {progress.next.title}. {progress.next.body}
            </p>
          ) : (
            <p className="mt-2 text-sm text-muted">Вы уже за последней отметкой в этом списке. Держитесь.</p>
          )}
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${Math.round(progress.fraction * 100)}%` }}
            />
          </div>
        </Card>

        <Tabs defaultValue="recovery">
          <TabsList className="w-full">
            <TabsTrigger value="recovery">После отказа</TabsTrigger>
            <TabsTrigger value="facts">Справки</TabsTrigger>
          </TabsList>
          <TabsContent value="recovery" className="mt-4 space-y-2">
            {RECOVERY.map((m) => {
              const done = (neverSmokedLogged ? minutesSince(stats.startAt, stats.now) : sinceLast) >= m.afterMin;
              return (
                <Card key={m.title} className={cn(!done && "opacity-70")}>
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-base">{m.title}</CardTitle>
                    <span className={cn("text-xs", done ? "text-ok" : "text-subtle")}>
                      {done ? "доступно" : "если остановиться"}
                    </span>
                  </div>
                  <CardHint className="mt-2">{m.body}</CardHint>
                </Card>
              );
            })}
          </TabsContent>
          <TabsContent value="facts" className="mt-4 space-y-2">
            {FACTS.map((f) => (
              <Card key={f.id}>
                <p className="text-xs tracking-wide text-primary uppercase">
                  {KIND_LABEL[f.kind]} · {f.source}
                </p>
                <CardTitle className="mt-1 text-lg">{f.title}</CardTitle>
                <CardHint className="mt-2">{f.body}</CardHint>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
