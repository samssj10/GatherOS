import { describe, expect, it } from 'vitest';
import type { Attendee, AttendeeScheduleDTO } from '@/types';
import {
  badgeHints,
  badgeProgress,
  buildBadges,
  buildQuests,
  computeXp,
  levelInfo,
  sortSessions,
  validStamps,
} from '@/utils/gamification';

const session = (
  id: string,
  day: number,
  startTime: string,
  category: string,
): AttendeeScheduleDTO => ({
  id,
  eventId: 'evt',
  day,
  sessionTitle: id,
  startTime,
  endTime: '23:00',
  locationName: 'Hall',
  category,
  isRsvpRequired: false,
  checkInStatus: 'upcoming',
});

const sessions = [
  session('keynote-1', 1, '09:00', 'keynote'),
  session('lunch', 1, '12:00', 'meal'),
  session('sailing', 2, '14:00', 'activity'),
  session('keynote-2', 3, '09:00', 'keynote'),
];

const attendee = (overrides: Partial<Attendee> = {}): Attendee => ({
  id: 'att-0001',
  fullName: 'Amara Silva',
  email: 'amara@example.com',
  department: 'People Ops',
  rsvpStatus: 'pending',
  dietaryPreference: 'none',
  flightAssigned: false,
  dietaryConfirmed: false,
  stamps: [],
  nudgedAt: null,
  ...overrides,
});

describe('computeXp', () => {
  it('is zero for an attendee who has done nothing', () => {
    expect(computeXp(attendee(), sessions)).toBe(0);
  });

  it('adds 100 for an accepted RSVP, 50 for dietary, 75 for a flight and 25 per stamp', () => {
    const everything = attendee({
      rsvpStatus: 'accepted',
      dietaryConfirmed: true,
      flightAssigned: true,
      stamps: ['keynote-1', 'lunch'],
    });
    expect(computeXp(everything, sessions)).toBe(100 + 50 + 75 + 2 * 25);
  });

  it('does not award XP for a declined RSVP', () => {
    expect(computeXp(attendee({ rsvpStatus: 'declined' }), sessions)).toBe(0);
  });

  it('ignores stamps for sessions that are no longer in the itinerary', () => {
    const stale = attendee({ stamps: ['keynote-1', 'removed-session'] });
    expect([...validStamps(stale, sessions)]).toEqual(['keynote-1']);
    expect(computeXp(stale, sessions)).toBe(25);
  });
});

describe('levelInfo', () => {
  it.each([
    [0, 1, 'Newcomer'],
    [149, 1, 'Newcomer'],
    [150, 2, 'Trailblazer'],
    [299, 2, 'Trailblazer'],
    [300, 3, 'Explorer'],
    [450, 4, 'Legend'],
    [900, 4, 'Legend'],
  ])('%i XP is level %i (%s)', (xp, level, rank) => {
    expect(levelInfo(xp)).toMatchObject({ level, rank });
  });

  it('reports the distance to the next tier and the progress through the current one', () => {
    const info = levelInfo(225);
    expect(info.next).toEqual({ level: 3, rank: 'Explorer', xpToGo: 75 });
    expect(info.pct).toBe(50);
  });

  it('has no next tier at the top', () => {
    expect(levelInfo(450).next).toBeNull();
    expect(levelInfo(450).pct).toBe(100);
  });
});

