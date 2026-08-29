import { format, formatDistance } from "date-fns";
import { ru } from "date-fns/locale";

export function pluralRu(n: number, one: string, few: string, many: string) {
  const abs = Math.abs(Math.trunc(n)) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return many;
  if (last === 1) return one;
  if (last >= 2 && last <= 4) return few;
  return many;
}

export function cigWord(n: number) {
  return pluralRu(n, "сигарета", "сигареты", "сигарет");
}

export function dayWord(n: number) {
  return pluralRu(n, "день", "дня", "дней");
}

export function formatTime(ts: number) {
  return format(ts, "HH:mm", { locale: ru });
}

export function formatDay(ts: number) {
  return format(ts, "d MMMM", { locale: ru });
}

export function formatDayShort(ts: number) {
  return format(ts, "d MMM", { locale: ru });
}

export function formatWeekday(ts: number) {
  return format(ts, "EEEE", { locale: ru });
}

export function formatFull(ts: number) {
  return format(ts, "d MMMM, HH:mm", { locale: ru });
}

export function formatAgo(ts: number, now = Date.now()) {
  return formatDistance(ts, now, { locale: ru, addSuffix: true });
}

export function formatNum(n: number, digits = 1) {
  if (!Number.isFinite(n)) return "—";
  const rounded = Math.abs(n - Math.round(n)) < 0.05 ? Math.round(n) : n;
  return new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: Number.isInteger(rounded) ? 0 : digits,
    minimumFractionDigits: 0,
  }).format(rounded);
}

export function formatMoney(n: number, currency: "₽" | "$" | "€") {
  const formatted = new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 0,
  }).format(Math.round(n));
  if (currency === "₽") return `${formatted} ₽`;
  return `${currency}${formatted}`;
}

export function formatDuration(min: number) {
  if (min < 60) {
    const m = Math.round(min);
    return `${m} ${pluralRu(m, "минута", "минуты", "минут")}`;
  }
  const hours = Math.floor(min / 60);
  if (hours < 24) {
    return `${hours} ${pluralRu(hours, "час", "часа", "часов")}`;
  }
  const days = Math.floor(hours / 24);
  if (days < 30) {
    return `${days} ${dayWord(days)}`;
  }
  const months = Math.floor(days / 30);
  return `${months} ${pluralRu(months, "месяц", "месяца", "месяцев")}`;
}

export function pad2(n: number) {
  return n.toString().padStart(2, "0");
}
