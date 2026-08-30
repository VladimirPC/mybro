import { pullMyState, pushMyState, type CloudSnapshot } from "@/lib/cloud";
import { useSmokeStore, type SmokeStore } from "@/lib/store";

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

export type CloudStatus = {
  saving: boolean;
  lastOkAt: number | null;
  lastError: string | null;
};

let lastHash = "";
let timer: ReturnType<typeof setTimeout> | null = null;
let unsub: (() => void) | null = null;
let visHandler: (() => void) | null = null;
let syncing = false;
let accountName = "";
let status: CloudStatus = { saving: false, lastOkAt: null, lastError: null };
const statusListeners = new Set<(s: CloudStatus) => void>();

export function getCloudStatus() {
  return status;
}

export function subscribeCloudStatus(fn: (s: CloudStatus) => void) {
  statusListeners.add(fn);
  fn(status);
  return () => {
    statusListeners.delete(fn);
  };
}

function setStatus(partial: Partial<CloudStatus>) {
  status = { ...status, ...partial };
  statusListeners.forEach((fn) => fn(status));
}

function looksLikeSnapshot(raw: unknown): raw is Partial<SmokeStore> & { logs: unknown[] } {
  if (!raw || typeof raw !== "object") return false;
  const row = raw as { state?: unknown; logs?: unknown };
  const state = row.state && typeof row.state === "object" ? (row.state as { logs?: unknown }) : row;
  return Array.isArray(state.logs);
}

function migrateFromLocalStorage(): boolean {
  if (typeof localStorage === "undefined") return false;
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (key) keys.push(key);
  }
  for (const key of keys) {
    const raw = localStorage.getItem(key);
    if (!raw || !raw.includes('"logs"')) continue;
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!looksLikeSnapshot(parsed)) continue;
      const row = parsed as { state?: Partial<SmokeStore> } & Partial<SmokeStore>;
      const data = row.state ?? row;
      if (!Array.isArray(data.logs)) continue;
      if (!data.onboarded && data.logs.length === 0) continue;
      useSmokeStore.getState().replaceSnapshot({
        onboarded: data.onboarded ?? true,
        logs: data.logs,
        resisted: Array.isArray(data.resisted) ? data.resisted : [],
        settings: data.settings ?? useSmokeStore.getState().settings,
        plan: data.plan ?? useSmokeStore.getState().plan,
        lastFactId: data.lastFactId ?? null,
      });
      localStorage.removeItem(key);
      return true;
    } catch {
      /* try next key */
    }
  }
  return false;
}

async function pushNow() {
  if (!accountName) throw new Error("Нет аккаунта");
  const snap = takeSnapshot();
  lastHash = hashSnap(snap);
  setStatus({ saving: true, lastError: null });
  await pushMyState({ data: { ...snap, name: accountName } });
  setStatus({ saving: false, lastOkAt: Date.now(), lastError: null });
}

export async function flushCloud() {
  if (!accountName) return;
  let lastErr: unknown;
  for (let i = 0; i < 5; i += 1) {
    try {
      await pushNow();
      return;
    } catch (err) {
      lastErr = err;
      lastHash = "";
      await new Promise((r) => setTimeout(r, 350 * (i + 1)));
    }
  }
  const message = lastErr instanceof Error ? lastErr.message : "Не удалось сохранить";
  setStatus({ saving: false, lastError: message });
  throw lastErr instanceof Error ? lastErr : new Error(message);
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
      const migrated = migrateFromLocalStorage();
      if (!migrated) useSmokeStore.getState().resetAll();
      lastHash = hashSnap(takeSnapshot());
      if (migrated || useSmokeStore.getState().onboarded) {
        try {
          await pushNow();
        } catch {
          /* retry via subscribe */
        }
      }
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
      void flushCloud().catch(() => undefined);
    }, 150);
  });

  visHandler?.();
  const onHide = () => {
    if (document.visibilityState === "hidden") void flushCloud().catch(() => undefined);
  };
  document.addEventListener("visibilitychange", onHide);
  window.addEventListener("pagehide", onHide);
  visHandler = () => {
    document.removeEventListener("visibilitychange", onHide);
    window.removeEventListener("pagehide", onHide);
  };
}

export function stopCloudSync() {
  syncing = false;
  accountName = "";
  unsub?.();
  unsub = null;
  visHandler?.();
  visHandler = null;
  if (timer) clearTimeout(timer);
  timer = null;
}
