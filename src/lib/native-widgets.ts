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
  update(data: NativeWidgetPayload): Promise<void>;
  consumePending(): Promise<{ log: boolean }>;
};

const WidgetSync = registerPlugin<WidgetSyncPlugin>("WidgetSync");

export function isNativeApp() {
  return typeof window !== "undefined" && Capacitor.isNativePlatform();
}

export async function pushNativeWidgets(data: NativeWidgetPayload) {
  if (!isNativeApp()) return;
  await WidgetSync.update({
    ...data,
    remain: data.remain ?? -1,
    limit: data.limit ?? -1,
    lastAt: data.lastAt ?? 0,
  });
}

export async function consumeNativePending() {
  if (!isNativeApp()) return { log: false };
  return WidgetSync.consumePending();
}
