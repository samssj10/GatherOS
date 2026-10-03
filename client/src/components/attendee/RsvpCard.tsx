import { Check, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUpdateAttendee } from '@/api/attendees';
import type { Attendee } from '@/types';
import { XP } from '@/utils/gamification';

/**
 * RSVP as a quest. The headline reads the optimistic cache value, so it changes the instant a
 * button is pressed; the toast arrives only after the server confirms.
 */
export default function RsvpCard({ attendee }: { attendee: Attendee }) {
  const update = useUpdateAttendee(attendee.id);
  const status = attendee.rsvpStatus;

  const choose = (next: Attendee['rsvpStatus']) => {
    if (next !== status) update.mutate({ rsvpStatus: next });
  };

  return (
    <section
      aria-live="polite"
      className="flex flex-col gap-3.5 rounded-3xl border border-line bg-white p-5 lg:p-6"
    >
      {status === 'accepted' && (
        <>
          <div className="flex items-center gap-3.5">
            <span className="flex size-14 flex-none -rotate-8 items-center justify-center rounded-full border-2 border-dashed border-ok">
              <span className="flex size-10.5 items-center justify-center rounded-full bg-ok text-white">
                <Check className="size-5.5" strokeWidth={2.6} aria-hidden="true" />
              </span>
            </span>
            <div>
              <h2 id="rsvp-heading" className="font-display text-[22px] font-bold text-ok-ink">
                You're going!
              </h2>
              <p className="mt-0.5 text-sm text-body">Spot confirmed · +{XP.rsvp} XP earned</p>
            </div>
          </div>
          <div className="flex flex-col gap-3.5 lg:flex-row lg:flex-wrap lg:gap-2.5">
            <Link
              to="/attendee/schedule"
              className="flex min-h-12.5 items-center justify-center gap-2 rounded-[14px] bg-brand text-base font-semibold text-white no-underline transition-colors hover:bg-brand-hover lg:min-h-12 lg:flex-[1_1_200px] lg:text-[15px]"
            >
              See your journey
              <ChevronRight className="size-4.5" strokeWidth={2} aria-hidden="true" />
            </Link>
            <button
              type="button"
              onClick={() => choose('declined')}
              className="min-h-11 text-sm text-body underline hover:text-ink lg:min-h-12 lg:rounded-[14px] lg:border lg:border-field lg:bg-white lg:px-4 lg:no-underline lg:hover:bg-wash"
            >
              Can't make it anymore<span className="lg:hidden">?</span>
            </button>
          </div>
        </>
      )}

      {status === 'pending' && (
        <>
          <div>
            <span className="rounded-md bg-brand-tint px-2 py-1 font-mono text-[11px] font-semibold text-brand-ink">
              QUEST · +{XP.rsvp} XP
            </span>
            <h2 id="rsvp-heading" className="mt-2.5 mb-1 font-display text-2xl font-bold">
              Are you in?
            </h2>
            <p className="text-[15px] leading-snug text-body">
              Confirm your spot to unlock your schedule and start collecting stamps.
            </p>
          </div>
          <div className="flex flex-col gap-3.5 lg:flex-row lg:flex-wrap lg:gap-2.5">
            <button
              type="button"
              onClick={() => choose('accepted')}
              className="min-h-13 rounded-[14px] bg-brand text-base font-semibold text-white transition-colors hover:bg-brand-hover lg:min-h-12.5 lg:flex-[1_1_160px]"
            >
              I'm in
            </button>
            <button
              type="button"
              onClick={() => choose('declined')}
              className="min-h-12 rounded-[14px] border border-field bg-white text-[15px] font-medium transition-colors hover:bg-wash lg:min-h-12.5 lg:flex-[1_1_160px]"
            >
              Can't make it
            </button>
          </div>
        </>
      )}

      {status === 'declined' && (
        <>
          <div>
            <h2 id="rsvp-heading" className="mb-1 font-display text-[22px] font-bold">
              We'll miss you
            </h2>
            <p className="text-[15px] leading-snug text-body">
              You've declined. Changed your mind? Your spot can still be saved.
            </p>
          </div>
          <button
            type="button"
            onClick={() => choose('accepted')}
            className="min-h-13 rounded-[14px] bg-brand text-base font-semibold text-white transition-colors hover:bg-brand-hover"
          >
            Count me in
          </button>
        </>
      )}
    </section>
  );
}
