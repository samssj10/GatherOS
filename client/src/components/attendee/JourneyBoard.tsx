import { Check, Clock, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCheckIn } from '@/api/attendees';
import type { AttendeeProgress } from '@/hooks/useAttendeeProgress';
import { badgeHints, XP } from '@/utils/gamification';
import { categoryLabel, categoryStyle } from '@/utils/format';

/** Stamp badges that can still be earned on the trip, for the "Badges in play" summary. */
const STAMP_BADGES = new Set(['frontrow', 'sealegs', 'fullhouse']);

/** Desktop journey: a progress strip, then one column per day. */
export default function JourneyBoard({ progress }: { progress: AttendeeProgress }) {
  const { attendee, sessions, stamps, badges } = progress;
  const checkIn = useCheckIn(attendee.id);
  const accepted = attendee.rsvpStatus === 'accepted';

  const days = [...new Set(sessions.map((session) => session.day))].sort((a, b) => a - b);
  const unstamped = sessions.filter((session) => !stamps.has(session.id));
  const inPlay = badges.filter((badge) => STAMP_BADGES.has(badge.id) && !badge.earned);

  return (
    <div className="flex flex-col gap-6">
      {!accepted && (
        <p id="stamp-hint" className="rounded-xl bg-warn-tint px-3.5 py-2.5 text-sm text-warn-ink">
          Accept your RSVP on{' '}
          <Link to="/attendee" className="font-semibold underline">
            Home
          </Link>{' '}
          to start collecting stamps.
        </p>
      )}

      <section
        aria-label="Journey progress"
        className="flex flex-wrap items-center gap-x-10 gap-y-5 rounded-[20px] bg-ink px-6 py-5 text-canvas"
      >
        <div className="flex flex-[2_1_320px] flex-col gap-2.5">
          <div className="flex justify-between text-sm">
            <span>Stamps collected</span>
            <span className="font-mono text-lime">
              {stamps.size} / {sessions.length}
            </span>
          </div>
          <div className="flex gap-1.5" aria-hidden="true">
            {sessions.map((session) => (
              <span
                key={session.id}
                className={`h-2 flex-1 rounded-sm ${categoryStyle(session.category).dot} ${
                  stamps.has(session.id) ? '' : 'opacity-35'
                }`}
              />
            ))}
          </div>
        </div>
        <div className="flex-[1_1_140px]">
          <p className="text-[13px] text-ink-text-2">XP up for grabs</p>
          <p className="font-display text-[26px] font-extrabold text-lime">
            {unstamped.length > 0 ? `+${unstamped.length * XP.stamp}` : 'All collected'}
          </p>
        </div>
        <div className="flex-[1_1_220px]">
          <p className="text-[13px] text-ink-text-2">Badges in play</p>
          <p className="mt-1 text-[15px] font-medium">
            {inPlay.length > 0 ? inPlay.map((badge) => badge.name).join(' · ') : 'All earned'}
          </p>
        </div>
      </section>

      <div className="flex flex-wrap items-start gap-4">
        {days.map((day) => {
          const daySessions = sessions.filter((session) => session.day === day);
          return (
            <section
              key={day}
              aria-label={`Day ${day}`}
              className="flex min-w-0 flex-[1_1_320px] flex-col gap-3 rounded-[22px] bg-sunken p-3.5"
            >
              <div className="flex items-center justify-between px-1.5 py-1">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-8.5 items-center justify-center rounded-[10px] bg-ink font-display text-base font-extrabold text-lime">
                    {day}
                  </span>
                  <h2 className="font-display text-[19px] font-bold">Day {day}</h2>
                </div>
                <span className="font-mono text-xs text-body">
                  {daySessions.length} {daySessions.length === 1 ? 'stop' : 'stops'} · +{daySessions.length * XP.stamp} XP
                </span>
              </div>

              <ol className="flex flex-col gap-3">
                {daySessions.map((session) => {
                  const style = categoryStyle(session.category);
                  const stamped = stamps.has(session.id);
                  const stop = sessions.findIndex((entry) => entry.id === session.id) + 1;
                  const hints = badgeHints(session, sessions);

                  return (
                    <li key={session.id}>
                      <article className="flex flex-col gap-2.5 rounded-[18px] bg-white p-4.5 shadow-[0_1px_2px_rgb(20_22_31/0.06)]">
                        <div className="flex items-start gap-3">
                          <span
                            className={`flex size-8.5 flex-none items-center justify-center rounded-full font-display text-sm font-extrabold ${
                              stamped ? `${style.dot} text-white` : `border-2 border-dashed ${style.ring} ${style.text}`
                            }`}
                          >
                            {stamped ? (
                              <>
                                <Check className="size-4.5" strokeWidth={2.6} aria-hidden="true" />
                                <span className="sr-only">Stop {stop}, stamped</span>
                              </>
                            ) : (
                              <>
                                <span className="sr-only">Stop </span>
                                {stop}
                              </>
                            )}
                          </span>
                          <h3 className="mt-1 flex-1 font-display text-[17px] leading-tight font-bold">
                            {session.sessionTitle}
                          </h3>
                          <span className={`rounded-full px-2.25 py-0.75 text-xs font-semibold ${style.badge}`}>
                            {categoryLabel(session.category)}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-x-4 gap-y-1 pl-11.5 text-sm text-body">
                          <span className="inline-flex items-center gap-1.5">
                            <Clock className="size-3.5" strokeWidth={2} aria-hidden="true" />
                            {session.startTime} – {session.endTime}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="size-3.5" strokeWidth={2} aria-hidden="true" />
                            {session.locationName}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-1.5 pl-11.5">
                          <span className="rounded-md bg-ink px-2 py-1 font-mono text-[11px] font-semibold text-lime">
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
                        </div>

                        {!stamped && (
                          <div className="flex justify-end border-t border-hairline pt-2.5 pl-11.5">
                            <button
                              type="button"
                              disabled={!accepted || checkIn.isPending}
                              aria-describedby={accepted ? undefined : 'stamp-hint'}
                              onClick={() => checkIn.mutate(session.id)}
                              className="min-h-10 rounded-xl bg-brand px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:bg-line disabled:text-muted"
                            >
                              Check in
                              <span className="sr-only"> to {session.sessionTitle}</span>
                            </button>
                          </div>
                        )}
                      </article>
                    </li>
                  );
                })}
              </ol>
            </section>
          );
        })}
      </div>
    </div>
  );
}
