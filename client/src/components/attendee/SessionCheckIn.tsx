import { Check, Lock, ScanLine } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useCheckInWithCode } from '@/api/attendees';
import type { AttendeeScheduleDTO } from '@/types';
import { isCompleteCode, normalizeCode } from '@/utils/checkIn';
import { XP } from '@/utils/gamification';
import type { BadgeProgress } from '@/utils/gamification';

interface Props {
  session: AttendeeScheduleDTO;
  attendeeId: string;
  /** Only attendees who are going can check in; anyone else is sent to the RSVP. */
  accepted: boolean;
  stamped: boolean;
  /** Badges this stamp counts toward, e.g. "Front Row 1 of 2". */
  progress: BadgeProgress[];
  /** Phones scan with the camera; desktop types the code from the room screen. */
  layout: 'phone' | 'desktop';
  /** Left padding that lines the footer up under the title on the desktop cards. */
  indentClass?: string;
}

function LiveLabel() {
  return (
    <span className="inline-flex items-center gap-2 text-sm font-semibold text-ok-ink">
      <span className="size-2 rounded-full bg-ok" aria-hidden="true" />
      Happening now · check-in open
    </span>
  );
}

/**
 * A session is on but this person is not going (declined, or has not answered): the code is not for them,
 * so the way forward is the RSVP.
 */
function RsvpToCheckIn() {
  return (
    <div className="flex flex-col gap-2.5">
      <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-body">
        <span className="size-2 rounded-full bg-ok" aria-hidden="true" />
        Happening now · check-in for confirmed attendees
      </span>
      <Link
        to="/attendee"
        className="flex min-h-11 items-center justify-center rounded-xl border-[1.5px] border-brand text-sm font-semibold text-brand-ink no-underline transition-colors hover:bg-brand-tint hover:text-brand-ink"
      >
        RSVP to check in
      </Link>
    </div>
  );
}

/** Desktop: type the 6-character code shown on the room screen. */
function InlineCodeForm({ session, attendeeId }: { session: AttendeeScheduleDTO; attendeeId: string }) {
  const [code, setCode] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const checkIn = useCheckInWithCode(attendeeId);

  const inputId = `code-${session.id}`;
  const errorId = `code-error-${session.id}`;
  const error = localError ?? checkIn.error?.message ?? null;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!isCompleteCode(code)) {
      setLocalError('The code has 6 characters. Check the screen in the room.');
      return;
    }
    checkIn.mutate({ sessionId: session.id, code: normalizeCode(code) });
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-2.5" noValidate>
      <LiveLabel />
      <label htmlFor={inputId} className="text-sm leading-snug text-body">
        Enter the 6-character code on the screen in {session.locationName}, or scan it with your phone.
      </label>
      <div className="flex gap-2">
        <input
          id={inputId}
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
            if (checkIn.isError) checkIn.reset();
          }}
          aria-invalid={error !== null}
          aria-describedby={errorId}
          className={`min-h-11 min-w-0 flex-1 rounded-xl border-2 bg-white px-3.5 font-mono text-base tracking-[0.25em] uppercase placeholder:tracking-[0.25em] placeholder:text-placeholder ${
            error ? 'border-bad-ink' : 'border-field'
          }`}
        />
        <button
          type="submit"
          disabled={checkIn.isPending}
          className="min-h-11 rounded-xl bg-brand px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:bg-line disabled:text-muted"
        >
          Check in<span className="sr-only"> to {session.sessionTitle}</span>
        </button>
      </div>
      <span id={errorId} role="alert" className="min-h-5 text-sm font-medium text-bad-ink">
        {error}
      </span>
    </form>
  );
}

/**
 * The bottom of a session card: whether check-in is open yet, open now, closed, or already done.
 * The server decides what is accepted; this only reflects the session's clock and the attendee's RSVP.
 */
export default function SessionCheckIn({
  session,
  attendeeId,
  accepted,
  stamped,
  progress,
  layout,
  indentClass = '',
}: Props) {
  // Desktop cards separate the footer with a rule; on phones it follows the chips row directly.
  const wrapper = layout === 'desktop' ? `border-t border-hairline pt-2.5 ${indentClass}` : 'pt-0.5';

  if (stamped) {
    return (
      <div role="status" className={`${wrapper} flex items-center gap-2.5`}>
        <span className="flex size-6 flex-none items-center justify-center rounded-full bg-ink text-lime">
          <Check className="size-3.5" strokeWidth={2.8} aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1 text-sm font-semibold">
          Stamp collected
          {progress.map((entry) => (
            <span key={entry.badge} className="font-normal text-body">
              {' · '}
              {entry.badge} {entry.done} of {entry.total}
            </span>
          ))}
        </span>
        <span className="font-mono text-xs font-semibold text-ok-ink">+{XP.stamp} XP</span>
      </div>
    );
  }

  if (session.checkInStatus === 'live') {
    if (!accepted) {
      return (
        <div className={wrapper}>
          <RsvpToCheckIn />
        </div>
      );
    }
    if (layout === 'desktop') {
      return (
        <div className={wrapper}>
          <InlineCodeForm session={session} attendeeId={attendeeId} />
        </div>
      );
    }
    return (
      <div className={`${wrapper} flex flex-col gap-2.5`}>
        <LiveLabel />
        <Link
          to={`/attendee/check-in?session=${session.id}`}
          className="flex min-h-12 items-center justify-center gap-2 rounded-[14px] bg-brand text-base font-semibold text-white no-underline transition-colors hover:bg-brand-hover hover:text-white"
        >
          <ScanLine className="size-4.5" strokeWidth={2} aria-hidden="true" />
          Scan code to check in
          <span className="sr-only"> for {session.sessionTitle}</span>
        </Link>
      </div>
    );
  }

  const text =
    session.checkInStatus === 'ended'
      ? 'Check-in closed'
      : layout === 'desktop'
        ? `Check-in opens at ${session.startTime} on Day ${session.day}, with the code shown in the room`
        : `Check-in opens at ${session.startTime} in ${session.locationName}`;

  return (
    <p className={`${wrapper} flex items-start gap-2 text-sm text-body`}>
      <Lock className="mt-0.5 size-3.5 flex-none" strokeWidth={2} aria-hidden="true" />
      {text}
    </p>
  );
}
