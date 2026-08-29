export type TriggerId =
  | "work"
  | "stress"
  | "overload"
  | "coffee"
  | "meal"
  | "company"
  | "boredom"
  | "commute"
  | "alcohol"
  | "other";

export type CigaretteLog = {
  id: string;
  at: number;
  trigger?: TriggerId;
};

export type ResistedLog = {
  id: string;
  at: number;
};

export type WidgetSize = "s" | "m" | "l" | "full";
export type WidgetTheme = "night" | "paper" | "sage";
export type WidgetLayout =
  | "today"
  | "remain"
  | "ring"
  | "plus"
  | "last"
  | "wide"
  | "stats"
  | "money"
  | "life"
  | "plan"
  | "crave"
  | "full";

const LAYOUTS: WidgetLayout[] = [
  "today",
  "remain",
  "ring",
  "plus",
  "last",
  "wide",
  "stats",
  "money",
  "life",
  "plan",
  "crave",
  "full",
];

export type WidgetConfig = {
  size: WidgetSize;
  theme: WidgetTheme;
  layout: WidgetLayout;
  showToday: boolean;
  showLimit: boolean;
  showRemaining: boolean;
  showAverage: boolean;
  showStreak: boolean;
  showLast: boolean;
  showWeek: boolean;
  showRing: boolean;
};

export type ReductionPlan = {
  enabled: boolean;
  startLimit: number;
  targetLimit: number;
  stepSize: number;
  stepDays: number;
  startedAt: number;
  paused: boolean;
  frozenLimit: number | null;
};

export type Settings = {
  dailyLimit: number | null;
  baselinePerDay: number | null;
  startedAt: number;
  packSize: number;
  packPrice: number | null;
  currency: "₽" | "$" | "€";
  factOnLog: boolean;
  cravingDelaySec: number;
  reason: string;
  fontScale: number;
  widget: WidgetConfig;
};

export type OnboardingInput = {
  baselinePerDay: number;
  startLimit: number;
  stepSize: number;
  stepDays: number;
  targetLimit: number;
  reason: string;
  packPrice: number | null;
  useDemo: boolean;
};

export const TRIGGERS: { id: TriggerId; label: string }[] = [
  { id: "work", label: "Работа" },
  { id: "stress", label: "Стресс" },
  { id: "overload", label: "Сильная нагрузка" },
  { id: "coffee", label: "Кофе" },
  { id: "meal", label: "После еды" },
  { id: "company", label: "Компания" },
  { id: "boredom", label: "Скука" },
  { id: "commute", label: "Дорога" },
  { id: "alcohol", label: "Алкоголь" },
  { id: "other", label: "Другое" },
];

export const DEFAULT_TRIGGER: TriggerId = "work";

export function triggerLabel(id: TriggerId) {
  return TRIGGERS.find((t) => t.id === id)?.label ?? id;
}

export const FONT_SCALE_MIN = 0.9;
export const FONT_SCALE_MAX = 1.35;

export function clampFontScale(n: number) {
  if (!Number.isFinite(n)) return 1.35;
  return Math.min(FONT_SCALE_MAX, Math.max(FONT_SCALE_MIN, n));
}

export const DEFAULT_WIDGET: WidgetConfig = {
  size: "m",
  theme: "night",
  layout: "wide",
  showToday: true,
  showLimit: true,
  showRemaining: true,
  showAverage: true,
  showStreak: true,
  showLast: true,
  showWeek: false,
  showRing: true,
};

export const DEFAULT_SETTINGS: Settings = {
  dailyLimit: null,
  baselinePerDay: null,
  startedAt: 0,
  packSize: 20,
  packPrice: null,
  currency: "₽",
  factOnLog: true,
  cravingDelaySec: 90,
  reason: "",
  fontScale: 1.35,
  widget: DEFAULT_WIDGET,
};

export const DEFAULT_PLAN: ReductionPlan = {
  enabled: false,
  startLimit: 10,
  targetLimit: 0,
  stepSize: 1,
  stepDays: 7,
  startedAt: 0,
  paused: false,
  frozenLimit: null,
};

export function normalizeSettings(raw?: Partial<Settings> | null): Settings {
  const widget = raw?.widget;
  return {
    ...DEFAULT_SETTINGS,
    ...raw,
    fontScale: clampFontScale(raw?.fontScale ?? DEFAULT_SETTINGS.fontScale),
    widget: {
      ...DEFAULT_WIDGET,
      ...widget,
      size: widget?.size === "s" || widget?.size === "m" || widget?.size === "l" || widget?.size === "full"
        ? widget.size
        : DEFAULT_WIDGET.size,
      layout: widget?.layout && LAYOUTS.includes(widget.layout) ? widget.layout : DEFAULT_WIDGET.layout,
    },
  };
}
