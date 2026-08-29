import { pullMyState, pushMyState, type CloudSnapshot } from "@/lib/cloud";
import { useSmokeStore } from "@/lib/store";

function takeSnapshot(): CloudSnapshot {
  const s = useSmokeStore.getState();
  return {
    onboarded: s.onboarded,
    logs: s.logs,
    resisted: s.resisted,
    settings: s.settings,
    plan: s.plan,
    lastFactId: s.lastFactId,
  };
}

function hashSnap(s: CloudSnapshot) {
  return JSON.stringify({
    onboarded: s.onboarded,
    lastFactId: s.lastFactId,
    logs: s.logs,
    resisted: s.resisted,
    settings: s.settings,
    plan: s.plan,
  });
}

let lastHash = "";
let timer: ReturnType<typeof setTimeout> | null = null;
let unsub: (() => void) | null = null;
let syncing = false;

export async function startCloudSync(name: string) {
  if (syncing) return;
  syncing = true;
  try {
    const remote = await pullMyState();
    const local = takeSnapshot();
    if (remote?.onboarded) {
      useSmokeStore.getState().replaceSnapshot(remote);
      lastHash = hashSnap(remote);
    } else if (local.onboarded) {
      lastHash = hashSnap(local);
      await pushMyState({ data: { ...local, name } });
    } else {
      lastHash = hashSnap(local);
    }
  } catch {
    lastHash = hashSnap(takeSnapshot());
  }

  unsub?.();
  unsub = useSmokeStore.subscribe(() => {
    const next = hashSnap(takeSnapshot());
    if (next === lastHash) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      const snap = takeSnapshot();
      const h = hashSnap(snap);
      if (h === lastHash) return;
      lastHash = h;
      void pushMyState({ data: { ...snap, name } }).catch(() => {
        lastHash = "";
      });
    }, 700);
  });
}

export function stopCloudSync() {
  syncing = false;
  unsub?.();
  unsub = null;
  if (timer) clearTimeout(timer);
  timer = null;
}
