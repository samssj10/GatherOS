import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAttendeeSummary } from '@/api/attendees';
import { usePlannerSchedule } from '@/api/schedule';
import QrCode from '@/components/QrCode';
import RoomScreen from '@/components/planner/RoomScreen';
import { usePageTitle } from '@/hooks/usePageTitle';
import { formatNumber } from '@/utils/format';

/** What the sample screens show in place of a real code. It is not a valid check-in code anywhere. */
const SAMPLE_CODE = 'TEST42';

/** The QR on a sample screen encodes this text, which the app's scanner does not accept as a check-in. */
const SAMPLE_QR_TEXT = 'GatherOS sample room screen. Not a check-in code.';

/**
 * A rehearsal of the room display: every saved session in turn, with a sample code, so the projector can be tested
 * before the event. Nothing here talks to the check-in service, so nobody can be stamped from it.
 */
export default function PlannerRoomPreview() {
  const schedule = usePlannerSchedule();
  const accepted = useAttendeeSummary().data?.rsvp.accepted;
  const [params, setParams] = useSearchParams();
  usePageTitle('Preview room screens');

  const ordered = [...(schedule.data ?? [])].sort((a, b) => a.day - b.day || a.startTime.localeCompare(b.startTime));
  const requested = Number.parseInt(params.get('stop') ?? '1', 10);
  const index = Math.min(Math.max(Number.isFinite(requested) ? requested - 1 : 0, 0), Math.max(ordered.length - 1, 0));
  const session = ordered[index];

  const goTo = (target: number) => setParams({ stop: String(target + 1) }, { replace: true });
  const arrow =
    'inline-flex size-10 items-center justify-center rounded-lg border border-ink/20 text-ink transition-colors hover:bg-ink/10 disabled:pointer-events-none disabled:opacity-40';

  const banner = (
    <div role="region" aria-label="Preview" className="flex flex-wrap items-center gap-x-4 gap-y-2 bg-warn px-4 py-3 text-ink sm:px-6">
      <span className="rounded-md bg-ink px-2.5 py-1 font-mono text-xs font-bold tracking-[0.08em] text-warn">PREVIEW</span>
      <p className="min-w-0 flex-[1_1_260px] text-[15px]">Check-ins don't count. Use this to test the projector before the event.</p>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => goTo(index - 1)} disabled={index === 0} aria-label="Previous session" className={arrow}>
          <ChevronLeft className="size-4.5" strokeWidth={2} aria-hidden="true" />
        </button>
        <span aria-live="polite" className="font-mono text-[13px]">
          Session {ordered.length === 0 ? 0 : index + 1} of {ordered.length}
        </span>
        <button
          type="button"
          onClick={() => goTo(index + 1)}
          disabled={index >= ordered.length - 1}
          aria-label="Next session"
          className={arrow}
        >
          <ChevronRight className="size-4.5" strokeWidth={2} aria-hidden="true" />
        </button>
      </div>
      <Link
        to="/planner"
        className="inline-flex min-h-11 items-center rounded-xl bg-ink px-4 text-sm font-semibold text-white no-underline transition-colors hover:bg-ink-active"
      >
        Exit preview
      </Link>
    </div>
  );

  return (
    <RoomScreen
      banner={banner}
      stop={session ? `Stop ${index + 1} · Day ${session.day} · ${session.startTime} – ${session.endTime}` : 'Preview'}
      title={session?.title ?? (schedule.isPending ? 'Loading…' : 'No saved sessions to preview')}
      location={session?.location}
      checked={{ value: `[n] of ${accepted === undefined ? '…' : formatNumber(accepted)}`, percent: 25 }}
      qr={
        <>
          <QrCode value={SAMPLE_QR_TEXT} label="Sample QR code, not for checking in" className="size-72 sm:size-90" />
          <span
            aria-hidden="true"
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 rounded-xl bg-warn px-5 py-2 font-mono text-3xl font-bold tracking-[0.2em] text-ink shadow-lg"
          >
            SAMPLE
          </span>
        </>
      }
      code={{ text: SAMPLE_CODE, spoken: `Sample code ${SAMPLE_CODE.split('').join(' ')}` }}
      codeNote={<p className="mt-2.5 text-base text-ink-text-3">Sample code. The real one appears when the session starts.</p>}
    />
  );
}
