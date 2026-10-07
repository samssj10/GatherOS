import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';
import Skeleton from '@/components/Skeleton';
import {
  DIETARY_LABELS,
  RSVP_STYLES,
  avatarTint,
  tripReadiness,
} from '@/components/planner/rosterShared';
import type { RosterListProps } from '@/components/planner/rosterShared';
import type { Attendee } from '@/types';
import { initials } from '@/utils/format';

const ROW_HEIGHT = 64;
const OVERSCAN = 8;
// One shared template keeps the header and every virtualized row aligned.
const GRID_COLUMNS =
  'grid grid-cols-[minmax(0,2.2fr)_minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,0.9fr)] items-center gap-4 px-5';

function RosterRow({
  attendee,
  onNudge,
  nudging,
}: {
  attendee: Attendee;
  onNudge: (id: string) => void;
  nudging: boolean;
}) {
  const { steps, score } = tripReadiness(attendee);
  const alreadyNudged = attendee.nudgedAt !== null;

  return (
    <>
      <div role="cell" className="flex min-w-0 items-center gap-3">
        <span
          className={`flex size-9.5 flex-none items-center justify-center rounded-full text-[13px] font-semibold ${avatarTint(attendee.id)}`}
          aria-hidden="true"
        >
          {initials(attendee.fullName)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold">{attendee.fullName}</p>
          <p className="truncate text-[13px] text-muted">{attendee.email}</p>
        </div>
      </div>
      <div role="cell" className="truncate text-sm text-body">
        {attendee.department}
      </div>
      <div role="cell">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[13px] font-semibold capitalize ${RSVP_STYLES[attendee.rsvpStatus]}`}
        >
          <span className="size-1.75 rounded-full bg-current" aria-hidden="true" />
          {attendee.rsvpStatus}
        </span>
      </div>
      <div role="cell" className="truncate text-sm text-body">
        {DIETARY_LABELS[attendee.dietaryPreference]}
      </div>
      <div role="cell" className="flex items-center gap-2.5">
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
      <div role="cell" className="text-right">
        {attendee.rsvpStatus === 'pending' && (
          <button
            type="button"
            onClick={() => onNudge(attendee.id)}
            disabled={nudging || alreadyNudged}
            aria-label={`${alreadyNudged ? 'Already nudged' : 'Nudge'} ${attendee.fullName}`}
            className="min-h-9 rounded-[10px] border border-field bg-white px-3.5 text-[13px] font-medium transition-colors hover:bg-wash disabled:opacity-60"
          >
            {alreadyNudged ? 'Nudged' : 'Nudge'}
          </button>
        )}
        {score === 3 && (
          <span className="rounded-lg bg-lime px-2.5 py-1 font-mono text-xs font-semibold text-ink">All set</span>
        )}
      </div>
    </>
  );
}

/** The roster as a table, for a wide screen. Only the rows in view (plus a little overscan) exist in the DOM. */
export default function RosterTable({ rows, isPending, onNudge, nudgingId }: RosterListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Virtual is used as documented.
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: OVERSCAN,
  });

  return (
    <div
      role="table"
      aria-label="Attendee roster"
      aria-rowcount={rows.length + 1}
      className="overflow-hidden rounded-[20px] border border-line bg-white"
    >
      <div role="rowgroup">
        <div role="row" aria-rowindex={1} className={`${GRID_COLUMNS} h-13`}>
          {['Attendee', 'Department', 'RSVP', 'Dietary', 'Trip ready', 'Action'].map((heading, index) => (
            <div
              key={heading}
              role="columnheader"
              className={`text-xs font-semibold uppercase tracking-[0.06em] text-muted ${index === 5 ? 'text-right' : ''}`}
            >
              {heading}
            </div>
          ))}
        </div>
      </div>

      {/* Scroll viewport: only the rows inside it (plus a small overscan) exist in the DOM. */}
      <div
        ref={scrollRef}
        role="rowgroup"
        tabIndex={0}
        aria-label="Attendee rows"
        data-testid="roster-viewport"
        className="h-[calc(100vh-27rem)] min-h-80 overflow-auto border-t border-hairline"
      >
        {isPending ? (
          <div className="flex flex-col gap-2 p-4">
            {Array.from({ length: 8 }, (_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <p className="p-6 text-sm text-body">No attendees match your filters.</p>
        ) : (
          <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const attendee = rows[virtualRow.index];
              if (!attendee) return null;
              return (
                <div
                  key={attendee.id}
                  role="row"
                  aria-rowindex={virtualRow.index + 2}
                  data-testid="roster-row"
                  className={`${GRID_COLUMNS} absolute top-0 left-0 w-full ${virtualRow.index > 0 ? 'border-t border-hairline' : ''} hover:bg-wash`}
                  style={{
                    height: virtualRow.size,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <RosterRow attendee={attendee} onNudge={onNudge} nudging={nudgingId === attendee.id} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
