import type { AttendeeSummary, ScheduleItem } from '@/types';
import { eventDayNumbers } from '@/utils/eventLength';
import { formatCurrency, formatNumber } from '@/utils/format';

const DAY_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven'];

/** "Day 2 has", "Day 2 and 3 have", "Days 1, 2 and 4 have". */
function describeMissingDays(days: number[]): string {
  if (days.length === 1) return `Day ${days[0]} has`;
  const head = days.slice(0, -1).join(', ');
  return `${days.length === 2 ? 'Day' : 'Days'} ${head} and ${days[days.length - 1]} have`;
}

/** Planner ranks, indexed by how many milestones are complete (0 to 4). */
const HOST_RANKS = ['Scout', 'Pathfinder', 'Trail Builder', 'Trailblazer', 'Summit Host'] as const;

export type MilestoneId = 'itinerary' | 'budget' | 'half-house' | 'everyone';

export interface Milestone {
  id: MilestoneId;
  title: string;
  /** Right-hand detail, e.g. "1,236 / 1,250". */
  meta: string;
  /** 0 to 100 */
  pct: number;
  done: boolean;
}

export interface PlannerNumbers {
  items: ScheduleItem[];
  budget: number;
  summary: AttendeeSummary;
}

const clamp = (value: number) => Math.max(0, Math.min(100, value));

export function spendOf(items: ScheduleItem[]): number {
  return items.reduce((sum, item) => sum + item.costEstimate, 0);
}

/** Half of the invitees: the "Half House" target. */
export function halfHouseTarget(total: number): number {
  return Math.ceil(total / 2);
}

export function buildMilestones({ items, budget, summary }: PlannerNumbers): Milestone[] {
  const eventDays = eventDayNumbers(items);
  const daysCovered = new Set(items.map((item) => item.day));
  const spendPct = budget > 0 ? (spendOf(items) / budget) * 100 : 0;
  const target = halfHouseTarget(summary.total);
  const accepted = summary.rsvp.accepted;
  const answered = summary.rsvp.accepted + summary.rsvp.declined;

  const itineraryDone = eventDays.every((day) => daysCovered.has(day));
  // Zero spend on an empty itinerary must not count as "under budget".
  const budgetDone = items.length > 0 && spendPct <= 50;

  return [
    {
      id: 'itinerary',
      title: `Build a ${eventDays.length}-day itinerary`,
      meta: `${items.length} session${items.length === 1 ? '' : 's'}`,
      pct: clamp((eventDays.filter((day) => daysCovered.has(day)).length / eventDays.length) * 100),
      done: itineraryDone,
    },
    {
      id: 'budget',
      title: 'Keep spend under half the budget',
      meta: `${Math.round(spendPct)}%`,
      pct: budgetDone ? 100 : spendPct > 0 ? clamp((50 / spendPct) * 100) : 0,
      done: budgetDone,
    },
    {
      id: 'half-house',
      title: `Half House: ${formatNumber(target)} acceptances`,
      meta: `${formatNumber(accepted)} / ${formatNumber(target)}`,
      pct: clamp(target > 0 ? (accepted / target) * 100 : 0),
      done: accepted >= target,
    },
    {
      id: 'everyone',
      title: 'Everyone answers',
      meta: `${formatNumber(answered)} / ${formatNumber(summary.total)}`,
      pct: clamp(summary.total > 0 ? (answered / summary.total) * 100 : 0),
      done: answered === summary.total,
    },
  ];
}

export interface HostRank {
  name: string;
  doneCount: number;
  total: number;
  /** Null once the top rank is reached. */
  next: { name: string; unlocksAt: number } | null;
}

export function hostRank(milestones: Milestone[]): HostRank {
  const doneCount = milestones.filter((milestone) => milestone.done).length;
  const index = Math.min(doneCount, HOST_RANKS.length - 1);
  const nextName = HOST_RANKS[index + 1];
  return {
    name: HOST_RANKS[index],
    doneCount,
    total: milestones.length,
    next: nextName ? { name: nextName, unlocksAt: index + 1 } : null,
  };
}

