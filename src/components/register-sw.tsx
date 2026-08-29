import { useEffect } from "react";

export function RegisterSw() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (window !== window.parent) return;
    void navigator.serviceWorker.register("/sw.js");
  }, []);
  return null;
}
