import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { AttendeeScheduleDTO } from '@/types';

/** Teaser for the very first session, linking to the full journey. */
export default function FirstStopCard({ session }: { session: AttendeeScheduleDTO | undefined }) {
  if (!session) return null;

  return (
    <Link
      to="/attendee/schedule"
      className="flex items-center gap-3.5 rounded-[20px] border border-line bg-white p-4 text-ink no-underline transition-colors hover:bg-wash"
    >
      <span className="flex size-12 flex-none flex-col items-center justify-center rounded-[14px] bg-brand-tint leading-none text-brand-ink">
        <span className="text-[10px] font-semibold tracking-[0.06em]">DAY</span>
        <span className="font-display text-xl font-extrabold">{session.day}</span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs text-muted">First stop · {session.startTime}</span>
        <span className="block text-base font-semibold">{session.sessionTitle}</span>
        <span className="block text-[13px] text-body">{session.locationName}</span>
      </span>
      <ChevronRight className="size-5 text-muted" strokeWidth={2} aria-hidden="true" />
    </Link>
  );
}
