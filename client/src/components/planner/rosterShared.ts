import type { Attendee } from '@/types';

/** What the roster shows for one attendee, shared by the wide table and the phone cards. */

export const RSVP_STYLES: Record<Attendee['rsvpStatus'], string> = {
  accepted: 'bg-ok-tint text-ok-ink',
  pending: 'bg-warn-tint text-warn-ink',
  declined: 'bg-bad-tint text-bad-ink',
};

export const DIETARY_LABELS: Record<Attendee['dietaryPreference'], string> = {
  none: 'None',
  vegetarian: 'Vegetarian',
  vegan: 'Vegan',
  'gluten-free': 'Gluten-free',
};

// Avatar tints rotate by attendee number so a person keeps their color while filtering.
const AVATAR_TINTS = [
  'bg-brand-tint text-brand-ink',
  'bg-blue-tint text-blue-ink',
  'bg-ok-tint text-ok-ink',
  'bg-orange-tint text-warn-ink',
] as const;

export const avatarTint = (id: string) =>
  AVATAR_TINTS[Number.parseInt(id.slice(4), 10) % AVATAR_TINTS.length] ?? AVATAR_TINTS[0];

/** Answered RSVP, accepted and flight booked: three steps to being ready for the trip. */
export function tripReadiness(attendee: Attendee): { steps: [boolean, boolean, boolean]; score: number } {
  const steps: [boolean, boolean, boolean] = [
    attendee.rsvpStatus !== 'pending',
    attendee.rsvpStatus === 'accepted',
    attendee.flightAssigned,
  ];
  return { steps, score: steps.filter(Boolean).length };
}

/** Props both roster layouts take. */
export interface RosterListProps {
  rows: Attendee[];
  isPending: boolean;
  onNudge: (id: string) => void;
  /** The attendee whose nudge is being sent right now, if any. */
  nudgingId: string | undefined;
}
