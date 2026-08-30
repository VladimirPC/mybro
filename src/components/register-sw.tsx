import { useEffect } from "react";
import { isNativeApp } from "@/lib/native-widgets";

export function RegisterSw() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (window !== window.parent) return;

    // Capacitor WebView: an old SW kept the localStorage build and empty widgets.
    if (isNativeApp()) {
      void (async () => {
        try {
          const regs = await navigator.serviceWorker.getRegistrations();
          await Promise.all(regs.map((r) => r.unregister()));
          if ("caches" in window) {
            const keys = await caches.keys();
            await Promise.all(keys.map((k) => caches.delete(k)));
          }
        } catch {
          /* ignore */
        }
      })();
      return;
    }

    void navigator.serviceWorker.register("/sw.js?v=4");
  }, []);
  return null;
}
