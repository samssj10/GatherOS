import { Link } from 'react-router-dom';
import type { AttendeeScheduleDTO } from '@/types';
import { categoryLabel, categoryStyle } from '@/utils/format';

/** The first day's sessions in order, with a link to the full journey. Desktop Home only. */
export default function DayGlance({ sessions }: { sessions: AttendeeScheduleDTO[] }) {
  const first = sessions[0];
  if (!first) return null;
  const today = sessions.filter((session) => session.day === first.day);

  return (
    <section
      aria-labelledby="glance-title"
      className="hidden flex-col rounded-3xl border border-line bg-white p-6 lg:flex"
    >
      <div className="mb-2.5 flex items-baseline justify-between">
        <h2 id="glance-title" className="font-display text-xl font-bold">
          Day {first.day} at a glance
        </h2>
        <Link to="/attendee/schedule" className="text-sm font-medium text-brand-ink underline hover:text-brand-deep">
          Full journey
        </Link>
      </div>

      <ul>
        {today.map((session) => (
          <li
            key={session.id}
            className="grid min-h-15 grid-cols-[110px_minmax(0,1fr)_auto] items-center gap-3.5 border-t border-hairline"
          >
            <span className="font-mono text-[13px] text-body">
              {session.startTime} – {session.endTime}
            </span>
            <div className="min-w-0">
              <p className="text-[15px] font-semibold">{session.sessionTitle}</p>
              <p className="text-[13px] text-muted">{session.locationName}</p>
            </div>
            <span className={`rounded-full px-2.25 py-0.75 text-xs font-semibold ${categoryStyle(session.category).badge}`}>
              {categoryLabel(session.category)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
