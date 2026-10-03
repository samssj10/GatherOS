import { Check, Clock, MapPin } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCheckIn } from '@/api/attendees';
import type { AttendeeProgress } from '@/hooks/useAttendeeProgress';
import { badgeHints, XP } from '@/utils/gamification';
import { categoryLabel, categoryStyle } from '@/utils/format';

/** Day tabs, the day's reward strip and the stop-by-stop timeline with check-in. */
export default function Journey({ progress }: { progress: AttendeeProgress }) {
  const { attendee, sessions, stamps } = progress;
  const checkIn = useCheckIn(attendee.id);

  const days = [...new Set(sessions.map((session) => session.day))].sort((a, b) => a - b);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const day = selectedDay !== null && days.includes(selectedDay) ? selectedDay : days[0];

  const accepted = attendee.rsvpStatus === 'accepted';
  const daySessions = sessions.filter((session) => session.day === day);
  const unstampedXp = daySessions.filter((session) => !stamps.has(session.id)).length * XP.stamp;

  if (sessions.length === 0) {
    return <p className="text-sm text-body">No sessions have been scheduled yet.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div role="group" aria-label="Choose a day" className="grid grid-cols-3 gap-1.5 rounded-2xl bg-line p-1.25">
        {days.map((value) => {
          const active = value === day;
          const count = sessions.filter((session) => session.day === value).length;
          return (
            <button
              key={value}
              type="button"
              aria-pressed={active}
              onClick={() => setSelectedDay(value)}
              className={`flex min-h-12 flex-col items-center justify-center gap-px rounded-xl transition-colors ${
                active ? 'bg-white text-ink shadow-sm' : 'text-body hover:bg-white/50'
              }`}
            >
              <span className="text-[15px] font-semibold">Day {value}</span>
              <span className="font-mono text-[11px]">
                {count} {count === 1 ? 'stop' : 'stops'}
              </span>
            </button>
          );
        })}
      </div>

      {!accepted && (
        <p
          id="stamp-hint"
          className="rounded-xl bg-warn-tint px-3.5 py-2.5 text-sm text-warn-ink"
        >
          Accept your RSVP on{' '}
          <Link to="/attendee" className="font-semibold underline">
            Home
          </Link>{' '}
          to start collecting stamps.
        </p>
      )}

      <div className="flex items-center justify-between rounded-2xl bg-ink px-4 py-3 text-canvas">
        <span className="text-sm">Day {day} rewards</span>
        <span className="font-mono text-[13px] font-semibold text-lime">
          {unstampedXp > 0 ? `up to +${unstampedXp} XP` : 'All stamps collected'}
        </span>
      </div>

      <ol className="flex flex-col gap-3.5">
        {daySessions.map((session, index) => {
          const style = categoryStyle(session.category);
          const stamped = stamps.has(session.id);
          const stop = sessions.findIndex((entry) => entry.id === session.id) + 1;
          const hints = badgeHints(session, sessions);
          const last = index === daySessions.length - 1;

          return (
            <li key={session.id} className="flex items-stretch gap-3">
              <div className="flex flex-none basis-10 flex-col items-center">
                <span
                  className={`flex size-10 items-center justify-center rounded-full font-display text-base font-extrabold ${
                    stamped ? `${style.dot} text-white` : `border-2 border-dashed bg-white ${style.ring} ${style.text}`
                  }`}
                >
                  {stamped ? (
                    <Check className="size-5" strokeWidth={2.6} aria-hidden="true" />
                  ) : (
                    <>
                      <span className="sr-only">Stop </span>
                      {stop}
                    </>
                  )}
                  {stamped && <span className="sr-only">Stop {stop}, stamped</span>}
                </span>
                {!last && <span className="mt-1 w-0.5 flex-1 bg-[#d3d6e0]" aria-hidden="true" />}
              </div>

              <article className="flex min-w-0 flex-1 flex-col gap-2 rounded-[18px] border border-line bg-white p-4">
                <div className="flex items-start gap-2">
                  <h2 className="flex-1 font-display text-lg leading-tight font-bold">{session.sessionTitle}</h2>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${style.badge}`}>
                    {categoryLabel(session.category)}
                  </span>
                </div>
                <div className="flex flex-col gap-1 text-sm text-body">
                  <span className="inline-flex items-center gap-2">
                    <Clock className="size-3.75" strokeWidth={2} aria-hidden="true" />
                    {session.startTime} – {session.endTime}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <MapPin className="size-3.75" strokeWidth={2} aria-hidden="true" />
                    {session.locationName}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 border-t border-hairline pt-2">
                  <span className="inline-flex items-center gap-1 rounded-md bg-ink px-2 py-1 font-mono text-[11px] font-semibold text-lime">
                    {stamped ? 'Stamped' : `+${XP.stamp} XP stamp`}
                  </span>
                  {(session.category === 'activity' || session.category === 'workshop') && (
                    <span className="rounded-md bg-warn-tint px-2 py-0.75 text-xs font-semibold text-warn-ink">
                      RSVP required
                    </span>
                  )}
                  {hints.map((hint) => (
                    <span
                      key={hint}
                      className="rounded-md bg-brand-tint px-2 py-0.75 text-xs font-semibold text-brand-ink"
                    >
                      Counts toward {hint}
                    </span>
                  ))}
                  {!stamped && (
                    <button
                      type="button"
                      disabled={!accepted || checkIn.isPending}
                      aria-describedby={accepted ? undefined : 'stamp-hint'}
                      onClick={() => checkIn.mutate(session.id)}
                      className="ml-auto min-h-11 rounded-xl bg-brand px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:bg-line disabled:text-muted"
                    >
                      Check in
                      <span className="sr-only"> to {session.sessionTitle}</span>
                    </button>
                  )}
                </div>
              </article>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
