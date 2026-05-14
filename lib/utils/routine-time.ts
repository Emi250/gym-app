import { differenceInCalendarDays, differenceInCalendarMonths } from "date-fns";

/**
 * Human label for "how long the user has been following this routine."
 * Granularity is adaptive: days for the first 13 days, weeks up to ~12 weeks,
 * months after that. Returns null when the routine has no start date or is in the future.
 */
export function routineDurationLabel(startedAt: string | null, now: Date = new Date()): string | null {
  if (!startedAt) return null;
  const start = new Date(startedAt);
  if (Number.isNaN(start.getTime())) return null;
  const days = differenceInCalendarDays(now, start);
  if (days < 0) return null;
  if (days === 0) return "Empezó hoy";
  if (days === 1) return "1 día";
  if (days < 14) return `${days} días`;
  const weeks = Math.floor(days / 7);
  if (weeks < 12) return weeks === 1 ? "1 semana" : `${weeks} semanas`;
  const months = differenceInCalendarMonths(now, start);
  if (months <= 1) return "1 mes";
  return `${months} meses`;
}
