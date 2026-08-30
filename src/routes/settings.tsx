import type { ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout";
import { WidgetCard } from "@/components/widget-card";
import { Button } from "@/components/ui/button";
import { Card, CardHint, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { exportSnapshot, useSmokeStore } from "@/lib/store";
import { FONT_SCALE_MAX, FONT_SCALE_MIN, type WidgetLayout } from "@/lib/types";
import { WIDGET_PRESETS, WIDGET_THEMES } from "@/lib/widget-presets";
import { useStats } from "@/lib/use-stats";
import { CloudStatusLine } from "@/components/cloud-status";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({ component: SettingsPage });

function SettingsPage() {
  const settings = useSmokeStore((s) => s.settings);
  const plan = useSmokeStore((s) => s.plan);
  const patchSettings = useSmokeStore((s) => s.patchSettings);
  const patchWidget = useSmokeStore((s) => s.patchWidget);
  const loadDemo = useSmokeStore((s) => s.loadDemo);
  const resetAll = useSmokeStore((s) => s.resetAll);
  const importSnapshot = useSmokeStore((s) => s.importSnapshot);
  const stats = useStats();
  const scalePct = Math.round((settings.fontScale || 1.35) * 100);
  const { user, isPending } = useCurrentUserState();

  function download() {
    const blob = new Blob([exportSnapshot()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dishi-backup.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AppShell title="Настройки">
      <div className="page-enter space-y-4">
        <Card>
          <CardTitle>Облако</CardTitle>
          {isPending ? (
            <div className="mt-3 h-10 animate-pulse rounded-lg bg-surface-2" />
          ) : user ? (
            <>
              <CardHint className="mt-1">
                Учёт хранится только в аккаунте, не на телефоне. На другом устройстве войдите тем же Google — цифры те же.
                Друг ведёт свои, вы смотрите в «Круге».
              </CardHint>
              <div className="mt-3">
                <CloudStatusLine />
              </div>
              <div className="mt-4">
                <UserButton />
              </div>
              <Link to="/circle" className="mt-3 inline-flex h-11 items-center text-sm text-primary">
                Код связи и прогресс друга
              </Link>
            </>
          ) : (
            <>
              <CardHint className="mt-1">
                Без входа учёта нет. Войдите через Google — счётчик сохранится в аккаунте.
              </CardHint>
              <Button className="mt-4" asChild>
                <Link to="/login">Войти или создать аккаунт</Link>
              </Button>
            </>
          )}
        </Card>

        <Card>
          <CardTitle>Текст</CardTitle>
          <CardHint className="mt-1">Крупнее или мельче по всему приложению — заголовки и обычный текст вместе.</CardHint>
          <div className="mt-4">
            <div className="mb-2 flex justify-between text-sm">
              <span className="text-muted">Размер шрифта</span>
              <span className="tabular">{scalePct}%</span>
            </div>
            <Slider
              min={Math.round(FONT_SCALE_MIN * 100)}
              max={Math.round(FONT_SCALE_MAX * 100)}
              step={5}
              value={[scalePct]}
              onValueChange={(v) => patchSettings({ fontScale: (v[0] ?? 100) / 100 })}
            />
            <p className="mt-3 font-display text-xl tracking-tight">Дыши</p>
            <p className="mt-1 text-sm text-muted">Образец: сегодня осталось меньше, чем вчера.</p>
          </div>
        </Card>

        <Card>
          <CardTitle>Учёт</CardTitle>
          <div className="mt-4 space-y-4">
            <Row label="Справка после каждой сигареты">
              <Switch
                checked={settings.factOnLog}
                onCheckedChange={(v) => patchSettings({ factOnLog: v })}
              />
            </Row>
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-muted">Пауза при тяге</span>
                <span className="tabular">{settings.cravingDelaySec} с</span>
              </div>
              <Slider
                min={30}
                max={300}
                step={15}
                value={[settings.cravingDelaySec]}
                onValueChange={(v) => patchSettings({ cravingDelaySec: v[0] ?? 90 })}
              />
            </div>
            <div>
              <Label htmlFor="pack">Сигарет в пачке</Label>
              <Input
                id="pack"
                className="mt-2"
                inputMode="numeric"
                value={settings.packSize}
                onChange={(e) => patchSettings({ packSize: Math.max(1, Number(e.target.value) || 20) })}
              />
            </div>
            <div>
              <Label htmlFor="price">Цена пачки</Label>
              <Input
                id="price"
                className="mt-2"
                inputMode="decimal"
                value={settings.packPrice ?? ""}
                onChange={(e) => {
                  const n = Number(e.target.value.replace(",", "."));
                  patchSettings({ packPrice: Number.isFinite(n) && n > 0 ? n : null });
                }}
              />
            </div>
            <div>
              <Label>Валюта</Label>
              <div className="mt-2 flex gap-2">
                {(["₽", "$", "€"] as const).map((c) => (
                  <Button
                    key={c}
                    variant={settings.currency === c ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => patchSettings({ currency: c })}
                  >
                    {c}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="reason">Зачем бросаете</Label>
              <Input
                id="reason"
                className="mt-2"
                value={settings.reason}
                onChange={(e) => patchSettings({ reason: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="base">Было в день до учёта</Label>
              <Input
                id="base"
                className="mt-2"
                inputMode="numeric"
                value={settings.baselinePerDay ?? ""}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  patchSettings({ baselinePerDay: Number.isFinite(n) && n > 0 ? n : null });
                }}
              />
            </div>
          </div>
        </Card>

        <Card>
          <CardTitle>Без адресной строки</CardTitle>
          <CardHint className="mt-1">
            Файл Digital Asset Links уже на сайте (`/.well-known/assetlinks.json`). Откройте эту ссылку в Chrome на
            телефоне — должен показаться JSON с package_name. Затем удалите старый APK и поставьте тот же файл заново.
            Полоска с адресом пропадает не сразу: Chrome кэширует проверку.
          </CardHint>
        </Card>

        <Card>
          <CardTitle>Виджеты</CardTitle>
          <CardHint className="mt-1">
            12 карточек: сегодня, остаток, кольцо, кнопка «+», последняя, широкий, сводка, деньги, время жизни, план,
            тяга и полный экран. Откройте «Виджеты» и закрепите нужную. Меню «Виджеты» лаунчера сайт заполнить не
            может.
          </CardHint>
          <div className="mt-4">
            <p className="mb-2 text-sm text-muted">Тема</p>
            <div className="flex gap-2">
              {WIDGET_THEMES.map((theme) => (
                <Button
                  key={theme.id}
                  variant={settings.widget.theme === theme.id ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => patchWidget({ theme: theme.id })}
                >
                  {theme.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {WIDGET_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => patchWidget({ layout: preset.id as WidgetLayout, size: preset.size })}
                className={cn(
                  "min-h-11 rounded-lg px-3 py-2 text-left text-sm shadow-[var(--shadow-border)]",
                  settings.widget.layout === preset.id && "bg-surface-2 text-primary",
                )}
              >
                {preset.name}
              </button>
            ))}
          </div>
          <div className="mt-5">
            <WidgetCard stats={stats} config={settings.widget} plan={plan} currency={settings.currency} />
          </div>
          <Link to="/widget" className="mt-4 inline-flex h-11 items-center text-sm text-primary">
            Галерея виджетов
          </Link>
        </Card>

        <Card>
          <CardTitle>Данные</CardTitle>
          <CardHint className="mt-1">Хранятся только на этом устройстве.</CardHint>
          <div className="mt-4 flex flex-col gap-2">
            <Button variant="secondary" onClick={download}>
              Скачать копию
            </Button>
            <label className="inline-flex h-11 cursor-pointer items-center justify-center rounded-lg bg-surface-2 text-sm font-medium">
              Загрузить копию
              <input
                type="file"
                accept="application/json"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const text = await file.text();
                  importSnapshot(text);
                }}
              />
            </label>
            <Button variant="outline" onClick={loadDemo}>
              Заполнить примером
            </Button>
            <Button variant="ghost" onClick={resetAll}>
              Сбросить всё и пройти заново
            </Button>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm">{label}</span>
      {children}
    </div>
  );
}