export interface NextUnlock {
  eyebrow: string;
  title: string;
  body: string;
  allDone: boolean;
}

/** The hero card copy: what to do next to unlock the next milestone. */
export function nextUnlock({ items, budget, summary }: PlannerNumbers, milestones: Milestone[]): NextUnlock {
  const open = milestones.find((milestone) => !milestone.done);
  const pending = summary.rsvp.pending;
  const accepted = summary.rsvp.accepted;
  const target = halfHouseTarget(summary.total);
  const spend = spendOf(items);

  switch (open?.id) {
    case undefined:
      return {
        eyebrow: 'All milestones complete',
        title: 'Your offsite is ready to go',
        body: 'Every milestone is done. Nothing left to chase.',
        allDone: true,
      };
    case 'itinerary': {
      const covered = new Set(items.map((item) => item.day));
      const eventDays = eventDayNumbers(items);
      const missing = eventDays.filter((day) => !covered.has(day));
      return {
        eyebrow: 'Next unlock · Full itinerary',
        title: `Plan all ${DAY_WORDS[eventDays.length] ?? eventDays.length} days`,
        body: `${describeMissingDays(missing)} no sessions yet. Add some, or generate a draft with the bar above.`,
        allDone: false,
      };
    }
    case 'budget':
      return {
        eyebrow: 'Next unlock · Lean budget',
        title: `Trim ${formatCurrency(Math.max(0, spend - budget / 2))} to get under half the budget`,
        body: `You have planned ${Math.round(budget > 0 ? (spend / budget) * 100 : 0)}% of ${formatCurrency(budget)} so far.`,
        allDone: false,
      };
    case 'half-house': {
      const gap = Math.max(0, target - accepted);
      return {
        eyebrow: 'Next unlock · Half House',
        title: `${formatNumber(gap)} more ${gap === 1 ? 'yes' : 'yeses'} to fill half the house`,
        body: `${formatNumber(accepted)} of ${formatNumber(summary.total)} invitees have accepted. At ${formatNumber(target)} you hit the next milestone, and ${formatNumber(pending)} ${pending === 1 ? 'person' : 'people'} still ${pending === 1 ? "hasn't" : "haven't"} answered.`,
        allDone: false,
      };
    }
    case 'everyone':
      return {
        eyebrow: 'Next unlock · Everyone answers',
        title: `${formatNumber(pending)} ${pending === 1 ? 'answer' : 'answers'} still to come`,
        body: `${formatNumber(summary.rsvp.accepted + summary.rsvp.declined)} of ${formatNumber(summary.total)} have responded. A nudge to the pending group usually does it.`,
        allDone: false,
      };
  }
}

export interface CategorySpend {
  category: 'meal' | 'activity' | 'workshop' | 'keynote';
  label: string;
  amount: number;
  /** Tailwind background class for the bar segment and legend swatch. */
  swatch: string;
}

/** Spend per category in the design's fixed order. */
export function spendByCategory(items: ScheduleItem[]): CategorySpend[] {
  const total = (category: ScheduleItem['category']) =>
    items.filter((item) => item.category === category).reduce((sum, item) => sum + item.costEstimate, 0);

  return [
    { category: 'meal', label: 'Meals', amount: total('meal'), swatch: 'bg-orange' },
    { category: 'activity', label: 'Activities', amount: total('activity'), swatch: 'bg-ok' },
    { category: 'workshop', label: 'Workshops', amount: total('workshop'), swatch: 'bg-blue' },
    { category: 'keynote', label: 'Keynotes', amount: total('keynote'), swatch: 'bg-brand' },
  ];
}

export function budgetStatus(spendPct: number): { label: string; classes: string } {
  if (spendPct > 100) return { label: 'over budget', classes: 'bg-bad-tint text-bad-ink' };
  if (spendPct >= 80) return { label: 'close to the limit', classes: 'bg-warn-tint text-warn-ink' };
  return { label: 'on track', classes: 'bg-ok-tint text-ok-ink' };
}
