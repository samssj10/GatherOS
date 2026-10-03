import type { Attendee, ScheduleItem } from '../types';

export const ATTENDEE_COUNT = 2500;
export const DEFAULT_EVENT_ID = 'evt-offsite-2026';

const FIRST_NAMES = [
  'Aarav', 'Maya', 'Liam', 'Sofia', 'Noah', 'Priya', 'Ethan', 'Chloe', 'Omar', 'Hannah',
  'Lucas', 'Mei', 'Diego', 'Amara', 'Jack', 'Yuki', 'Isabella', 'Kwame', 'Elena', 'Ravi',
  'Olivia', 'Mateo', 'Zara', 'Henry', 'Layla', 'Felix', 'Nina', 'Samuel', 'Ingrid', 'Arjun',
];

const LAST_NAMES = [
  'Patel', 'Nguyen', 'Garcia', 'Kim', 'Johnson', 'Okafor', 'Rossi', 'Schmidt', 'Tanaka', 'Silva',
  'Cohen', 'Haddad', 'Larsen', 'Murphy', 'Singh', 'Costa', 'Ivanov', 'Mensah', 'Brown', 'Lopez',
  'Chen', 'Dubois', 'Khan', 'Novak', 'Walker', 'Fischer', 'Reyes', 'Sato', 'Evans', 'Mehta',
];

const DEPARTMENTS = [
  'Engineering', 'Sales', 'Marketing', 'Product', 'Design', 'Finance',
  'People Ops', 'Customer Success', 'Legal', 'Operations',
];

const RSVP_STATUSES: Attendee['rsvpStatus'][] = ['accepted', 'declined', 'pending'];
const DIETARY: Attendee['dietaryPreference'][] = ['none', 'vegetarian', 'vegan', 'gluten-free'];

// Small deterministic PRNG so the seed data is identical on every boot.
function mulberry32(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rand: () => number, items: readonly T[]): T {
  return items[Math.floor(rand() * items.length)] as T;
}

function weightedRsvp(rand: () => number): Attendee['rsvpStatus'] {
  const roll = rand();
  if (roll < 0.5) return 'accepted';
  if (roll < 0.65) return 'declined';
  return 'pending';
}

function seedAttendees(count: number): Attendee[] {
  const rand = mulberry32(2026);
  const attendees: Attendee[] = [];

  for (let i = 0; i < count; i += 1) {
    const first = pick(rand, FIRST_NAMES);
    const last = pick(rand, LAST_NAMES);
    const number = String(i + 1).padStart(4, '0');
    // Draw order matters: it must match the original seed so existing data stays identical.
    const department = pick(rand, DEPARTMENTS);
    const rsvpStatus = weightedRsvp(rand);
    const dietaryPreference: Attendee['dietaryPreference'] =
      rand() < 0.7 ? 'none' : pick(rand, DIETARY.slice(1));
    const flightAssigned = rand() < 0.6;

    attendees.push({
      id: `att-${number}`,
      fullName: `${first} ${last}`,
      // The numeric suffix keeps emails unique across duplicate names.
      email: `${first}.${last}.${number}@example.com`.toLowerCase(),
      department,
      rsvpStatus,
      dietaryPreference,
      flightAssigned,
      // Anyone with a stated restriction has answered; 'none' counts as unanswered until chosen.
      dietaryConfirmed: dietaryPreference !== 'none',
      stamps: [],
      nudgedAt: null,
    });
  }

  return attendees;
}

function seedSchedule(): ScheduleItem[] {
  return [
    {
      id: 'sch-001', day: 1, startTime: '09:00', endTime: '10:00',
      title: 'Opening Keynote', description: 'Company vision and goals for the year ahead.',
      location: 'Grand Ballroom', category: 'keynote', costEstimate: 1500,
    },
    {
      id: 'sch-002', day: 1, startTime: '10:15', endTime: '12:00',
      title: 'Cross-Team Strategy Workshop', description: 'Facilitated planning across departments.',
      location: 'Conference Room A', category: 'workshop', costEstimate: 2200,
    },
    {
      id: 'sch-003', day: 1, startTime: '12:15', endTime: '13:30',
      title: 'Welcome Lunch', description: 'Buffet lunch with vegetarian, vegan and gluten-free options.',
      location: 'Terrace Restaurant', category: 'meal', costEstimate: 18000,
    },
    {
      id: 'sch-004', day: 2, startTime: '09:30', endTime: '11:30',
      title: 'Design Sprint', description: 'Hands-on product design sprint in mixed teams.',
      location: 'Studio 2', category: 'workshop', costEstimate: 2600,
    },
    {
      id: 'sch-005', day: 2, startTime: '14:00', endTime: '17:00',
      title: 'Harbour Sailing', description: 'Team-building activity on the water.',
      location: 'Marina Dock', category: 'activity', costEstimate: 12500,
    },
    {
      id: 'sch-006', day: 3, startTime: '09:00', endTime: '10:30',
      title: 'Leadership Fireside Chat', description: 'Open Q&A with the executive team.',
      location: 'Grand Ballroom', category: 'keynote', costEstimate: 1200,
    },
    {
      id: 'sch-007', day: 3, startTime: '12:00', endTime: '13:00',
      title: 'Farewell Lunch', description: 'Closing lunch and awards.',
      location: 'Terrace Restaurant', category: 'meal', costEstimate: 16000,
    },
  ];
}

// In-memory mock database. Module state is the single source of truth.
export const db = {
  attendees: seedAttendees(ATTENDEE_COUNT),
  schedule: seedSchedule(),
  eventBudget: 120000,
};

export { RSVP_STATUSES, DIETARY, DEPARTMENTS };
