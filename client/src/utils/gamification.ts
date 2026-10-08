import type { Attendee, AttendeeScheduleDTO } from '@/types';

/** What each action is worth. */
export const XP = { rsvp: 100, dietary: 50, flight: 75, stamp: 25 } as const;

const TIERS = [
  { min: 0, name: 'Newcomer' },
  { min: 150, name: 'Trailblazer' },
  { min: 300, name: 'Explorer' },
  { min: 450, name: 'Legend' },
] as const;

export const DIETARY_LABELS: Record<Attendee['dietaryPreference'], string> = {
  none: 'No restrictions',
  vegetarian: 'Vegetarian',
  vegan: 'Vegan',
  'gluten-free': 'Gluten-free',
};

/** Sessions in the order they happen. */
export function sortSessions(sessions: AttendeeScheduleDTO[]): AttendeeScheduleDTO[] {
  return [...sessions].sort((a, b) => a.day - b.day || a.startTime.localeCompare(b.startTime));
}

/** Stamps that still match a session in the current itinerary (a replaced itinerary orphans old ones). */
export function validStamps(attendee: Attendee, sessions: AttendeeScheduleDTO[]): Set<string> {
  const ids = new Set(sessions.map((session) => session.id));
  return new Set(attendee.stamps.filter((id) => ids.has(id)));
}

export function computeXp(attendee: Attendee, sessions: AttendeeScheduleDTO[]): number {
  return (
    (attendee.rsvpStatus === 'accepted' ? XP.rsvp : 0) +
    (attendee.dietaryConfirmed ? XP.dietary : 0) +
    (attendee.flightAssigned ? XP.flight : 0) +
    validStamps(attendee, sessions).size * XP.stamp
  );
}

export interface LevelInfo {
  level: number;
  rank: string;
  xp: number;
  /** Null at the top tier. */
  next: { level: number; rank: string; xpToGo: number } | null;
  /** 0 to 100 progress toward the next tier. */
  pct: number;
}

export function levelInfo(xp: number): LevelInfo {
  let index = 0;
  TIERS.forEach((tier, i) => {
    if (xp >= tier.min) index = i;
  });
  const current = TIERS[index];
  const next = TIERS[index + 1];
  return {
    level: index + 1,
    rank: current.name,
    xp,
    next: next ? { level: index + 2, rank: next.name, xpToGo: next.min - xp } : null,
    pct: next ? Math.round(((xp - current.min) / (next.min - current.min)) * 100) : 100,
  };
}

/**
 * Where a quest stands: earned, open to do now, or waiting on something else (the first check-in waits for the
 * RSVP). The Home page draws each differently, so the XP on offer only looks earned once it is.
 */
export type QuestState = 'done' | 'todo' | 'waiting';

export interface Quest {
  id: string;
  label: string;
  /** The line under the label. */
  sub: string;
  /** What to say instead of `sub` on a wide screen, where the RSVP card is on the left, not at the top. */
  subWide?: string;
  xp: number;
  done: boolean;
  state: QuestState;
  /** Where an open quest leads. */
  to: string;
}

/** What the first-stop quest says, following the RSVP, the stamp and the session's clock. */
function checkInHint(first: AttendeeScheduleDTO, accepted: boolean, stamped: boolean): string {
  if (stamped) return 'Done';
  if (!accepted) return 'Unlocks after you RSVP';
  if (first.checkInStatus === 'live') return 'Happening now';
  if (first.checkInStatus === 'ended') return 'Check-in closed';
  return `Opens ${first.startTime} on Day ${first.day}`;
}

