import type { ScheduleItem } from '../types';

/**
 * Compares the days a draft covers with the days that were asked for (1 to `days`).
 * Returns the days with no sessions and the days past the requested length.
 */
export function dayCoverageProblems(
  items: Pick<ScheduleItem, 'day'>[],
  days: number,
): { missing: number[]; extra: number[] } {
  const used = new Set(items.map((item) => item.day));
  const missing: number[] = [];
  for (let day = 1; day <= days; day += 1) if (!used.has(day)) missing.push(day);
  const extra = [...used].filter((day) => day > days).sort((a, b) => a - b);
  return { missing, extra };
}
