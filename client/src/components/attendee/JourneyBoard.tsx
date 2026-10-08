import { Check, Clock, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import SessionCheckIn from '@/components/attendee/SessionCheckIn';
import { DayButton, DayJumpBar, PageRail } from '@/components/DayPager';
import type { AttendeeProgress } from '@/hooks/useAttendeeProgress';
import { useDayPaging } from '@/hooks/useDayPaging';
import { focusDay } from '@/utils/checkIn';
import { badgeHints, badgeProgress, XP } from '@/utils/gamification';
import { categoryLabel, categoryStyle } from '@/utils/format';

/** Stamp badges that can still be earned on the trip, for the "Badges in play" summary. */
const STAMP_BADGES = new Set(['frontrow', 'sealegs', 'fullhouse']);

/**
 * Desktop journey: a progress strip, then one column per day. A trip longer than three days is paged
 * three days at a time, opening on the page with the live or next session.
 */
export default function JourneyBoard({ progress }: { progress: AttendeeProgress }) {
  const { attendee, sessions, stamps, badges } = progress;
  const accepted = attendee.rsvpStatus === 'accepted';

  const days = [...new Set(sessions.map((session) => session.day))].sort((a, b) => a - b);
  const paging = useDayPaging(days, { initialDay: focusDay(sessions) });
  const unstamped = sessions.filter((session) => !stamps.has(session.id));
  const inPlay = badges.filter((badge) => STAMP_BADGES.has(badge.id) && !badge.earned);

  return (
    <div className="flex flex-col gap-6">
      <section
        aria-label="Journey progress"
        className="flex flex-wrap items-center gap-x-10 gap-y-4 rounded-[20px] border border-line bg-white px-5.5 py-4.5"
      >
        <div className="flex flex-[2_1_320px] flex-col gap-2.5">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Stamps collected</span>
            <span className="font-mono text-body">
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
        {accepted ? (
          <>
            <div className="flex-[1_1_140px]">
              <p className="text-[13px] text-body">XP still to collect</p>
              <p className="font-display text-2xl font-extrabold">
                {unstamped.length > 0 ? `+${unstamped.length * XP.stamp}` : 'All collected'}
              </p>
            </div>
            <div className="flex-[1_1_220px]">
              <p className="text-[13px] text-body">Badges in play</p>
              <p className="mt-1 text-[15px] font-medium">
                {inPlay.length > 0 ? inPlay.map((badge) => badge.name).join(' · ') : 'All earned'}
              </p>
            </div>
          </>
        ) : (
          <p
            id="stamp-hint"
            className="flex flex-[1_1_360px] flex-wrap items-center gap-x-3.5 gap-y-2 rounded-[14px] bg-warn-tint px-3.5 py-2.5 text-sm text-warn-ink"
          >
            <span className="flex-[1_1_200px]">RSVP to start collecting stamps.</span>
            <Link to="/attendee" className="inline-flex min-h-8 items-center font-semibold text-warn-ink underline">
              Go to Home
            </Link>
          </p>
        )}
      </section>

      {paging.paged && (
        <DayJumpBar
          days={days}
          page={paging.page}
          perPage={paging.perPage}
          renderDay={(day, onPage) => (
            <DayButton day={day} onPage={onPage} onSelect={() => paging.showDay(day)} />
          )}
          onPrevious={paging.previous}
          onNext={paging.next}
          previousRef={paging.previousButton}
          nextRef={paging.nextButton}
        />
      )}

      <div className="flex items-stretch gap-3">
        {paging.paged && paging.neighbours.previous && (
          <PageRail direction="previous" label={paging.neighbours.previous} onClick={paging.previous} />
        )}
        {/* auto-fill keeps a lone last day one column wide instead of stretching it across the board. */}
        <div
          className={`min-w-0 flex-1 items-start gap-4 ${
            paging.paged ? 'grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))]' : 'flex flex-wrap'
          }`}
        >
        {paging.visibleDays.map((day) => {
          const daySessions = sessions.filter((session) => session.day === day);
          return (
            <section
              key={day}
              aria-label={`Day ${day}`}
              className={`flex min-w-0 flex-col gap-3 rounded-[22px] bg-sunken p-3.5 ${paging.paged ? '' : 'flex-[1_1_320px]'}`}
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
                          {/* Lime on black only once the stamp is earned; the XP on offer is plain grey. */}
                          <span
                            className={`rounded-md px-2 py-0.75 text-xs font-semibold ${
                              stamped ? 'bg-ink text-lime' : 'bg-canvas text-body'
                            }`}
                          >
                            {stamped ? 'Stamped' : `+${XP.stamp} XP stamp`}
                          </span>
                          {hints.map((hint) => (
                            <span
                              key={hint}
                              className="rounded-md bg-brand-tint px-2 py-0.75 text-xs font-semibold text-brand-ink"
                            >
                              Counts toward {hint}
                            </span>
                          ))}
                        </div>

                        <SessionCheckIn
                          session={session}
                          attendeeId={attendee.id}
                          accepted={accepted}
                          stamped={stamped}
                          progress={badgeProgress(session, sessions, stamps)}
                          layout="desktop"
                          indentClass="pl-11.5"
                        />
                      </article>
                    </li>
                  );
                })}
              </ol>
            </section>
          );
        })}
        </div>
        {paging.paged && paging.neighbours.next && (
          <PageRail direction="next" label={paging.neighbours.next} onClick={paging.next} />
        )}
      </div>
    </div>
  );
}
