import { ChevronLeft, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ApiError } from '@/api/client';
import { useCheckInWithCode } from '@/api/attendees';
import ErrorNotice from '@/components/ErrorNotice';
import { useAttendeeProgress } from '@/hooks/useAttendeeProgress';
import type { AttendeeProgress } from '@/hooks/useAttendeeProgress';
import { useAuth } from '@/hooks/useAuth';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useQrScanner } from '@/hooks/useQrScanner';
import type { AttendeeScheduleDTO } from '@/types';
import { isCompleteCode, liveSessions, nextSession, normalizeCode, parseCheckInPayload } from '@/utils/checkIn';
import { badgeProgress, XP } from '@/utils/gamification';

/** Why the last attempt did not go through, in words ready to show. */
interface Issue {
  message: string;
  /** The attendee has not accepted yet, so offer a way to do that. */
  needsRsvp: boolean;
}

const toIssue = (error: unknown): Issue =>
  error instanceof ApiError
    ? { message: error.message, needsRsvp: error.code === 'NOT_GOING' }
    : { message: 'Could not check in. Please try again.', needsRsvp: false };

/** Why the camera is not being used, shown on the manual entry screen. */
type CameraProblem = 'denied' | 'unavailable' | null;

const primaryButton =
  'flex min-h-13 items-center justify-center rounded-[14px] bg-lime text-base font-semibold text-ink no-underline transition-colors hover:bg-lime-hover hover:text-ink';
const secondaryButton =
  'flex min-h-12 items-center justify-center rounded-[14px] border border-ink-track text-[15px] font-medium text-canvas no-underline transition-colors hover:bg-ink-raised hover:text-canvas';

function Screen({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-night text-canvas [&_*:focus-visible]:outline-lime">
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto flex min-h-screen w-full max-w-md flex-col focus:outline-none"
      >
        <header className="flex items-center gap-2 px-3 pt-4 pb-2">
          <Link
            to="/attendee/schedule"
            aria-label="Back to journey"
            className="flex size-11 items-center justify-center rounded-xl text-canvas no-underline hover:bg-ink-raised hover:text-canvas"
          >
            <ChevronLeft className="size-5.5" strokeWidth={2} aria-hidden="true" />
          </Link>
          <h1 className="flex-1 font-display text-xl font-bold">Check in</h1>
        </header>
        {children}
      </main>
    </div>
  );
}

function SessionSummary({ session, stop }: { session: AttendeeScheduleDTO; stop: number }) {
  return (
    <div className="px-5">
      <div className="flex items-center gap-3 rounded-2xl border border-ink-line bg-ink-raised px-3.5 py-3">
        <span className="flex size-9 flex-none items-center justify-center rounded-full border-2 border-dashed border-brand-soft font-display text-[15px] font-extrabold text-brand-glow">
          {stop}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold">{session.sessionTitle}</p>
          <p className="text-[13px] text-ink-text">
            {session.locationName} · {session.startTime} – {session.endTime}
          </p>
        </div>
        <span className="rounded-md bg-lime px-1.75 py-0.75 font-mono text-[11px] font-semibold text-ink">
          +{XP.stamp} XP
        </span>
      </div>
    </div>
  );
}

function IssueBanner({ issue }: { issue: Issue }) {
  return (
    <div
      role="alert"
      className="mx-5 mt-4 rounded-[14px] border border-bad-line bg-bad-night px-4 py-3.5 text-sm leading-snug text-bad-glow"
    >
      {issue.message}
      {issue.needsRsvp && (
        <Link to="/attendee" className="mt-1.5 block font-semibold text-lime">
          Go to Home to accept
        </Link>
      )}
    </div>
  );
}

function Corner({ className }: { className: string }) {
  return <span className={`absolute size-11 border-lime ${className}`} aria-hidden="true" />;
}

