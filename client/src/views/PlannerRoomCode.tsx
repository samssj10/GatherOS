import { ArrowLeft, RotateCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useCheckInCode, usePlannerSchedule } from '@/api/schedule';
import ErrorNotice from '@/components/ErrorNotice';
import QrCode from '@/components/QrCode';
import { usePageTitle } from '@/hooks/usePageTitle';
import { buildCheckInPayload, formatCountdown, secondsRemaining } from '@/utils/checkIn';
import { formatNumber } from '@/utils/format';
import { XP } from '@/utils/gamification';

/** Re-render once a second so the countdown moves. */
function useNow(): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return now;
}

/**
 * Full-screen display for a room: project it at the front. Attendees scan the QR code with the app
 * or type the 6-character code under it. The code changes every minute.
 */
export default function PlannerRoomCode() {
  const { id } = useParams();
  const schedule = usePlannerSchedule();
  const code = useCheckInCode(id);
  const now = useNow();

  const ordered = [...(schedule.data ?? [])].sort(
    (a, b) => a.day - b.day || a.startTime.localeCompare(b.startTime),
  );
  const index = ordered.findIndex((item) => item.id === id);
  const session = index >= 0 ? ordered[index] : undefined;

  usePageTitle(session ? `Check-in code · ${session.title}` : 'Check-in code');

  const info = code.data;
  const remaining = info ? secondsRemaining(info, now - code.dataUpdatedAt) : 0;
  const refetch = code.refetch;
  // Ask for the next code the moment this one runs out, rather than waiting for the next poll.
  useEffect(() => {
    if (info && remaining === 0) void refetch();
  }, [info, remaining, refetch]);

  const shown = formatNumber;
  const pct = info && info.eligible > 0 ? Math.min(100, Math.round((info.checkedIn / info.eligible) * 100)) : 0;

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="flex min-h-screen flex-col justify-center gap-12 bg-ink px-6 py-10 text-canvas focus:outline-none sm:px-12 lg:flex-row lg:items-center lg:gap-20 lg:px-20 lg:py-16"
    >
      {code.isError || (!code.isPending && !info) ? (
        <div className="mx-auto w-full max-w-md text-ink">
          <ErrorNotice message="Could not load the check-in code." onRetry={() => void code.refetch()} />
          <Link to="/planner" className="mt-4 inline-block text-sm font-semibold text-lime">
            Back to the dashboard
          </Link>
        </div>
      ) : (
        <>
          <div className="flex min-w-0 flex-1 flex-col gap-7">
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-brand font-display text-[21px] font-extrabold text-white">
                G
              </span>
              <p className="font-mono text-[15px] uppercase tracking-[0.08em] text-lime">
                {session
                  ? `Stop ${index + 1} · Day ${session.day} · ${session.startTime} – ${session.endTime}`
                  : 'Check-in'}
              </p>
              <Link
                to="/planner"
                className="ml-auto inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm text-ink-text-2 no-underline transition-colors hover:bg-ink-raised hover:text-white"
              >
                <ArrowLeft className="size-4" strokeWidth={2} aria-hidden="true" />
                Dashboard
              </Link>
            </div>

            <h1 className="font-display text-5xl leading-[0.98] font-extrabold tracking-[-0.03em] sm:text-7xl xl:text-[88px]">
              {session?.title ?? 'Loading…'}
            </h1>

            <p className="max-w-160 text-2xl leading-snug text-ink-text-2 lg:text-3xl">
              Scan to collect your stamp and <span className="font-semibold text-lime">+{XP.stamp} XP</span>. Open
              GatherOS, go to Journey, and tap Scan.
            </p>

            {info && info.status !== 'live' && (
              <p role="status" className="max-w-160 rounded-2xl border border-ink-line bg-ink-raised px-5 py-4 text-lg text-ink-text-2">
                {info.status === 'upcoming'
                  ? `Not live yet. Check-in opens at ${session?.startTime ?? 'the start time'}, and the server won't accept codes before then.`
                  : 'Check-in has closed. This session has ended.'}
              </p>
            )}

            <div className="max-w-115">
              <div className="mb-2.5 flex justify-between text-xl">
                <span>Checked in</span>
                <span className="font-mono">
                  {info ? `${shown(info.checkedIn)} of ${shown(info.eligible)}` : '…'}
                </span>
              </div>
              <div
                role="progressbar"
                aria-label="Attendees checked in"
                aria-valuemin={0}
                aria-valuemax={info?.eligible ?? 0}
                aria-valuenow={info?.checkedIn ?? 0}
                className="h-3.5 overflow-hidden rounded-[7px] bg-ink-line"
              >
                <div
                  className="h-full rounded-[7px] bg-lime transition-[width] duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex w-full max-w-117.5 flex-none flex-col items-center gap-6 self-center lg:w-117.5">
            <div className="rounded-4xl bg-white p-5 text-ink sm:p-8">
              {info ? (
                <QrCode
                  value={buildCheckInPayload(info.sessionId, info.code)}
                  label={`QR code for checking in to ${session?.title ?? 'this session'}`}
                  className="size-72 sm:size-90"
                />
              ) : (
                <div className="size-72 sm:size-90" />
              )}
            </div>
            <div className="text-center">
              <p className="text-lg text-ink-text-2">Can't scan? Enter this code</p>
              <p
                aria-label={info ? `Code ${info.code.split('').join(' ')}` : undefined}
                className="mt-1.5 pl-[0.25em] font-mono text-5xl font-semibold tracking-[0.25em] sm:text-[56px]"
              >
                {info?.code ?? '······'}
              </p>
              <p className="mt-2.5 inline-flex items-center gap-2 text-base text-ink-text-3">
                <RotateCw className="size-4" strokeWidth={2} aria-hidden="true" />
                New code in {formatCountdown(remaining)}
              </p>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
