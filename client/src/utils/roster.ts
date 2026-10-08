import { DIETARY_LABELS } from '@/utils/gamification';
import type { Attendee } from '@/types';

/** What the roster says about someone's meal: nothing until they have chosen, then their answer. */
export const dietaryLabel = (attendee: Pick<Attendee, 'dietaryConfirmed' | 'dietaryPreference'>): string =>
  attendee.dietaryConfirmed ? DIETARY_LABELS[attendee.dietaryPreference] : 'Not set';

/**
 * Answered RSVP, accepted and flight booked: three steps to being ready for the trip. Someone who declined
 * is not coming, so they are not counted at all.
 */
export function tripReadiness(attendee: Pick<Attendee, 'rsvpStatus' | 'flightAssigned'>): {
  steps: [boolean, boolean, boolean];
  score: number;
  counted: boolean;
} {
  const steps: [boolean, boolean, boolean] = [
    attendee.rsvpStatus !== 'pending',
    attendee.rsvpStatus === 'accepted',
    attendee.flightAssigned,
  ];
  return { steps, score: steps.filter(Boolean).length, counted: attendee.rsvpStatus !== 'declined' };
}