/** The camera view. It reads codes and hands each one up; the parent decides what to do with it. */
function ScanPane({
  session,
  issue,
  onScanned,
  onProblem,
  onManual,
}: {
  session: AttendeeScheduleDTO;
  issue: Issue | null;
  onScanned: (text: string) => void;
  onProblem: (problem: Exclude<CameraProblem, null>) => void;
  onManual: () => void;
}) {
  const { videoRef, status } = useQrScanner(onScanned);
  // The parent switches to manual entry when the camera cannot be used.
  const problem = status === 'denied' || status === 'unavailable' ? status : null;
  useEffect(() => {
    if (problem) onProblem(problem);
  }, [problem, onProblem]);

  return (
    <>
      {issue && <IssueBanner issue={issue} />}
      <div className="flex flex-1 flex-col items-center gap-5 px-5 pt-7 pb-5">
        <div
          className="relative size-68 overflow-hidden rounded-[28px] bg-ink-raised"
          aria-hidden="true"
        >
          <video ref={videoRef} playsInline muted className="absolute inset-0 size-full object-cover" />
          <Corner className="top-3.5 left-3.5 rounded-tl-[14px] border-t-4 border-l-4" />
          <Corner className="top-3.5 right-3.5 rounded-tr-[14px] border-t-4 border-r-4" />
          <Corner className="bottom-3.5 left-3.5 rounded-bl-[14px] border-b-4 border-l-4" />
          <Corner className="right-3.5 bottom-3.5 rounded-br-[14px] border-r-4 border-b-4" />
          <span className="absolute top-1/2 right-8.5 left-8.5 h-0.5 bg-lime opacity-70" />
        </div>
        <p className="sr-only" role="status">
          {status === 'starting' ? 'Starting the camera.' : 'Camera ready. Point it at the code on the screen.'}
        </p>
        <div className="flex flex-col gap-1.5 text-center">
          <p className="font-display text-xl font-bold">Point at the code on the screen</p>
          <p className="text-sm leading-snug text-ink-text">
            It's shown at the front of the {session.locationName} while the session runs.
          </p>
        </div>
        <div className="mt-auto flex w-full flex-col gap-2.5">
          <button type="button" onClick={onManual} className={`${secondaryButton} min-h-12.5 font-semibold`}>
            Can't scan? Enter the code
          </button>
          <p className="text-center text-xs text-ink-text-3">GatherOS uses your camera only while this screen is open.</p>
        </div>
      </div>
    </>
  );
}

function ManualPane({
  issue,
  pending,
  cameraProblem,
  onSubmit,
  onScan,
}: {
  issue: Issue | null;
  pending: boolean;
  cameraProblem: CameraProblem;
  onSubmit: (code: string) => void;
  onScan: () => void;
}) {
  const [code, setCode] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const error = localError ?? issue?.message ?? null;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!isCompleteCode(code)) {
      setLocalError('The code has 6 characters. Check the screen and try again.');
      return;
    }
    onSubmit(normalizeCode(code));
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-1 flex-col gap-3.5 px-5 pt-7 pb-5">
      {cameraProblem && (
        <p role="status" className="rounded-xl border border-ink-line bg-ink-raised px-3.5 py-3 text-sm text-ink-text-2">
          {cameraProblem === 'denied'
            ? 'Camera access is blocked, so enter the code instead.'
            : "This device's camera isn't available, so enter the code instead."}
        </p>
      )}
      <label htmlFor="room-code" className="font-display text-[22px] font-bold">
        Enter the room code
      </label>
      <p id="code-hint" className="text-sm leading-snug text-ink-text">
        Type the 6 characters shown under the QR code on the screen. Codes change every minute.
      </p>
      <input
        id="room-code"
        type="text"
        inputMode="text"
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        maxLength={6}
        placeholder="K7Q2XM"
        value={code}
        onChange={(event) => {
          setCode(normalizeCode(event.target.value));
          setLocalError(null);
        }}
        aria-invalid={error !== null}
        aria-describedby="code-hint code-error"
        className={`min-h-16 rounded-2xl border-2 bg-ink-raised px-4 text-center font-mono text-[28px] tracking-[0.35em] text-white uppercase placeholder:text-ink-text-3 ${
          error ? 'border-bad-soft' : 'border-ink-track'
        }`}
      />
      <span id="code-error" role="alert" className="min-h-5 text-sm text-bad-soft">
        {error}
        {issue?.needsRsvp && !localError && (
          <Link to="/attendee" className="mt-1 block font-semibold text-lime">
            Go to Home to accept
          </Link>
        )}
      </span>
      <div className="mt-auto flex flex-col gap-2.5">
        <button type="submit" disabled={pending} className={`${primaryButton} disabled:opacity-60`}>
          {pending ? 'Checking…' : 'Check in'}
        </button>
        {cameraProblem !== 'unavailable' && (
          <button type="button" onClick={onScan} className="min-h-12 text-[15px] text-canvas underline">
            Scan instead
          </button>
        )}
      </div>
    </form>
  );
}

