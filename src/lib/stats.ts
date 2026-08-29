import { startOfDay, startOfWeek, startOfMonth, addDays, differenceInCalendarDays } from "date-fns";
import type { CigaretteLog, ReductionPlan, ResistedLog, Settings, TriggerId } from "@/lib/types";
import { TRIGGERS } from "@/lib/types";

const DAY_MS = 86_400_000;
const LIFE_MIN_PER_CIG = 11;

export function dayKey(ts: number) {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function currentLimit(plan: ReductionPlan, settings: Settings, now = Date.now()) {
  if (!plan.enabled) return settings.dailyLimit;
  if (plan.paused && plan.frozenLimit != null) return plan.frozenLimit;
  if (!plan.startedAt) return plan.startLimit;
  const days = Math.max(0, Math.floor((now - plan.startedAt) / DAY_MS));
  const steps = Math.floor(days / Math.max(1, plan.stepDays));
  return Math.max(plan.targetLimit, plan.startLimit - steps * plan.stepSize);
}

export function nextTaperAt(plan: ReductionPlan, now = Date.now()) {
  if (!plan.enabled || plan.paused || !plan.startedAt) return null;
  const elapsed = Math.max(0, now - plan.startedAt);
  const stepMs = plan.stepDays * DAY_MS;
  const nextStep = Math.floor(elapsed / stepMs) + 1;
  const at = plan.startedAt + nextStep * stepMs;
  const projected = plan.startLimit - nextStep * plan.stepSize;
  if (projected < plan.targetLimit) return null;
  return { at, limit: Math.max(plan.targetLimit, projected) };
}

export type DayBucket = {
  key: string;
  start: number;
  count: number;
  limit: number | null;
};

export function enumerateDays(from: number, to: number) {
  const start = startOfDay(from).getTime();
  const end = startOfDay(to).getTime();
  const days: number[] = [];
  for (let t = start; t <= end; t += DAY_MS) days.push(t);
  return days;
}

export type AppStats = {
  now: number;
  startAt: number;
  daysTracked: number;
  total: number;
  today: number;
  yesterday: number;
  week: number;
  month: number;
  rolling7: number;
  rolling7Avg: number;
  rolling30: number;
  rolling30Avg: number;
  allTimeAvg: number;
  limit: number | null;
  remaining: number | null;
  overLimit: boolean;
  lastAt: number | null;
  firstAt: number | null;
  streakUnder: number;
  bestStreak: number;
  resistedTotal: number;
  resistedToday: number;
  avoided: number;
  moneySpent: number | null;
  moneySaved: number | null;
  lifeMinutes: number;
  unitPrice: number | null;
  hourly: number[];
  weekday: number[];
  triggers: { id: TriggerId; label: string; count: number }[];
  series: DayBucket[];
  series30: DayBucket[];
  avgSeries: { key: string; start: number; avg: number; limit: number | null }[];
};

export function computeStats(
  logs: CigaretteLog[],
  resisted: ResistedLog[],
  settings: Settings,
  plan: ReductionPlan,
  now = Date.now(),
): AppStats {
  const limit = currentLimit(plan, settings, now);
  const todayStart = startOfDay(now).getTime();
  const yesterdayStart = todayStart - DAY_MS;
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }).getTime();
  const monthStart = startOfMonth(now).getTime();
  const startAt =
    settings.startedAt ||
    (logs.length ? Math.min(...logs.map((l) => l.at)) : now);
  const startDay = startOfDay(startAt).getTime();
  const daysTracked = Math.max(1, differenceInCalendarDays(todayStart, startDay) + 1);

  const byDay = new Map<string, number>();
  const hourly = Array.from({ length: 24 }, () => 0);
  const weekday = Array.from({ length: 7 }, () => 0);
  const triggerCount = new Map<TriggerId, number>();

  let today = 0;
  let yesterday = 0;
  let week = 0;
  let month = 0;
  let rolling7 = 0;
  let rolling30 = 0;
  let lastAt: number | null = null;
  let firstAt: number | null = null;

  for (const log of logs) {
    if (!firstAt || log.at < firstAt) firstAt = log.at;
    if (!lastAt || log.at > lastAt) lastAt = log.at;
    const key = dayKey(log.at);
    byDay.set(key, (byDay.get(key) ?? 0) + 1);
    const d = new Date(log.at);
    hourly[d.getHours()] += 1;
    weekday[(d.getDay() + 6) % 7] += 1;
    if (log.trigger) triggerCount.set(log.trigger, (triggerCount.get(log.trigger) ?? 0) + 1);
    if (log.at >= todayStart) today += 1;
    else if (log.at >= yesterdayStart) yesterday += 1;
    if (log.at >= weekStart) week += 1;
    if (log.at >= monthStart) month += 1;
    if (log.at >= now - 7 * DAY_MS) rolling7 += 1;
    if (log.at >= now - 30 * DAY_MS) rolling30 += 1;
  }

  const total = logs.length;
  const allTimeAvg = total / daysTracked;
  const remaining = limit == null ? null : Math.max(0, limit - today);
  const overLimit = limit != null && today > limit;

  const dayStarts = enumerateDays(startDay, todayStart);
  const series: DayBucket[] = dayStarts.map((start) => {
    const key = dayKey(start);
    return {
      key,
      start,
      count: byDay.get(key) ?? 0,
      limit: currentLimit(plan, settings, start + 12 * 60 * 60 * 1000),
    };
  });

  const last30Start = addDays(todayStart, -29).getTime();
  const series30 = series.filter((d) => d.start >= last30Start);

  let run = 0;
  let bestStreak = 0;
  let streakUnder = 0;
  let stillOpen = true;
  for (let i = series.length - 1; i >= 0; i -= 1) {
    const day = series[i]!;
    const under = day.limit == null ? day.count === 0 : day.count <= day.limit;
    if (under) {
      run += 1;
      if (run > bestStreak) bestStreak = run;
      if (stillOpen && day.start !== todayStart) streakUnder += 1;
      else if (stillOpen && day.start === todayStart) streakUnder += 1;
    } else {
      if (run > bestStreak) bestStreak = run;
      run = 0;
      if (day.start === todayStart) {
        /* today over limit does not break past streak until midnight logic: break */
        stillOpen = false;
        streakUnder = 0;
      } else if (stillOpen) {
        stillOpen = false;
      }
    }
  }
  if (run > bestStreak) bestStreak = run;

  const avgSeries = series.map((d, i) => {
    let sum = 0;
    for (let j = 0; j <= i; j += 1) sum += series[j]!.count;
    return {
      key: d.key,
      start: d.start,
      avg: sum / (i + 1),
      limit: d.limit,
    };
  });

  const resistedToday = resisted.filter((r) => r.at >= todayStart).length;
  const baseline = settings.baselinePerDay ?? limit ?? 0;
  const expected = baseline * daysTracked;
  const avoided = Math.max(0, Math.round(expected - total));

  const unitPrice =
    settings.packPrice != null && settings.packSize > 0
      ? settings.packPrice / settings.packSize
      : null;
  const moneySpent = unitPrice == null ? null : total * unitPrice;
  const moneySaved = unitPrice == null ? null : avoided * unitPrice;

  const rolling7Days = Math.min(7, daysTracked);
  const rolling30Days = Math.min(30, daysTracked);

  const triggers = TRIGGERS.map((t) => ({
    id: t.id,
    label: t.label,
    count: triggerCount.get(t.id) ?? 0,
  })).sort((a, b) => b.count - a.count);

  return {
    now,
    startAt,
    daysTracked,
    total,
    today,
    yesterday,
    week,
    month,
    rolling7,
    rolling7Avg: rolling7 / rolling7Days,
    rolling30,
    rolling30Avg: rolling30 / rolling30Days,
    allTimeAvg,
    limit,
    remaining,
    overLimit,
    lastAt,
    firstAt,
    streakUnder,
    bestStreak,
    resistedTotal: resisted.length,
    resistedToday,
    avoided,
    moneySpent,
    moneySaved,
    lifeMinutes: avoided * LIFE_MIN_PER_CIG,
    unitPrice,
    hourly,
    weekday,
    triggers,
    series,
    series30,
    avgSeries,
  };
}

export function peakHour(hourly: number[]) {
  let max = -1;
  let hour = 0;
  hourly.forEach((v, i) => {
    if (v > max) {
      max = v;
      hour = i;
    }
  });
  return { hour, count: max };
}
