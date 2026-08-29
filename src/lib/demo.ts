import type { CigaretteLog, OnboardingInput, ReductionPlan, ResistedLog, Settings, TriggerId } from "@/lib/types";
import { DEFAULT_SETTINGS, DEFAULT_WIDGET } from "@/lib/types";
import { nid } from "@/lib/utils";

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const HOURS = [7, 8, 9, 11, 13, 14, 16, 18, 19, 21, 22, 23];
const TRIGGER_BAG: TriggerId[] = [
  "work",
  "work",
  "work",
  "stress",
  "stress",
  "overload",
  "coffee",
  "meal",
  "company",
  "boredom",
  "commute",
  "alcohol",
  "other",
];

export function buildDemo(now = Date.now()) {
  const rand = mulberry32(0xd151);
  const days = 24;
  const baseline = 16;
  const startLimit = 15;
  const stepDays = 7;
  const stepSize = 1;
  const startedAt = now - days * 86_400_000;
  const logs: CigaretteLog[] = [];
  const resisted: ResistedLog[] = [];

  for (let d = 0; d < days; d += 1) {
    const dayStart = startedAt + d * 86_400_000;
    const elapsedWeeks = Math.floor(d / stepDays);
    const limit = Math.max(0, startLimit - elapsedWeeks * stepSize);
    const start = dayStart;
    let count = Math.round(baseline - d * 0.18 + (rand() - 0.5) * 3);
    count = Math.max(0, count);
    if (d === 0) count = Math.min(count, Math.max(3, limit - 2));

    const usedHours = new Set<number>();
    for (let i = 0; i < count; i += 1) {
      let hour = HOURS[Math.floor(rand() * HOURS.length)] ?? 18;
      if (usedHours.has(hour) && rand() > 0.35) {
        hour = Math.min(23, hour + 1);
      }
      usedHours.add(hour);
      const minute = Math.floor(rand() * 56);
      const at = start + hour * 3_600_000 + minute * 60_000 + Math.floor(rand() * 40_000);
      if (at > now - 20 * 60_000) continue;
      logs.push({
        id: nid(),
        at,
        trigger: TRIGGER_BAG[Math.floor(rand() * TRIGGER_BAG.length)],
      });
    }

    const resistN = rand() > 0.55 ? 1 + Math.floor(rand() * 2) : 0;
    for (let i = 0; i < resistN; i += 1) {
      const hour = 10 + Math.floor(rand() * 10);
      const at = start + hour * 3_600_000 + Math.floor(rand() * 3_000_000);
      if (at > now) continue;
      resisted.push({ id: nid(), at });
    }
  }

  logs.sort((a, b) => a.at - b.at);
  resisted.sort((a, b) => a.at - b.at);

  const settings: Settings = {
    ...DEFAULT_SETTINGS,
    dailyLimit: 12,
    baselinePerDay: baseline,
    startedAt,
    packSize: 20,
    packPrice: 250,
    currency: "₽",
    factOnLog: true,
    cravingDelaySec: 90,
    reason: "Хочу спокойно дышать и не пахнуть дымом.",
    widget: { ...DEFAULT_WIDGET, size: "l", theme: "night" },
  };

  const plan: ReductionPlan = {
    enabled: true,
    startLimit,
    targetLimit: 0,
    stepSize,
    stepDays,
    startedAt,
    paused: false,
    frozenLimit: null,
  };

  return { settings, plan, logs, resisted, onboarded: true as const };
}

export function settingsFromOnboarding(input: OnboardingInput, now = Date.now()): {
  settings: Settings;
  plan: ReductionPlan;
} {
  return {
    settings: {
      ...DEFAULT_SETTINGS,
      dailyLimit: input.startLimit,
      baselinePerDay: input.baselinePerDay,
      startedAt: now,
      packPrice: input.packPrice,
      reason: input.reason,
    },
    plan: {
      enabled: true,
      startLimit: input.startLimit,
      targetLimit: input.targetLimit,
      stepSize: input.stepSize,
      stepDays: input.stepDays,
      startedAt: now,
      paused: false,
      frozenLimit: null,
    },
  };
}
