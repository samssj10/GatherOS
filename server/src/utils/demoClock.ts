import type { ScheduleItem } from '../types';
import { sessionWindow } from './eventClock';

/**
 * Plays the time between `start` and `end` on a loop, in step with the real clock: the result moves
 * forward one second for every real second and jumps back to `start` each time it reaches `end`.
 * A window that is a whole number of minutes, starting on a minute, keeps its minute boundaries on
 * the real minute boundaries, so the room code changes exactly when a real minute passes.
 */
export function loopedTime(real: Date, start: Date, end: Date): Date {
  const length = end.getTime() - start.getTime();
  if (length <= 0) return real;
  return new Date(start.getTime() + (real.getTime() % length));
}

/** When the first session of Day 1 runs. Null when Day 1 has no sessions. */
export function firstSessionWindow(
  schedule: readonly Pick<ScheduleItem, 'day' | 'startTime' | 'endTime'>[],
  eventStart: Date,
): { start: Date; end: Date } | null {
  const first = schedule
    .filter((item) => item.day === 1)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))[0];
  return first ? sessionWindow(first, eventStart) : null;
}
