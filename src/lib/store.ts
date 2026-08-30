import { create } from "zustand";
import { buildDemo, settingsFromOnboarding } from "@/lib/demo";
import {
  DEFAULT_PLAN,
  DEFAULT_SETTINGS,
  normalizeSettings,
  type CigaretteLog,
  type OnboardingInput,
  type ReductionPlan,
  type ResistedLog,
  type Settings,
  type TriggerId,
  type WidgetConfig,
} from "@/lib/types";
import { nid } from "@/lib/utils";

export type SmokeStore = {
  hydrated: boolean;
  onboarded: boolean;
  logs: CigaretteLog[];
  resisted: ResistedLog[];
  settings: Settings;
  plan: ReductionPlan;
  lastFactId: string | null;
  setHydrated: () => void;
  completeOnboarding: (input: OnboardingInput) => void;
  addSmoke: (trigger?: TriggerId) => CigaretteLog;
  setTrigger: (id: string, trigger: TriggerId) => void;
  undoSmoke: (id?: string) => void;
  addResisted: () => ResistedLog;
  patchSettings: (partial: Partial<Settings>) => void;
  patchWidget: (partial: Partial<WidgetConfig>) => void;
  patchPlan: (partial: Partial<ReductionPlan>) => void;
  setLastFactId: (id: string | null) => void;
  loadDemo: () => void;
  resetAll: () => void;
  replaceSnapshot: (data: {
    onboarded: boolean;
    logs: CigaretteLog[];
    resisted: ResistedLog[];
    settings: Settings;
    plan: ReductionPlan;
    lastFactId: string | null;
  }) => void;
  importSnapshot: (raw: string) => boolean;
};

const empty = {
  onboarded: false,
  logs: [] as CigaretteLog[],
  resisted: [] as ResistedLog[],
  settings: DEFAULT_SETTINGS,
  plan: DEFAULT_PLAN,
  lastFactId: null as string | null,
};

export const useSmokeStore = create<SmokeStore>()((set, get) => ({
  hydrated: false,
  ...empty,
  setHydrated: () => set({ hydrated: true }),
  completeOnboarding: (input) => {
    if (input.useDemo) {
      const demo = buildDemo();
      set({
        onboarded: true,
        logs: demo.logs,
        resisted: demo.resisted,
        settings: {
          ...demo.settings,
          reason: input.reason || demo.settings.reason,
          packPrice: input.packPrice ?? demo.settings.packPrice,
        },
        plan: {
          ...demo.plan,
          startLimit: input.startLimit,
          targetLimit: input.targetLimit,
          stepSize: input.stepSize,
          stepDays: input.stepDays,
        },
      });
      return;
    }
    const next = settingsFromOnboarding(input);
    set({
      onboarded: true,
      logs: [],
      resisted: [],
      settings: next.settings,
      plan: next.plan,
    });
  },
  addSmoke: (trigger) => {
    const log: CigaretteLog = { id: nid(), at: Date.now(), trigger };
    set({ logs: [...get().logs, log] });
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(12);
    }
    return log;
  },
  setTrigger: (id, trigger) => {
    set({
      logs: get().logs.map((l) => (l.id === id ? { ...l, trigger } : l)),
    });
  },
  undoSmoke: (id) => {
    const { logs } = get();
    if (!logs.length) return;
    if (!id) {
      set({ logs: logs.slice(0, -1) });
      return;
    }
    set({ logs: logs.filter((l) => l.id !== id) });
  },
  addResisted: () => {
    const row: ResistedLog = { id: nid(), at: Date.now() };
    set({ resisted: [...get().resisted, row] });
    return row;
  },
  patchSettings: (partial) => {
    set({ settings: normalizeSettings({ ...get().settings, ...partial }) });
  },
  patchWidget: (partial) => {
    const { settings } = get();
    set({ settings: normalizeSettings({ ...settings, widget: { ...settings.widget, ...partial } }) });
  },
  patchPlan: (partial) => {
    set({ plan: { ...get().plan, ...partial } });
  },
  setLastFactId: (id) => set({ lastFactId: id }),
  loadDemo: () => {
    const demo = buildDemo();
    set({
      onboarded: true,
      logs: demo.logs,
      resisted: demo.resisted,
      settings: demo.settings,
      plan: demo.plan,
    });
  },
  resetAll: () => set({ ...empty }),
  replaceSnapshot: (data) => {
    set({
      onboarded: data.onboarded,
      logs: data.logs,
      resisted: data.resisted,
      settings: normalizeSettings(data.settings),
      plan: { ...DEFAULT_PLAN, ...data.plan },
      lastFactId: data.lastFactId,
    });
  },
  importSnapshot: (raw) => {
    try {
      const data = JSON.parse(raw) as Partial<SmokeStore>;
      if (!Array.isArray(data.logs)) return false;
      set({
        onboarded: true,
        logs: data.logs,
        resisted: Array.isArray(data.resisted) ? data.resisted : [],
        settings: normalizeSettings(data.settings),
        plan: { ...DEFAULT_PLAN, ...(data.plan ?? {}) },
      });
      return true;
    } catch {
      return false;
    }
  },
}));

export function rehydrateStore() {
  useSmokeStore.getState().setHydrated();
}

export function exportSnapshot() {
  const { logs, resisted, settings, plan, onboarded } = useSmokeStore.getState();
  return JSON.stringify({ onboarded, logs, resisted, settings, plan }, null, 2);
}
