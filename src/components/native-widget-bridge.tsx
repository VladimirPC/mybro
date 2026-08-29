import { useEffect } from "react";
import { consumeNativePending, isNativeApp, pushNativeWidgets } from "@/lib/native-widgets";
import { useSmokeStore } from "@/lib/store";
import { useStats } from "@/lib/use-stats";

export function NativeWidgetBridge() {
  const hydrated = useSmokeStore((s) => s.hydrated);
  const addSmoke = useSmokeStore((s) => s.addSmoke);
  const stats = useStats();

  useEffect(() => {
    if (!hydrated || !isNativeApp()) return;
    void pushNativeWidgets({
      today: stats.today,
      remain: stats.remaining,
      limit: stats.limit,
      lastAt: stats.lastAt,
      resistedToday: stats.resistedToday,
      overLimit: stats.overLimit,
    });
  }, [hydrated, stats.today, stats.remaining, stats.limit, stats.lastAt, stats.resistedToday, stats.overLimit]);

  useEffect(() => {
    if (!isNativeApp()) return;
    let remove: (() => void) | undefined;
    void (async () => {
      const { App } = await import("@capacitor/app");
      const { StatusBar, Style } = await import("@capacitor/status-bar");
      try {
        await StatusBar.setBackgroundColor({ color: "#0c0d0c" });
        await StatusBar.setStyle({ style: Style.Dark });
      } catch {
        /* web */
      }
      const apply = async () => {
        const pending = await consumeNativePending();
        if (pending.log) addSmoke();
      };
      await apply();
      const handle = await App.addListener("resume", () => {
        void apply();
      });
      remove = () => {
        void handle.remove();
      };
    })();
    return () => remove?.();
  }, [addSmoke]);

  return null;
}
