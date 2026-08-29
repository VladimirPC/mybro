import type { WidgetLayout, WidgetSize, WidgetTheme } from "@/lib/types";

export type WidgetPreset = {
  id: WidgetLayout;
  name: string;
  hint: string;
  size: WidgetSize;
};

export const WIDGET_PRESETS: WidgetPreset[] = [
  { id: "today", name: "Сегодня", hint: "Крупная цифра за день", size: "s" },
  { id: "remain", name: "Остаток", hint: "Сколько ещё можно сегодня", size: "s" },
  { id: "ring", name: "Кольцо", hint: "Прогресс до лимита", size: "s" },
  { id: "plus", name: "Выкурить", hint: "Большая кнопка «+»", size: "s" },
  { id: "last", name: "Последняя", hint: "Время последней сигареты", size: "s" },
  { id: "wide", name: "Широкий", hint: "Сегодня, лимит и остаток", size: "m" },
  { id: "stats", name: "Сводка", hint: "Среднее, серия, неделя", size: "m" },
  { id: "money", name: "Деньги", hint: "Сколько уже не потратили", size: "m" },
  { id: "life", name: "Время жизни", hint: "Минуты, которые не сгорели", size: "m" },
  { id: "plan", name: "План", hint: "Лимит и шаг снижения", size: "m" },
  { id: "crave", name: "Тяга", hint: "Кнопка «подождать»", size: "m" },
  { id: "full", name: "На весь экран", hint: "Полный счётчик без меню", size: "full" },
];

export const WIDGET_THEMES: { id: WidgetTheme; label: string }[] = [
  { id: "night", label: "Ночь" },
  { id: "paper", label: "Бумага" },
  { id: "sage", label: "Шалфей" },
];

export function presetById(id: string | undefined) {
  return WIDGET_PRESETS.find((p) => p.id === id);
}
