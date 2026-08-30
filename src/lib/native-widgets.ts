import { Capacitor, registerPlugin } from "@capacitor/core";

export type NativeWidgetPayload = {
  today: number;
  remain: number | null;
  limit: number | null;
  lastAt: number | null;
  resistedToday: number;
  overLimit: boolean;
};

type WidgetSyncPlugin = {
  update(data: Record<string, number | boolean>): Promise<void>;
  consumePending(): Promise<{ log: boolean }>;
};

const WidgetSync = registerPlugin<WidgetSyncPlugin>("WidgetSync");

type NativeBridge = {
  update?: (json: string) => void;
};

function cap(): { isNativePlatform?: () => boolean; Plugins?: { WidgetSync?: WidgetSyncPlugin } } | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as unknown as { Capacitor?: ReturnType<typeof cap> }).Capacitor;
}

function dyshiNative(): NativeBridge | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as unknown as { DyshiNative?: NativeBridge }).DyshiNative;
}

export function isNativeApp() {
  try {
    if (typeof window === "undefined") return false;
    if (typeof (window as unknown as { DyshiNative?: unknown }).DyshiNative !== "undefined") return true;
    if (Capacitor.isNativePlatform()) return true;
    return Boolean(cap()?.isNativePlatform?.());
  } catch {
    return false;
  }
}

function payload(data: NativeWidgetPayload) {
  return {
    today: data.today,
    remain: data.remain ?? -1,
    limit: data.limit ?? -1,
    lastAt: data.lastAt ?? 0,
    resistedToday: data.resistedToday,
    overLimit: data.overLimit,
  };
}

export async function pushNativeWidgets(data: NativeWidgetPayload) {
  const body = payload(data);
  if (typeof window !== "undefined") {
    (window as unknown as { __DYSHI_WIDGET__?: typeof body }).__DYSHI_WIDGET__ = body;
    const root = document.documentElement;
    root.dataset.dyshiToday = String(body.today);
    root.dataset.dyshiRemain = String(body.remain);
    root.dataset.dyshiLimit = String(body.limit);
    root.dataset.dyshiLastAt = String(body.lastAt);
    root.dataset.dyshiResisted = String(body.resistedToday);
    root.dataset.dyshiOver = body.overLimit ? "1" : "0";
  }
  if (!isNativeApp()) return;
  try {
    dyshiNative()?.update?.(JSON.stringify(body));
  } catch {
    /* interface not ready */
  }
  try {
    const injected = cap()?.Plugins?.WidgetSync;
    if (injected?.update) {
      await injected.update(body);
      return;
    }
    await WidgetSync.update(body);
  } catch (err) {
    console.warn("[dyshi] widget sync failed", err);
  }
}

export async function consumeNativePending() {
  if (!isNativeApp()) return { log: false };
  try {
    const injected = cap()?.Plugins?.WidgetSync;
    if (injected?.consumePending) return injected.consumePending();
    return WidgetSync.consumePending();
  } catch {
    return { log: false };
  }
}
