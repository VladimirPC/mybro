import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHint, CardTitle } from "@/components/ui/card";
import { isNativeApp } from "@/lib/native-widgets";
import { cn } from "@/lib/utils";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone() {
  if (typeof window === "undefined") return false;
  const media = window.matchMedia("(display-mode: standalone), (display-mode: fullscreen), (display-mode: minimal-ui)");
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return media.matches || nav.standalone === true;
}

export function useAppChrome() {
  const [standalone, setStandalone] = useState(false);
  const [assetOk, setAssetOk] = useState<boolean | null>(null);
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(display-mode: standalone), (display-mode: fullscreen), (display-mode: minimal-ui)");
    const sync = () => setStandalone(isStandalone());
    sync();
    media.addEventListener("change", sync);
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    void fetch("/.well-known/assetlinks.json", { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) {
          setAssetOk(false);
          return;
        }
        const data = (await res.json()) as { target?: { package_name?: string } }[];
        setAssetOk(Array.isArray(data) && data.some((row) => row?.target?.package_name === "me.grok.mybrobreathe.twa"));
      })
      .catch(() => setAssetOk(false));
    return () => {
      media.removeEventListener("change", sync);
      window.removeEventListener("beforeinstallprompt", onPrompt);
    };
  }, []);

  return { standalone, assetOk, installEvent };
}

export function InstallApp({ compact = false }: { compact?: boolean }) {
  const { standalone, assetOk, installEvent } = useAppChrome();
  const native = isNativeApp();

  async function installPwa() {
    if (!installEvent) return;
    await installEvent.prompt();
  }

  if (native) {
    if (compact) return null;
    return (
      <Card>
        <CardTitle>Нативное приложение</CardTitle>
        <CardHint className="mt-1">
          Это оболочка Capacitor без адресной строки. Виджеты рабочего стола: долгий тап по пустому месту → «Виджеты» →
          «Дыши» — сегодня, остаток, выкурить и сводка.
        </CardHint>
      </Card>
    );
  }

  if (standalone) {
    if (compact) return null;
    return (
      <Card>
        <CardTitle>Как приложение</CardTitle>
        <CardHint className="mt-1">Сейчас открыто без адресной строки. Долгий тап по иконке «Дыши» на рабочем столе — ярлыки Сегодня, Остаток, Выкурить и Тяга.</CardHint>
      </Card>
    );
  }

  return (
    <Card className={cn(compact && "bg-surface")}>
      <CardTitle>{compact ? "Убрать строку браузера" : "Полноценное приложение"}</CardTitle>
      <CardHint className="mt-1">
        Сайт в Chrome всегда показывает адрес. Без полоски нужен установленный APK (TWA) или ярлык «Добавить на главный экран».
      </CardHint>
      <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-muted">
        <li>
          Файл связи с Android:{" "}
          {assetOk === null ? "проверяем…" : assetOk ? (
            <span className="text-ok">на этом адресе есть</span>
          ) : (
            <span className="text-danger">на этом адресе нет — опубликуйте сайт, с которого ставили APK</span>
          )}
          . Откройте{" "}
          <a className="text-primary" href="/.well-known/assetlinks.json">
            /.well-known/assetlinks.json
          </a>
          — должен быть JSON с пакетом <span className="text-fg">me.grok.mybrobreathe.twa</span>.
        </li>
        <li>Удалите старый APK «Дыши» с телефона.</li>
        <li>Поставьте тот же файл заново и откройте именно иконку приложения, не вкладку Chrome.</li>
        <li>Полоска может держаться до суток: Chrome кэширует проверку. Перезапуск телефона ускоряет.</li>
      </ol>
      <div className="mt-4 flex flex-col gap-2">
        {installEvent ? (
          <Button size="lg" className="w-full" onClick={() => void installPwa()}>
            Установить ярлык на экран
          </Button>
        ) : (
          <p className="text-sm text-muted">
            В Chrome: меню → «Добавить на главный экран» / «Установить приложение».
          </p>
        )}
      </div>
      <p className="mt-3 text-xs text-subtle">
        Настоящие виджеты лаунчера есть в нативном APK Capacitor (`me.grok.mybro`). Текущий TWA их не ставит.
      </p>
    </Card>
  );
}
