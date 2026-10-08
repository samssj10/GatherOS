import { useWindowVirtualizer } from '@tanstack/react-virtual';
import { useLayoutEffect, useRef, useState } from 'react';
import Skeleton from '@/components/Skeleton';
import {
  RSVP_STYLES,
  avatarTint,
  dietaryLabel,
  tripReadiness,
} from '@/components/planner/rosterShared';
import type { RosterListProps } from '@/components/planner/rosterShared';
import type { Attendee } from '@/types';
import { initials } from '@/utils/format';

// A card is about 150px tall plus the gap below it; the real height is measured as each card appears.
const CARD_HEIGHT = 168;
const OVERSCAN = 6;

function RosterCard({
  attendee,
  onNudge,
  nudging,
}: {
  attendee: Attendee;
  onNudge: (id: string) => void;
  nudging: boolean;
}) {
  const { steps, score, counted } = tripReadiness(attendee);
  const alreadyNudged = attendee.nudgedAt !== null;

  return (
    <article className="flex flex-col gap-3 rounded-[18px] border border-line bg-white p-4">
      <div className="flex items-start gap-3">
        <span
          className={`flex size-11 flex-none items-center justify-center rounded-full text-sm font-semibold ${avatarTint(attendee.id)}`}
          aria-hidden="true"
        >
          {initials(attendee.fullName)}
        </span>
        <div className="min-w-0 flex-1">
          <p data-testid="roster-name" className="truncate text-base font-semibold">
            {attendee.fullName}
          </p>
          <p className="truncate text-[13px] text-muted">{attendee.email}</p>
        </div>
        <span
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[13px] font-semibold capitalize ${RSVP_STYLES[attendee.rsvpStatus]}`}
        >
          <span className="size-1.75 rounded-full bg-current" aria-hidden="true" />
          <span className="sr-only">RSVP: </span>
          {attendee.rsvpStatus}
        </span>
      </div>

      <p className="text-sm text-body">
        <span className="sr-only">Department: </span>
        {attendee.department}
        <span aria-hidden="true"> · </span>
        <span className="sr-only">. Dietary: </span>
        {dietaryLabel(attendee)}
      </p>

      <div className="flex items-center justify-between gap-3">
        {counted ? (
          <div className="flex items-center gap-2.5">
            <span className="flex gap-1" aria-hidden="true">
              {steps.map((done, index) => (
                <span key={index} className={`h-2 w-5.5 rounded ${done ? 'bg-ink' : 'bg-line'}`} />
              ))}
            </span>
            <span className="font-mono text-xs text-body">
              <span className="sr-only">Trip ready: </span>
              {score}/3
            </span>
          </div>
        ) : (
          <p className="text-sm text-muted">
            <span aria-hidden="true">— </span>
            <span className="sr-only">Trip ready: </span>not counted
          </p>
        )}
        {attendee.rsvpStatus === 'pending' && (
          <button
            type="button"
            onClick={() => onNudge(attendee.id)}
            disabled={nudging || alreadyNudged}
            aria-label={`${alreadyNudged ? 'Already nudged' : 'Nudge'} ${attendee.fullName}`}
            className="min-h-11 rounded-[10px] border border-field bg-white px-4 text-sm font-medium transition-colors hover:bg-wash disabled:opacity-60"
          >
            {alreadyNudged ? 'Nudged' : 'Nudge'}
          </button>
        )}
        {score === 3 && (
          <span className="rounded-lg bg-lime px-2.5 py-1 font-mono text-xs font-semibold text-ink">All set</span>
        )}
      </div>
    </article>
  );
}

/**
 * The roster as a list of cards, for a phone or a tablet. It scrolls with the page, not inside a box of
 * its own, which is awkward under a finger. Only the cards near the screen exist in the DOM.
 */
export default function RosterCards({ rows, isPending, onNudge, nudgingId }: RosterListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  // How far down the page the list starts. It moves when the banner or the filter chips change height,
  // which changes the height of the page, so the page is watched for that.
  const [scrollMargin, setScrollMargin] = useState(0);
  const showingList = !isPending && rows.length > 0;
  useLayoutEffect(() => {
    if (!showingList) return;
    const measure = () => {
      const top = (listRef.current?.getBoundingClientRect().top ?? 0) + window.scrollY;
      setScrollMargin((current) => (Math.abs(current - top) > 0.5 ? top : current));
    };
    measure();
    // Measured a frame later: changing the layout inside the observer's own callback makes the browser
    // report "ResizeObserver loop completed with undelivered notifications".
    let frame = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    });
    observer.observe(document.body);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [showingList]);

  const virtualizer = useWindowVirtualizer({
    count: rows.length,
    estimateSize: () => CARD_HEIGHT,
    overscan: OVERSCAN,
    scrollMargin,
    // Re-measure a frame after a card changes size, which avoids the browser's harmless but noisy
    // "ResizeObserver loop completed with undelivered notifications" warning.
    useAnimationFrameWithResizeObserver: true,
  });

  if (isPending) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-40 w-full rounded-[18px]" />
        ))}
      </div>
    );
  }
  if (rows.length === 0) return <p className="text-sm text-body">No attendees match your filters.</p>;

  return (
    <div
      ref={listRef}
      role="list"
      aria-label="Attendee roster"
      className="relative w-full"
      style={{ height: virtualizer.getTotalSize() }}
    >
      {virtualizer.getVirtualItems().map((item) => {
        const attendee = rows[item.index];
        if (!attendee) return null;
        return (
          <div
            key={attendee.id}
            ref={virtualizer.measureElement}
            data-index={item.index}
            role="listitem"
            aria-posinset={item.index + 1}
            aria-setsize={rows.length}
            data-testid="roster-row"
            className="absolute top-0 left-0 w-full pb-3"
            style={{ transform: `translateY(${item.start - virtualizer.options.scrollMargin}px)` }}
          >
            <RosterCard attendee={attendee} onNudge={onNudge} nudging={nudgingId === attendee.id} />
          </div>
        );
      })}
    </div>
  );
}