function DonePane({ progress, session, stop }: { progress: AttendeeProgress; session: AttendeeScheduleDTO; stop: number }) {
  const { level } = progress;
  const barMax = level.next ? level.xp + level.next.xpToGo : level.xp || 1;
  const badge = badgeProgress(session, progress.sessions, progress.stamps)[0];

  return (
    <div role="status" className="flex flex-1 flex-col items-center gap-4.5 px-5 pt-8 pb-5 text-center">
      <div className="flex size-44 -rotate-10 items-center justify-center rounded-full border-[3px] border-dashed border-lime">
        <div className="flex size-36 flex-col items-center justify-center gap-0.5 rounded-full bg-lime text-ink">
          <span className="font-mono text-[11px] font-semibold tracking-widest">
            STOP {stop} · DAY {session.day}
          </span>
          <span className="px-3 font-display text-[22px] leading-[1.05] font-extrabold">{session.sessionTitle}</span>
        </div>
      </div>
      <div>
        <h2 className="font-display text-[28px] font-extrabold">Stamp collected</h2>
        <p className="mt-1.5 font-mono text-[15px] font-semibold text-lime">+{XP.stamp} XP</p>
      </div>
      <div className="flex w-full flex-col gap-3 rounded-2xl border border-ink-line bg-ink-raised px-4 py-3.5 text-left">
        <div>
          <div className="flex justify-between text-sm">
            <span>
              Level {level.level} · {level.rank}
            </span>
            <span className="font-mono">{level.next ? `${level.xp} / ${barMax} XP` : `${level.xp} XP`}</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded bg-ink-line">
            <div className="h-full rounded bg-lime" style={{ width: `${level.pct}%` }} />
          </div>
        </div>
        {badge && (
          <div className="flex items-center gap-2.5 border-t border-ink-line pt-3 text-sm">
            <span className="size-7 rotate-45 rounded-lg border border-brand-soft bg-brand-night" aria-hidden="true" />
            <span className="flex-1">
              {badge.badge} badge · {badge.done} of {badge.total} {badge.noun}
            </span>
          </div>
        )}
      </div>
      <div className="mt-auto flex w-full flex-col gap-2.5">
        <Link to="/attendee/schedule" className={primaryButton}>
          Back to journey
        </Link>
        <Link to="/attendee/passport" className={secondaryButton}>
          View passport
        </Link>
      </div>
    </div>
  );
}

function NothingPane({ progress, allStamped }: { progress: AttendeeProgress; allStamped: boolean }) {
  const next = nextSession(progress.sessions);

  return (
    <div className="flex flex-1 flex-col items-center gap-4.5 px-5 pt-12 pb-5 text-center">
      <div className="flex size-30 items-center justify-center rounded-full border-[3px] border-dashed border-ink-track text-ink-text-3">
        <Clock className="size-11" strokeWidth={1.6} aria-hidden="true" />
      </div>
      <div>
        <h2 className="font-display text-2xl font-bold">Nothing to check in to yet</h2>
        <p className="mt-2 text-[15px] leading-snug text-ink-text">
          {allStamped
            ? "You've collected every stamp that is open right now."
            : 'Check-in opens when a session starts and closes when it ends.'}
        </p>
      </div>
      {next && (
        <div className="flex w-full items-center gap-3 rounded-2xl border border-ink-line bg-ink-raised p-3.5 text-left">
          <span className="flex size-11 flex-none flex-col items-center justify-center rounded-xl bg-brand-night leading-none text-brand-glow">
            <span className="text-[9px] font-semibold">NEXT</span>
            <span className="mt-0.5 font-mono text-[13px] font-semibold">{next.startTime}</span>
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-semibold">{next.sessionTitle}</p>
            <p className="text-[13px] text-ink-text">
              {next.locationName} · Day {next.day}
            </p>
          </div>
        </div>
      )}
      <Link to="/attendee/schedule" className={`${primaryButton} mt-auto w-full`}>
        Back to journey
      </Link>
    </div>
  );
}

