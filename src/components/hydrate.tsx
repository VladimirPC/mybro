import { useEffect, useState, type ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { CloudSync } from "@/components/cloud-sync";
import { NativeWidgetBridge } from "@/components/native-widget-bridge";
import { Onboarding } from "@/components/onboarding";
import { RegisterSw } from "@/components/register-sw";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { flushCloud, stopCloudSync } from "@/lib/sync";
import { useSmokeStore } from "@/lib/store";
import { cn } from "@/lib/utils";

function Splash({ text }: { text: string }) {
  return (
    <div className="grid min-h-dvh place-items-center bg-bg px-6 text-fg">
      <div className="text-center">
        <p className="font-display text-3xl tracking-tight">Дыши</p>
        <p className="mt-2 text-sm text-muted">{text}</p>
      </div>
    </div>
  );
}

export function HydrateGate({ children }: { children: ReactNode }) {
  const hydrated = useSmokeStore((s) => s.hydrated);
  const onboarded = useSmokeStore((s) => s.onboarded);
  const complete = useSmokeStore((s) => s.completeOnboarding);
  const resetAll = useSmokeStore((s) => s.resetAll);
  const fontScale = useSmokeStore((s) => s.settings.fontScale);
  const { user, isPending } = useCurrentUserState();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const onLogin = pathname.startsWith("/login");
  const [savingPlan, setSavingPlan] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.style.setProperty("--text-scale", String(fontScale ?? 1.35));
  }, [fontScale]);

  useEffect(() => {
    if (isPending) return;
    if (!user || user.isDevFallback) {
      stopCloudSync();
      resetAll();
      useSmokeStore.getState().setHydrated();
    }
  }, [user, isPending, resetAll]);

  if (onLogin) {
    if (!isPending && user && !user.isDevFallback) return <RedirectToSignIn to="/" />;
    return <>{children}</>;
  }
  if (isPending) return <Splash text="Проверяем вход…" />;
  if (!user || user.isDevFallback) return <RedirectToSignIn />;

  return (
    <div className={cn("min-h-dvh", !hydrated && "pointer-events-none")} aria-busy={!hydrated}>
      <CloudSync />
      <NativeWidgetBridge />
      <RegisterSw />
      {!hydrated ? (
        <Splash text="Загружаем ваш учёт из аккаунта…" />
      ) : !onboarded ? (
        <Onboarding
          onDone={(input) => {
            complete(input);
            setSavingPlan(true);
            setSaveError(null);
            void (async () => {
              try {
                await flushCloud();
              } catch {
                setSaveError("План на экране есть, но в аккаунт пока не ушёл. Проверьте сеть — сохраним ещё раз.");
                try {
                  await flushCloud();
                } catch {
                  /* status is in cloud-status */
                }
              } finally {
                setSavingPlan(false);
              }
            })();
          }}
        />
      ) : savingPlan ? (
        <Splash text="Сохраняем план в аккаунт…" />
      ) : (
        <>
          {saveError ? (
            <p className="bg-danger/15 px-4 py-2 text-center text-xs text-danger">{saveError}</p>
          ) : null}
          {children}
        </>
      )}
    </div>
  );
}
