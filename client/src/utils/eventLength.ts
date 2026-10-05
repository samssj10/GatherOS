/** Longest offsite the planner can draft. Mirrors MAX_EVENT_DAYS in server/src/utils/scheduleSchema.ts. */
export const MAX_EVENT_DAYS = 7;
/** Length used when the prompt does not say how many days. */
export const DEFAULT_EVENT_DAYS = 3;

const WORD_NUMBERS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  fourteen: 14,
};

const NUMBER = `\\d{1,2}|${Object.keys(WORD_NUMBERS).join('|')}`;
const toNumber = (token: string): number => WORD_NUMBERS[token] ?? Number.parseInt(token, 10);

// "5-day", "5 days", "five days", and ranges such as "3 to 5 days" or "3-5 days" (the longer end wins).
const DAYS_PATTERN = new RegExp(
  `\\b(?:(?:${NUMBER})\\s*(?:-|–|to)\\s*)?(${NUMBER})[\\s-]*days?\\b`,
  'i',
);
const WEEKS_PATTERN = new RegExp(`\\b(${NUMBER}|a|one)[\\s-]*weeks?(?:[\\s-]*long)?\\b`, 'i');

/**
 * Reads how long the planner said the offsite lasts ("5-day retreat in Lisbon", "a week in Porto").
 * Returns the raw figure, which may exceed the maximum, or null when the prompt does not say.
 * The first mention wins, so "a 5-day retreat with one day of sailing" is 5.
 */
export function parseRequestedDays(prompt: string): number | null {
  const text = prompt.toLowerCase();

  const candidates: { index: number; days: number }[] = [];
  const days = DAYS_PATTERN.exec(text);
  if (days?.[1]) candidates.push({ index: days.index, days: toNumber(days[1]) });

  const weeks = WEEKS_PATTERN.exec(text);
  if (weeks?.[1]) {
    const count = weeks[1] === 'a' ? 1 : toNumber(weeks[1]);
    candidates.push({ index: weeks.index, days: count * 7 });
  }

  const weekend = /\bweekend\b/.exec(text);
  if (weekend) candidates.push({ index: weekend.index, days: 2 });

  const first = candidates.sort((a, b) => a.index - b.index)[0];
  return first && first.days >= 1 ? first.days : null;
}

export type DaysSource = 'manual' | 'prompt' | 'default';

export interface ResolvedDays {
  days: number;
  source: DaysSource;
  /** What was asked for when it had to be cut to the maximum; null otherwise. */
  cappedFrom: number | null;
}

/** Picks the day count to send: the planner's explicit choice, else the prompt, else the default. */
export function resolveDays(prompt: string, manual: number | null): ResolvedDays {
  const requested = manual ?? parseRequestedDays(prompt);
  if (requested === null) return { days: DEFAULT_EVENT_DAYS, source: 'default', cappedFrom: null };
  return {
    days: Math.min(requested, MAX_EVENT_DAYS),
    source: manual === null ? 'prompt' : 'manual',
    cappedFrom: requested > MAX_EVENT_DAYS ? requested : null,
  };
}

/** One line telling the planner what will be planned, shown before they send. */
export function describeResolvedDays({ days, source, cappedFrom }: ResolvedDays): string {
  const label = `${days} ${days === 1 ? 'day' : 'days'}`;
  if (cappedFrom !== null) return `Planning ${label}, the most GatherOS can draft (you asked for ${cappedFrom}).`;
  if (source === 'prompt') return `Planning ${label}, from your prompt.`;
  if (source === 'manual') return `Planning ${label}.`;
  return `Planning ${label}. Mention a length like "5-day" in your prompt to change it.`;
}
