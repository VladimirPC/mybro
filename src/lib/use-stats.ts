import { useEffect, useMemo, useState } from "react";
import { computeStats } from "@/lib/stats";
import { useSmokeStore } from "@/lib/store";

export function useStats() {
  const logs = useSmokeStore((s) => s.logs);
  const resisted = useSmokeStore((s) => s.resisted);
  const settings = useSmokeStore((s) => s.settings);
  const plan = useSmokeStore((s) => s.plan);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(t);
  }, []);

  return useMemo(
    () => computeStats(logs, resisted, settings, plan, now),
    [logs, resisted, settings, plan, now],
  );
}
