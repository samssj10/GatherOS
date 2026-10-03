import { Check } from 'lucide-react';
import type { AttendeeProgress } from '@/hooks/useAttendeeProgress';
import { XP } from '@/utils/gamification';
import { categoryStyle } from '@/utils/format';

/** One stamp per session: a dashed outline until the attendee checks in, then a solid mark. */
export default function StampGrid({ progress }: { progress: AttendeeProgress }) {
  const { sessions, stamps } = progress;

  return (
    <section
      aria-labelledby="stamps-title"
      className="flex flex-col gap-3.5 rounded-3xl border border-line bg-white p-5"
    >
      <div className="flex items-baseline justify-between">
        <h2 id="stamps-title" className="font-display text-[19px] font-bold">
          Stamps
        </h2>
        <span className="font-mono text-xs text-body">
          {stamps.size} of {sessions.length}
          {stamps.size === 0 ? ' · check in to collect' : ''}
        </span>
      </div>

      <ul className="grid grid-cols-4 gap-x-2 gap-y-3">
        {sessions.map((session, index) => {
          const style = categoryStyle(session.category);
          const collected = stamps.has(session.id);
          return (
            <li key={session.id} className="flex flex-col items-center gap-1.5 text-center">
              <span
                className={`flex size-15 items-center justify-center rounded-full font-display text-lg font-extrabold ${
                  collected ? 'bg-ink text-lime' : `border-2 border-dashed ${style.ring} ${style.text}`
                }`}
                style={{ transform: `rotate(${((index % 3) - 1) * 6}deg)` }}
              >
                {collected ? <Check className="size-6" strokeWidth={2.6} aria-hidden="true" /> : index + 1}
              </span>
              <span className="line-clamp-2 text-[11px] leading-tight text-body">
                {session.sessionTitle}
                <span className="sr-only">{collected ? ' (stamped)' : ' (not yet stamped)'}</span>
              </span>
            </li>
          );
        })}
      </ul>

      <p className="text-[13px] text-muted">
        Check in at each session on your Journey to stamp it. Every stamp is worth {XP.stamp} XP.
      </p>
    </section>
  );
}
