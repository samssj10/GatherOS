import type { ScheduleItem } from '@/types';

export interface TimingEntry {
  id: string;
  day: number;
  startTime: string;
  endTime: string;
}

/** The day and times of each session, as they are now. */
export function timingsOf(items: readonly ScheduleItem[]): TimingEntry[] {
  return items.map(({ id, day, startTime, endTime }) => ({ id, day, startTime, endTime }));
}

/**
 * Puts the listed sessions back on the given day and times and touches nothing else. Mirrors
 * applyTiming in server/src/utils/restoreTiming.ts; the server's answer is the authoritative one.
 */
export function applyTiming(items: readonly ScheduleItem[], entries: readonly TimingEntry[]): ScheduleItem[] {
  const byId = new Map(entries.map((entry) => [entry.id, entry]));
  return items.map((item) => {
    const entry = byId.get(item.id);
    return entry ? { ...item, day: entry.day, startTime: entry.startTime, endTime: entry.endTime } : item;
  });
}