describe('buildQuests', () => {
  it('lists the four pre-trip quests and marks each as done from real data', () => {
    const quests = buildQuests(
      attendee({ rsvpStatus: 'accepted', flightAssigned: true, stamps: ['keynote-1'] }),
      sessions,
    );
    expect(quests.map((quest) => [quest.id, quest.done])).toEqual([
      ['rsvp', true],
      ['dietary', false],
      ['flight', true],
      ['checkin', true],
    ]);
  });

  it('points the check-in quest at the first session of the trip', () => {
    const quest = buildQuests(attendee(), [...sessions].reverse()).find((entry) => entry.id === 'checkin');
    expect(quest?.label).toBe('Check in at keynote-1');
    expect(quest?.sub).toBe('Unlocks after you RSVP');
  });

  describe('check-in quest hint follows the first session and its clock', () => {
    const hint = (a: Attendee, status: AttendeeScheduleDTO['checkInStatus']) =>
      buildQuests(
        a,
        sessions.map((s) => (s.id === 'keynote-1' ? { ...s, checkInStatus: status } : s)),
      ).find((entry) => entry.id === 'checkin')?.sub;
    const going = attendee({ rsvpStatus: 'accepted' });

    it('says when check-in opens while the session is upcoming', () => {
      expect(hint(going, 'upcoming')).toBe('Opens at 09:00 on Day 1');
    });

    it('says it is happening now while the session is live', () => {
      expect(hint(going, 'live')).toBe('Happening now');
    });

    it('says check-in closed once the session has ended', () => {
      expect(hint(going, 'ended')).toBe('Check-in closed');
    });

    it('asks for an RSVP first, and is Done once stamped, whatever the clock says', () => {
      expect(hint(attendee(), 'live')).toBe('Unlocks after you RSVP');
      expect(hint(attendee({ rsvpStatus: 'accepted', stamps: ['keynote-1'] }), 'ended')).toBe('Done');
    });
  });
});

describe('buildBadges', () => {
  const earned = (a: Attendee) =>
    Object.fromEntries(buildBadges(a, sessions).map((badge) => [badge.id, badge.earned]));

  it('awards the three starter badges from RSVP, dietary and flight', () => {
    expect(earned(attendee({ rsvpStatus: 'accepted', dietaryConfirmed: true, flightAssigned: true }))).toMatchObject({
      early: true,
      fuelled: true,
      jetset: true,
    });
  });

  it('only awards Front Row once every keynote is stamped', () => {
    expect(earned(attendee({ stamps: ['keynote-1'] })).frontrow).toBe(false);
    expect(earned(attendee({ stamps: ['keynote-1', 'keynote-2'] })).frontrow).toBe(true);
  });

  it('awards Sea Legs for every activity and Full House for every session', () => {
    expect(earned(attendee({ stamps: ['sailing'] })).sealegs).toBe(true);
    expect(earned(attendee({ stamps: ['keynote-1', 'lunch', 'sailing'] })).fullhouse).toBe(false);
    expect(earned(attendee({ stamps: ['keynote-1', 'lunch', 'sailing', 'keynote-2'] })).fullhouse).toBe(true);
  });

  it('never awards a category badge when the itinerary has no such sessions', () => {
    const noActivities = sessions.filter((s) => s.category !== 'activity');
    const badges = buildBadges(attendee({ stamps: noActivities.map((s) => s.id) }), noActivities);
    expect(badges.find((badge) => badge.id === 'sealegs')?.earned).toBe(false);
  });
});

describe('badgeHints', () => {
  const ordered = sortSessions(sessions);

  it('hints which badge a session counts toward', () => {
    expect(badgeHints(ordered[0]!, ordered)).toEqual(['Front Row']);
    expect(badgeHints(ordered[1]!, ordered)).toEqual([]);
  });

  it('marks the final session as counting toward Full House', () => {
    expect(badgeHints(ordered.at(-1)!, ordered)).toEqual(['Front Row', 'Full House']);
  });
});

describe('badgeProgress', () => {
  const ordered = sortSessions(sessions);

  it('counts stamped keynotes toward Front Row', () => {
    const stamps = new Set(['keynote-1']);
    expect(badgeProgress(ordered[0]!, ordered, stamps)).toEqual([
      { badge: 'Front Row', done: 1, total: 2, noun: 'keynotes' },
    ]);
  });

  it('counts activities toward Sea Legs', () => {
    const sailing = ordered.find((s) => s.id === 'sailing')!;
    expect(badgeProgress(sailing, ordered, new Set(['sailing']))).toEqual([
      { badge: 'Sea Legs', done: 1, total: 1, noun: 'activities' },
    ]);
  });

  it('counts every session toward Full House on the final session', () => {
    const progress = badgeProgress(ordered.at(-1)!, ordered, new Set(['keynote-1', 'keynote-2']));
    expect(progress).toEqual([
      { badge: 'Front Row', done: 2, total: 2, noun: 'keynotes' },
      { badge: 'Full House', done: 2, total: 4, noun: 'sessions' },
    ]);
  });

  it('has nothing to report for a session that counts toward no badge', () => {
    expect(badgeProgress(ordered[1]!, ordered, new Set())).toEqual([]);
  });
});
