import { useVirtualizer } from '@tanstack/react-virtual';
import { Search } from 'lucide-react';
import { useDeferredValue, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAttendeeList, useAttendeeSummary, useNudge } from '@/api/attendees';
import ErrorNotice from '@/components/ErrorNotice';
import NudgeBanner from '@/components/planner/NudgeBanner';
import Skeleton from '@/components/Skeleton';
import { useUiStore } from '@/store/uiStore';
import type { RosterRsvpFilter } from '@/store/uiStore';
import type { Attendee } from '@/types';
import { formatNumber, initials } from '@/utils/format';

const ROW_HEIGHT = 64;
const OVERSCAN = 8;
// One shared template keeps the header and every virtualized row aligned.
const GRID_COLUMNS =
  'grid grid-cols-[minmax(0,2.2fr)_minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,0.9fr)] items-center gap-4 px-5';

const RSVP_STYLES: Record<Attendee['rsvpStatus'], string> = {
  accepted: 'bg-ok-tint text-ok-ink',
  pending: 'bg-warn-tint text-warn-ink',
  declined: 'bg-bad-tint text-bad-ink',
};

const DIETARY_LABELS: Record<Attendee['dietaryPreference'], string> = {
  none: 'None',
  vegetarian: 'Vegetarian',
  vegan: 'Vegan',
  'gluten-free': 'Gluten-free',
};

// Avatar tints rotate by attendee number so a person keeps their color while filtering.
const AVATAR_TINTS = [
  'bg-brand-tint text-brand-ink',
  'bg-blue-tint text-blue-ink',
  'bg-ok-tint text-ok-ink',
  'bg-orange-tint text-warn-ink',
] as const;

const avatarTint = (id: string) => AVATAR_TINTS[Number.parseInt(id.slice(4), 10) % AVATAR_TINTS.length] ?? AVATAR_TINTS[0];

/** Answered RSVP, accepted and flight booked: three steps to being ready for the trip. */
function tripReadiness(attendee: Attendee): { steps: [boolean, boolean, boolean]; score: number } {
  const steps: [boolean, boolean, boolean] = [
    attendee.rsvpStatus !== 'pending',
    attendee.rsvpStatus === 'accepted',
    attendee.flightAssigned,
  ];
  return { steps, score: steps.filter(Boolean).length };
}

const RESPONSE_VALUES: RosterRsvpFilter[] = ['all', 'accepted', 'pending', 'declined'];
const isResponseFilter = (value: string | null): value is RosterRsvpFilter =>
  value !== null && (RESPONSE_VALUES as string[]).includes(value);

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

export default function AttendeeRoster() {
  const { data, isPending, isError, refetch } = useAttendeeList();
  const summary = useAttendeeSummary().data;
  const nudge = useNudge();
  const search = useUiStore((state) => state.rosterSearch);
  const rsvpFilter = useUiStore((state) => state.rosterRsvpFilter);
  const setSearch = useUiStore((state) => state.setRosterSearch);
  const setRsvpFilter = useUiStore((state) => state.setRosterRsvpFilter);

  // The dashboard links here with ?response=pending to open the roster already filtered.
  const [params] = useSearchParams();
  const requested = params.get('response');
  useEffect(() => {
    if (isResponseFilter(requested)) setRsvpFilter(requested);
  }, [requested, setRsvpFilter]);

  // Keeps typing responsive while the 2,500-row filter runs.
  const deferredSearch = useDeferredValue(search);

  const rows = useMemo(() => {
    const needle = deferredSearch.trim().toLowerCase();
    return (data?.data ?? []).filter((attendee) => {
      if (rsvpFilter !== 'all' && attendee.rsvpStatus !== rsvpFilter) return false;
      if (!needle) return true;
      return (
        attendee.fullName.toLowerCase().includes(needle) ||
        attendee.email.includes(needle) ||
        attendee.department.toLowerCase().includes(needle)
      );
    });
  }, [data, deferredSearch, rsvpFilter]);

  const scrollRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Virtual is used as documented.
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: OVERSCAN,
  });

  if (isError) {
    return <ErrorNotice message="Could not load the attendee roster." onRetry={() => void refetch()} />;
  }

  const filters: { value: RosterRsvpFilter; label: string; count: number | undefined; dot: string }[] = [
    { value: 'all', label: 'All responses', count: summary?.total, dot: 'bg-ink' },
    { value: 'accepted', label: 'Accepted', count: summary?.rsvp.accepted, dot: 'bg-ok' },
    { value: 'pending', label: 'Pending', count: summary?.rsvp.pending, dot: 'bg-warn' },
    { value: 'declined', label: 'Declined', count: summary?.rsvp.declined, dot: 'bg-bad' },
  ];
  const searching = deferredSearch.trim().length > 0;

  return (
    <section aria-labelledby="roster-title" className="flex w-full max-w-310 flex-col gap-5.5 p-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.08em] text-muted">
            Roster{summary ? ` · ${formatNumber(summary.total)} invited` : ''}
          </p>
          <h1
            id="roster-title"
            className="mt-1.5 font-display text-[40px] leading-tight font-extrabold tracking-[-0.02em]"
          >
            Attendees
          </h1>
        </div>
        <div className="flex min-h-12 flex-[0_1_360px] items-center gap-2.5 rounded-[14px] border border-field bg-white px-4 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand">
          <Search className="size-4.5 shrink-0 text-muted" strokeWidth={1.9} aria-hidden="true" />
          <label htmlFor="roster-search" className="sr-only">
            Search attendees by name, email or department
          </label>
          <input
            id="roster-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, email, department"
            className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted"
          />
        </div>
      </header>

      <NudgeBanner />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="group" aria-label="Filter by response" className="flex flex-wrap gap-2">
          {filters.map((filter) => {
            const active = rsvpFilter === filter.value;
            return (
              <button
                key={filter.value}
                type="button"
                aria-pressed={active}
                onClick={() => setRsvpFilter(filter.value)}
                className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors ${
                  active
                    ? 'border-ink bg-ink text-white'
                    : 'border-field bg-white text-ink hover:bg-wash'
                }`}
              >
                <span
                  className={`size-2 rounded-full ${active && filter.value === 'all' ? 'bg-lime' : filter.dot}`}
                  aria-hidden="true"
                />
                {filter.label}
                {filter.count !== undefined && (
                  <span className="font-mono text-xs opacity-80">{formatNumber(filter.count)}</span>
                )}
              </button>
            );
          })}
        </div>
        <p aria-live="polite" className="text-sm text-body">
          {isPending
            ? 'Loading roster…'
            : searching
              ? `Showing ${formatNumber(rows.length)} of ${formatNumber(data.total)} · matches for “${deferredSearch.trim()}”`
              : `Showing ${formatNumber(rows.length)} of ${formatNumber(data.total)} attendees`}
        </p>
      </div>

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
                    <RosterRow
                      attendee={attendee}
                      onNudge={(id) => nudge.mutate([id])}
                      nudging={nudge.isPending && nudge.variables?.[0] === attendee.id}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <p className="text-[13px] text-muted">Trip ready = answered RSVP · accepted · flight booked.</p>
    </section>
  );
}
