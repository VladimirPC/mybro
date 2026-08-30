import { useEffect, type ReactNode } from "react";
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

  if (isPending) return <Splash text="Проверяем вход…" />;
  if (!user) {
    if (onLogin) return <>{children}</>;
    return <RedirectToSignIn />;
  }

  return (
    <div className={cn("min-h-dvh", !hydrated && "pointer-events-none")} aria-busy={!hydrated}>
      <CloudSync />
      <NativeWidgetBridge />
      <RegisterSw />
      {!hydrated ? (
        <Splash text="Загружаем ваш учёт из аккаунта…" />
      ) : !onboarded && !onLogin ? (
        <Onboarding
          onDone={(input) => {
            complete(input);
            void flushCloud().catch(() => undefined);
          }}
        />
      ) : (
        children
      )}
    </div>
  );
}
