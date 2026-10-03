import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { AttendeeProgress } from '@/hooks/useAttendeeProgress';
import { XP } from '@/utils/gamification';
import { categoryStyle } from '@/utils/format';

/** One stamp per session: a dashed outline until the attendee checks in, then a solid mark. */
export default function StampGrid({ progress }: { progress: AttendeeProgress }) {
  const { sessions, stamps } = progress;

  return (
    <section
      aria-labelledby="stamps-title"
      className="flex flex-col gap-3.5 rounded-3xl border border-line bg-white p-5 lg:gap-4.5 lg:p-6"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="stamps-title" className="font-display text-[19px] font-bold lg:text-[22px]">
          Stamps
        </h2>
        <span className="font-mono text-xs text-body lg:hidden">
          {stamps.size} of {sessions.length}
          {stamps.size === 0 ? ' · check in to collect' : ''}
        </span>
        <span className="hidden text-sm text-body lg:inline">
          Check in at a session on your{' '}
          <Link to="/attendee/schedule" className="underline">
            Journey
          </Link>{' '}
          to stamp it · {XP.stamp} XP each
        </span>
      </div>

      <ul className="grid grid-cols-4 gap-x-2 gap-y-3 lg:flex lg:flex-wrap lg:gap-y-4">
        {sessions.map((session, index) => {
          const style = categoryStyle(session.category);
          const collected = stamps.has(session.id);
          return (
            <li key={session.id} className="flex flex-col items-center gap-1.5 text-center lg:flex-[1_1_120px] lg:gap-2">
              <span
                className={`flex size-15 flex-col items-center justify-center rounded-full font-display text-lg font-extrabold lg:size-21 lg:text-[22px] lg:leading-none ${
                  collected ? 'bg-ink text-lime' : `border-2 border-dashed ${style.ring} ${style.text}`
                }`}
                style={{ transform: `rotate(${((index % 3) - 1) * 6}deg)` }}
              >
                {collected ? (
                  <Check className="size-6 lg:size-7" strokeWidth={2.6} aria-hidden="true" />
                ) : (
                  index + 1
                )}
                <span className="mt-0.5 hidden font-mono text-[10px] font-normal lg:block" aria-hidden="true">
                  DAY {session.day}
                </span>
              </span>
              <span className="line-clamp-2 text-[11px] leading-tight text-body lg:line-clamp-none lg:text-[13px] lg:font-medium lg:text-ink">
                {session.sessionTitle}
                <span className="sr-only">{collected ? ' (stamped)' : ' (not yet stamped)'}</span>
              </span>
            </li>
          );
        })}
      </ul>

      <p className="text-[13px] text-muted lg:hidden">
        Check in at each session on your Journey to stamp it. Every stamp is worth {XP.stamp} XP.
      </p>
    </section>
  );
}