export function buildQuests(attendee: Attendee, sessions: AttendeeScheduleDTO[]): Quest[] {
  const accepted = attendee.rsvpStatus === 'accepted';
  const first = sortSessions(sessions)[0];
  const stamps = validStamps(attendee, sessions);
  const firstStamped = first ? stamps.has(first.id) : false;

  const quests: Quest[] = [
    {
      id: 'rsvp',
      label: 'Confirm your RSVP',
      sub: accepted ? 'Done' : 'Answer at the top of this page',
      subWide: accepted ? 'Done' : 'Answer on the left',
      xp: XP.rsvp,
      done: accepted,
      state: accepted ? 'done' : 'todo',
      to: '#rsvp',
    },
    {
      id: 'dietary',
      label: 'Set dietary preference',
      sub: attendee.dietaryConfirmed ? DIETARY_LABELS[attendee.dietaryPreference] : 'Choose in Dietary',
      xp: XP.dietary,
      done: attendee.dietaryConfirmed,
      state: attendee.dietaryConfirmed ? 'done' : 'todo',
      to: '/attendee/preferences',
    },
    {
      id: 'flight',
      label: 'Book your flight',
      sub: attendee.flightAssigned ? 'Booked' : 'Waiting on the travel team',
      xp: XP.flight,
      done: attendee.flightAssigned,
      // The travel team books it, so there is nothing for the attendee to open.
      state: attendee.flightAssigned ? 'done' : 'waiting',
      to: '',
    },
  ];

  if (first) {
    quests.push({
      id: 'checkin',
      label: `Check in at ${first.sessionTitle}`,
      sub: checkInHint(first, accepted, firstStamped),
      xp: XP.stamp,
      done: firstStamped,
      state: firstStamped ? 'done' : accepted ? 'todo' : 'waiting',
      to: '/attendee/schedule',
    });
  }

  return quests;
}

export interface Badge {
  id: string;
  name: string;
  how: string;
  earned: boolean;
}

/** True when there is at least one session in the group and every one of them is stamped. */
function allStamped(group: AttendeeScheduleDTO[], stamps: Set<string>): boolean {
  return group.length > 0 && group.every((session) => stamps.has(session.id));
}

export function buildBadges(attendee: Attendee, sessions: AttendeeScheduleDTO[]): Badge[] {
  const stamps = validStamps(attendee, sessions);

  return [
    { id: 'early', name: 'Early Responder', how: 'Confirmed your RSVP', earned: attendee.rsvpStatus === 'accepted' },
    { id: 'fuelled', name: 'Fuelled Up', how: 'Shared your dietary preference', earned: attendee.dietaryConfirmed },
    { id: 'jetset', name: 'Jet Set', how: 'Booked your flight', earned: attendee.flightAssigned },
    {
      id: 'frontrow',
      name: 'Front Row',
      how: 'Stamp every keynote',
      earned: allStamped(sessions.filter((s) => s.category === 'keynote'), stamps),
    },
    {
      id: 'sealegs',
      name: 'Sea Legs',
      how: 'Stamp every activity',
      earned: allStamped(sessions.filter((s) => s.category === 'activity'), stamps),
    },
    {
      id: 'fullhouse',
      name: 'Full House',
      how: sessions.length > 0 ? `Collect all ${sessions.length} stamps` : 'Collect every stamp',
      earned: allStamped(sessions, stamps),
    },
  ];
}

/** Badges a session counts toward, shown as hints on the journey. */
export function badgeHints(session: AttendeeScheduleDTO, ordered: AttendeeScheduleDTO[]): string[] {
  const hints: string[] = [];
  if (session.category === 'keynote') hints.push('Front Row');
  if (session.category === 'activity') hints.push('Sea Legs');
  if (ordered.at(-1)?.id === session.id) hints.push('Full House');
  return hints;
}

export interface BadgeProgress {
  badge: string;
  /** Stamps collected toward this badge. */
  done: number;
  total: number;
  /** What is being counted: "keynotes", "activities" or "sessions". */
  noun: string;
}

/** How far each badge a session counts toward has got, for "Front Row 1 of 2" style messages. */
export function badgeProgress(
  session: AttendeeScheduleDTO,
  ordered: AttendeeScheduleDTO[],
  stamps: Set<string>,
): BadgeProgress[] {
  const count = (group: AttendeeScheduleDTO[], badge: string, noun: string): BadgeProgress => ({
    badge,
    done: group.filter((entry) => stamps.has(entry.id)).length,
    total: group.length,
    noun,
  });

  return badgeHints(session, ordered).map((hint) => {
    if (hint === 'Front Row') return count(ordered.filter((s) => s.category === 'keynote'), hint, 'keynotes');
    if (hint === 'Sea Legs') return count(ordered.filter((s) => s.category === 'activity'), hint, 'activities');
    return count(ordered, hint, 'sessions');
  });
}
