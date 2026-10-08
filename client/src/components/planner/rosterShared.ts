import type { Attendee } from '@/types';

/** What the roster shows for one attendee, shared by the wide table and the phone cards. */

export const RSVP_STYLES: Record<Attendee['rsvpStatus'], string> = {
  accepted: 'bg-ok-tint text-ok-ink',
  pending: 'bg-warn-tint text-warn-ink',
  declined: 'bg-bad-tint text-bad-ink',
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

export { dietaryLabel, tripReadiness } from '@/utils/roster';

/** Props both roster layouts take. */
export interface RosterListProps {
  rows: Attendee[];
  isPending: boolean;
  onNudge: (id: string) => void;
  /** The attendee whose nudge is being sent right now, if any. */
  nudgingId: string | undefined;
}
