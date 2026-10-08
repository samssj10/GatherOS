import { ArrowLeft, RotateCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useCheckInCode, usePlannerSchedule } from '@/api/schedule';
import ErrorNotice from '@/components/ErrorNotice';
import QrCode from '@/components/QrCode';
import RoomScreen from '@/components/planner/RoomScreen';
import { usePageTitle } from '@/hooks/usePageTitle';
import { buildCheckInPayload, formatCountdown, secondsRemaining } from '@/utils/checkIn';
import { formatNumber } from '@/utils/format';

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

  const pct = info && info.eligible > 0 ? Math.min(100, Math.round((info.checkedIn / info.eligible) * 100)) : 0;

  if (code.isError || (!code.isPending && !info)) {
    return (
      <main
        id="main-content"
        tabIndex={-1}
        className="flex min-h-screen flex-col justify-center bg-ink px-6 py-10 focus:outline-none"
      >
        <div className="mx-auto w-full max-w-md text-ink">
          <ErrorNotice message="Could not load the check-in code." onRetry={() => void code.refetch()} />
          <Link to="/planner" className="mt-4 inline-block text-sm font-semibold text-lime">
            Back to the dashboard
          </Link>
        </div>
      </main>
    );
  }

  const notice =
    info && info.status !== 'live'
      ? info.status === 'upcoming'
        ? `Not live yet. Check-in opens at ${session?.startTime ?? 'the start time'}, and the server won't accept codes before then.`
        : 'Check-in has closed. This session has ended.'
      : undefined;

  return (
    <RoomScreen
      stop={session ? `Stop ${index + 1} · Day ${session.day} · ${session.startTime} – ${session.endTime}` : 'Check-in'}
      stopAction={
        <Link
          to="/planner"
          className="ml-auto inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm text-ink-text-2 no-underline transition-colors hover:bg-ink-raised hover:text-white"
        >
          <ArrowLeft className="size-4" strokeWidth={2} aria-hidden="true" />
          Dashboard
        </Link>
      }
      title={session?.title ?? 'Loading…'}
      notice={notice}
      checked={{
        value: info ? `${formatNumber(info.checkedIn)} of ${formatNumber(info.eligible)}` : '…',
        percent: pct,
        meter: { now: info?.checkedIn ?? 0, max: info?.eligible ?? 0 },
      }}
      qr={
        info ? (
          <QrCode
            value={buildCheckInPayload(info.sessionId, info.code)}
            label={`QR code for checking in to ${session?.title ?? 'this session'}`}
            className="size-72 sm:size-90"
          />
        ) : (
          <div className="size-72 sm:size-90" />
        )
      }
      code={{
        text: info?.code ?? '······',
        spoken: info ? `Code ${info.code.split('').join(' ')}` : undefined,
      }}
      codeNote={
        <p className="mt-2.5 inline-flex items-center gap-2 text-base text-ink-text-3">
          <RotateCw className="size-4" strokeWidth={2} aria-hidden="true" />
          New code in {formatCountdown(remaining)}
        </p>
      }
    />
  );
}
