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
let accountName = "";

export async function flushCloud() {
  if (!accountName) return;
  const snap = takeSnapshot();
  lastHash = hashSnap(snap);
  await pushMyState({ data: { ...snap, name: accountName } });
}

export async function startCloudSync(name: string) {
  accountName = name;
  if (syncing) return;
  syncing = true;
  try {
    const remote = await pullMyState();
    if (remote) {
      useSmokeStore.getState().replaceSnapshot(remote);
      lastHash = hashSnap(remote);
    } else {
      useSmokeStore.getState().resetAll();
      lastHash = hashSnap(takeSnapshot());
    }
  } catch {
    lastHash = hashSnap(takeSnapshot());
  } finally {
    useSmokeStore.getState().setHydrated();
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
      void pushMyState({ data: { ...snap, name: accountName } }).catch(() => {
        lastHash = "";
      });
    }, 400);
  });
}

export function stopCloudSync() {
  syncing = false;
  accountName = "";
  unsub?.();
  unsub = null;
  if (timer) clearTimeout(timer);
  timer = null;
}
