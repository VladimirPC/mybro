import { useEffect } from "react";
import { isNativeApp } from "@/lib/native-widgets";

export function RegisterSw() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (window !== window.parent) return;
    if (isNativeApp()) return;
    void navigator.serviceWorker.register("/sw.js");
  }, []);
  return null;
}