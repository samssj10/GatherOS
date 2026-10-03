import { Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import ErrorNotice from '@/components/ErrorNotice';
import Skeleton from '@/components/Skeleton';
import { usePlannerProgress } from '@/hooks/usePlannerProgress';
import { formatNumber } from '@/utils/format';

const RING_RADIUS = 62;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

/** Dark hero card: milestone ring plus the one thing to do next. */
export default function ReadinessCard() {
  const { numbers, milestones, unlock, isError, refetch } = usePlannerProgress();

  if (isError) {
    return (
      <div className="flex-[3_1_440px]">
        <ErrorNotice message="Could not load your readiness." onRetry={refetch} />
      </div>
    );
  }

  if (!numbers || !unlock) {
    return <Skeleton className="min-h-92.5 flex-[3_1_440px] rounded-3xl bg-ink-raised" />;
  }

  const done = milestones.filter((milestone) => milestone.done).length;
  const pending = numbers.summary.rsvp.pending;

  return (
    <section
      aria-labelledby="readiness-title"
      className="flex flex-[3_1_440px] flex-wrap items-center gap-7 rounded-3xl bg-ink p-7 text-canvas"
    >
      <div className="relative size-37 flex-none">
        <svg width="148" height="148" viewBox="0 0 148 148" aria-hidden="true">
          <circle cx="74" cy="74" r={RING_RADIUS} fill="none" strokeWidth="14" className="stroke-ink-line" />
          <circle
            cx="74"
            cy="74"
            r={RING_RADIUS}
            fill="none"
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={RING_CIRCUMFERENCE * (1 - done / milestones.length)}
            transform="rotate(-90 74 74)"
            className="stroke-lime transition-[stroke-dashoffset] duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="font-display text-[40px] leading-none font-extrabold">
            {done}
            <span className="text-[#8a90a6]">/{milestones.length}</span>
          </p>
          <p className="mt-1 text-xs text-ink-text">milestones</p>
        </div>
      </div>

      <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-3">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-lime">
          {unlock.eyebrow}
        </p>
        <h2
          id="readiness-title"
          className="font-display text-3xl leading-[1.1] font-bold tracking-tight"
        >
          {unlock.title}
        </h2>
        <p className="text-[15px] leading-normal text-ink-text-2">{unlock.body}</p>
        <div className="mt-1 flex flex-wrap gap-2.5">
          {pending > 0 && (
            <Link
              to="/planner/attendees?response=pending"
              className="inline-flex min-h-11.5 items-center gap-2 rounded-xl bg-lime px-5 text-[15px] font-semibold text-ink no-underline transition-opacity hover:opacity-90"
            >
              <Send className="size-4.5" strokeWidth={1.9} aria-hidden="true" />
              Nudge {formatNumber(pending)} pending
            </Link>
          )}
          <a
            href="#itinerary"
            className="inline-flex min-h-11.5 items-center rounded-xl border border-ink-track px-4.5 text-[15px] font-medium text-canvas no-underline transition-colors hover:bg-ink-active"
          >
            Review itinerary
          </a>
        </div>
      </div>
    </section>
  );
}
