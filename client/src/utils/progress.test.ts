import { describe, expect, it } from 'vitest';
import type { AttendeeSummary, ScheduleItem } from '@/types';
import {
  budgetStatus,
  buildMilestones,
  halfHouseTarget,
  hostRank,
  nextUnlock,
  spendByCategory,
} from '@/utils/progress';

const item = (id: string, day: number, category: ScheduleItem['category'], costEstimate: number): ScheduleItem => ({
  id,
  day,
  startTime: '09:00',
  endTime: '10:00',
  title: id,
  description: '',
  location: '',
  category,
  costEstimate,
});

const summary = (accepted: number, declined: number, pending: number): AttendeeSummary => ({
  total: accepted + declined + pending,
  rsvp: { accepted, declined, pending },
  dietary: { none: 0, vegetarian: 0, vegan: 0, 'gluten-free': 0 },
  flightsAssigned: 0,
});

// Three days of sessions, $54,000 of a $120,000 budget, 1,236 of 2,500 accepted.
const seeded = {
  items: [
    item('a', 1, 'keynote', 1500),
    item('b', 1, 'workshop', 2200),
    item('c', 1, 'meal', 18000),
    item('d', 2, 'workshop', 2600),
    item('e', 2, 'activity', 12500),
    item('f', 3, 'keynote', 1200),
    item('g', 3, 'meal', 16000),
  ],
  budget: 120_000,
  summary: summary(1236, 364, 900),
};

const byId = (numbers: typeof seeded) =>
  Object.fromEntries(buildMilestones(numbers).map((milestone) => [milestone.id, milestone]));

describe('halfHouseTarget', () => {
  it('is half the invitees, rounded up', () => {
    expect(halfHouseTarget(2500)).toBe(1250);
    expect(halfHouseTarget(2501)).toBe(1251);
  });
});

describe('buildMilestones', () => {
  it('matches the seeded data: itinerary and budget done, Half House and Everyone open', () => {
    const milestones = byId(seeded);
    expect(milestones.itinerary).toMatchObject({ done: true, meta: '7 sessions' });
    expect(milestones.budget).toMatchObject({ done: true, meta: '45%' });
    expect(milestones['half-house']).toMatchObject({ done: false, meta: '1,236 / 1,250' });
    expect(milestones.everyone).toMatchObject({ done: false, meta: '1,600 / 2,500' });
  });

  it('only completes the itinerary milestone when all three days have sessions', () => {
    const twoDays = { ...seeded, items: seeded.items.filter((entry) => entry.day !== 3) };
    expect(byId(twoDays).itinerary).toMatchObject({ done: false, pct: (2 / 3) * 100 });
  });

  it('stretches the itinerary milestone to the length of a longer trip', () => {
    const fiveDays = { ...seeded, items: [...seeded.items, item('h', 4, 'workshop', 1000), item('i', 5, 'meal', 1000)] };
    expect(byId(fiveDays).itinerary).toMatchObject({ title: 'Build a 5-day itinerary', done: true, pct: 100 });

    const gap = { ...seeded, items: [...seeded.items, item('i', 5, 'meal', 1000)] };
    expect(byId(gap).itinerary).toMatchObject({ done: false, pct: 80 });
  });

  it('does not treat an empty itinerary as "under budget"', () => {
    expect(byId({ ...seeded, items: [] }).budget.done).toBe(false);
  });

  it('flips the budget milestone off once spend passes half the budget', () => {
    const heavy = { ...seeded, items: [item('big', 1, 'meal', 70_000)] };
    expect(byId(heavy).budget.done).toBe(false);
  });

  it('completes Half House at the target and Everyone answers at 100% responded', () => {
    expect(byId({ ...seeded, summary: summary(1250, 350, 900) })['half-house'].done).toBe(true);
    expect(byId({ ...seeded, summary: summary(1500, 1000, 0) }).everyone.done).toBe(true);
  });
});

describe('hostRank', () => {
  const rankFor = (done: number) =>
    hostRank(
      Array.from({ length: 4 }, (_, index) => ({
        id: 'itinerary' as const,
        title: '',
        meta: '',
        pct: 0,
        done: index < done,
      })),
    );

  it.each([
    [0, 'Scout'],
    [1, 'Pathfinder'],
    [2, 'Trail Builder'],
    [3, 'Trailblazer'],
    [4, 'Summit Host'],
  ])('%i milestones is %s', (done, name) => {
    expect(rankFor(done).name).toBe(name);
  });

  it('names the next rank and when it unlocks, and has none at the top', () => {
    expect(rankFor(2).next).toEqual({ name: 'Trailblazer', unlocksAt: 3 });
    expect(rankFor(4).next).toBeNull();
  });
});

describe('nextUnlock', () => {
  it('points at Half House with the exact gap when that is the first open milestone', () => {
    const unlock = nextUnlock(seeded, buildMilestones(seeded));
    expect(unlock.eyebrow).toBe('Next unlock · Half House');
    expect(unlock.title).toBe('14 more yeses to fill half the house');
    expect(unlock.allDone).toBe(false);
  });

  it('singularises "yes" for a gap of one', () => {
    const near = { ...seeded, summary: summary(1249, 351, 900) };
    expect(nextUnlock(near, buildMilestones(near)).title).toBe('1 more yes to fill half the house');
  });

  it('asks for missing days first when the itinerary is incomplete', () => {
    const oneDay = { ...seeded, items: seeded.items.filter((entry) => entry.day === 1) };
    const unlock = nextUnlock(oneDay, buildMilestones(oneDay));
    expect(unlock.title).toBe('Plan all three days');
    expect(unlock.body).toContain('Day 2 and 3 have no sessions yet');
  });

  it('names every missing day on a longer trip', () => {
    const gap = { ...seeded, items: [item('a', 1, 'keynote', 1500), item('b', 5, 'meal', 1500)] };
    const unlock = nextUnlock(gap, buildMilestones(gap));
    expect(unlock.title).toBe('Plan all five days');
    expect(unlock.body).toContain('Days 2, 3 and 4 have no sessions yet');
  });

  it('celebrates when every milestone is complete', () => {
    const done = { ...seeded, summary: summary(1500, 1000, 0) };
    expect(nextUnlock(done, buildMilestones(done))).toMatchObject({ allDone: true });
  });
});

describe('spendByCategory and budgetStatus', () => {
  it('totals each category in the design order', () => {
    expect(spendByCategory(seeded.items).map((entry) => [entry.label, entry.amount])).toEqual([
      ['Meals', 34_000],
      ['Activities', 12_500],
      ['Workshops', 4_800],
      ['Keynotes', 2_700],
    ]);
  });

  it.each([
    [45, 'on track'],
    [79.9, 'on track'],
    [80, 'close to the limit'],
    [100, 'close to the limit'],
    [100.1, 'over budget'],
  ])('%s%% of the budget is "%s"', (pct, label) => {
    expect(budgetStatus(pct).label).toBe(label);
  });
});