function CheckInBody({ attendeeId }: { attendeeId: string }) {
  const [params] = useSearchParams();
  const { progress, isError, refetch } = useAttendeeProgress(attendeeId);
  const checkIn = useCheckInWithCode(attendeeId);
  const [mode, setMode] = useState<'scan' | 'manual'>('scan');
  const [issue, setIssue] = useState<Issue | null>(null);
  const [cameraProblem, setCameraProblem] = useState<CameraProblem>(null);
  const [collectedId, setCollectedId] = useState<string | null>(null);

  if (isError) {
    return (
      <Screen>
        <div className="px-5 pt-6 text-ink">
          <ErrorNotice message="Could not load your check-in." onRetry={refetch} />
        </div>
      </Screen>
    );
  }
  if (!progress) {
    return (
      <Screen>
        <p className="px-5 pt-8 text-sm text-ink-text" role="status">
          Loading…
        </p>
      </Screen>
    );
  }

  const stopOf = (session: AttendeeScheduleDTO) => progress.sessions.findIndex((entry) => entry.id === session.id) + 1;

  if (collectedId) {
    const session = progress.sessions.find((entry) => entry.id === collectedId);
    if (session) {
      return (
        <Screen>
          <DonePane progress={progress} session={session} stop={stopOf(session)} />
        </Screen>
      );
    }
  }

  // The session the attendee asked for if it is live and not yet stamped, otherwise the first one that is.
  const open = liveSessions(progress.sessions).filter((session) => !progress.stamps.has(session.id));
  const target = open.find((session) => session.id === params.get('session')) ?? open[0];

  if (!target) {
    const anyLive = liveSessions(progress.sessions).length > 0;
    return (
      <Screen>
        <NothingPane progress={progress} allStamped={anyLive} />
      </Screen>
    );
  }

  const submit = (code: string) => {
    setIssue(null);
    checkIn.mutate(
      { sessionId: target.id, code },
      {
        onSuccess: () => setCollectedId(target.id),
        onError: (error) => setIssue(toIssue(error)),
      },
    );
  };

  const handleScanned = (text: string) => {
    if (checkIn.isPending) return;
    const payload = parseCheckInPayload(text);
    if (!payload) {
      setIssue({ message: "That isn't a GatherOS check-in code.", needsRsvp: false });
    } else if (payload.sessionId && payload.sessionId !== target.id) {
      setIssue({ message: `That code is for a different session. Scan the one for ${target.sessionTitle}.`, needsRsvp: false });
    } else {
      submit(payload.code);
    }
  };

  return (
    <Screen>
      <SessionSummary session={target} stop={stopOf(target)} />
      {mode === 'scan' ? (
        <ScanPane
          session={target}
          issue={issue}
          onScanned={handleScanned}
          onProblem={(problem) => {
            setCameraProblem(problem);
            setMode('manual');
          }}
          onManual={() => {
            setIssue(null);
            setMode('manual');
          }}
        />
      ) : (
        <ManualPane
          issue={issue}
          pending={checkIn.isPending}
          cameraProblem={cameraProblem}
          onSubmit={submit}
          onScan={() => {
            setIssue(null);
            setCameraProblem(null);
            setMode('scan');
          }}
        />
      )}
    </Screen>
  );
}

/** Full-screen check-in: scan the room's QR code, or type the code shown under it. */
export default function AttendeeCheckIn() {
  usePageTitle('Check in');
  const { session } = useAuth();
  if (!session) return null;
  return <CheckInBody attendeeId={session.id} />;
}
