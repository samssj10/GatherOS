import { DIETARY_LABELS } from '@/utils/gamification';
import type { Attendee } from '@/types';

/** What the roster says about someone's meal: nothing until they have chosen, then their answer. */
export const dietaryLabel = (attendee: Pick<Attendee, 'dietaryConfirmed' | 'dietaryPreference'>): string =>
  attendee.dietaryConfirmed ? DIETARY_LABELS[attendee.dietaryPreference] : 'Not set';

/** What the roster tells the planner "Trip ready" means. */
export const TRIP_READY_RULE =
  'Trip ready = accepted RSVP · dietary preference set · flight booked. Someone who declined is not counted.';

/** Whether someone has chosen a meal option, so the roster can show a real choice differently from "Not set". */
export const hasDietaryChoice = (attendee: Pick<Attendee, 'dietaryConfirmed'>): boolean => attendee.dietaryConfirmed;

/**
 * Accepted, dietary preference set and flight booked: three steps to being ready for the trip. Someone who
 * declined is not coming, so they are not counted at all.
 */
export function tripReadiness(
  attendee: Pick<Attendee, 'rsvpStatus' | 'dietaryConfirmed' | 'flightAssigned'>,
): {
  steps: [boolean, boolean, boolean];
  score: number;
  counted: boolean;
} {
  const steps: [boolean, boolean, boolean] = [
    attendee.rsvpStatus === 'accepted',
    attendee.dietaryConfirmed,
    attendee.flightAssigned,
  ];
  return { steps, score: steps.filter(Boolean).length, counted: attendee.rsvpStatus !== 'declined' };
}
