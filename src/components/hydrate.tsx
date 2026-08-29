import { useEffect, type ReactNode } from "react";
import { CloudSync } from "@/components/cloud-sync";
import { NativeWidgetBridge } from "@/components/native-widget-bridge";
import { RegisterSw } from "@/components/register-sw";
import { rehydrateStore, useSmokeStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function HydrateGate({ children }: { children: ReactNode }) {
  const hydrated = useSmokeStore((s) => s.hydrated);
  const fontScale = useSmokeStore((s) => s.settings.fontScale);

  useEffect(() => {
    rehydrateStore();
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty("--text-scale", String(fontScale ?? 1.35));
  }, [fontScale]);

  return (
    <div className={cn("min-h-dvh", !hydrated && "pointer-events-none")} aria-busy={!hydrated}>
      <CloudSync />
      <NativeWidgetBridge />
      <RegisterSw />
      {children}
    </div>
  );
}
