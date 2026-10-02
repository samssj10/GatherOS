import { useAttendee, useUpdateAttendee } from '@/api/attendees';
import ErrorNotice from '@/components/ErrorNotice';
import Skeleton from '@/components/Skeleton';
import type { Attendee } from '@/types';

type RsvpStatus = Attendee['rsvpStatus'];

const STATUS_COPY: Record<RsvpStatus, { title: string; detail: string; tone: string }> = {
  pending: {
    title: 'Will you be joining us?',
    detail: 'Let the organizers know so they can plan for you.',
    tone: 'text-amber-500',
  },
  accepted: {
    title: "You're going!",
    detail: 'Your spot is confirmed. You can change your answer any time.',
    tone: 'text-emerald-600',
  },
  declined: {
    title: "You've declined",
    detail: 'Changed your mind? You can still accept.',
    tone: 'text-rose-500',
  },
};

export default function RsvpCard({ attendeeId }: { attendeeId: string }) {
  const { data: attendee, isPending, isError, refetch } = useAttendee(attendeeId);
  const update = useUpdateAttendee(attendeeId);

  if (isError) {
    return <ErrorNotice message="Could not load your RSVP." onRetry={() => void refetch()} />;
  }

  if (isPending) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="mt-6 h-12 w-full" />
        <Skeleton className="mt-3 h-12 w-full" />
      </div>
    );
  }

  const status = attendee.rsvpStatus;
  const copy = STATUS_COPY[status];

  const choose = (next: RsvpStatus) => {
    if (next !== status) update.mutate({ rsvpStatus: next });
  };

  return (
    <section
      aria-labelledby="rsvp-heading"
      className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      {/* The optimistic cache value drives this text, so it changes the instant a button is pressed. */}
      <div aria-live="polite">
        <h2 id="rsvp-heading" className={`text-xl font-bold tracking-tight ${copy.tone}`}>
          {copy.title}
        </h2>
        <p className="mt-1 text-sm text-slate-500">{copy.detail}</p>
      </div>

      <div className="mt-6 space-y-3">
        <button
          type="button"
          aria-pressed={status === 'accepted'}
          onClick={() => choose('accepted')}
          className={`h-12 w-full rounded-lg text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
            status === 'accepted'
              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
              : 'border border-slate-200 bg-white text-slate-900 hover:bg-slate-50'
          }`}
        >
          Accept RSVP
        </button>
        <button
          type="button"
          aria-pressed={status === 'declined'}
          onClick={() => choose('declined')}
          className={`h-12 w-full rounded-lg text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
            status === 'declined'
              ? 'bg-rose-500 text-white hover:bg-rose-600'
              : 'border border-slate-200 bg-white text-slate-900 hover:bg-slate-50'
          }`}
        >
          Decline
        </button>
      </div>
    </section>
  );
}
