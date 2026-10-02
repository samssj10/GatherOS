import { useVirtualizer } from '@tanstack/react-virtual';
import { Plane, Search } from 'lucide-react';
import { useDeferredValue, useMemo, useRef } from 'react';
import { useAttendeeList } from '@/api/attendees';
import ErrorNotice from '@/components/ErrorNotice';
import Skeleton from '@/components/Skeleton';
import { useUiStore } from '@/store/uiStore';
import type { RosterRsvpFilter } from '@/store/uiStore';
import type { Attendee } from '@/types';

const ROW_HEIGHT = 56;
const OVERSCAN = 8;
// One shared template keeps the header and every virtualized row aligned.
const GRID_COLUMNS =
  'grid grid-cols-[minmax(0,2.2fr)_minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.8fr)] items-center gap-4 px-6';

const RSVP_STYLES: Record<Attendee['rsvpStatus'], string> = {
  accepted: 'bg-emerald-50 text-emerald-700',
  pending: 'bg-amber-50 text-amber-700',
  declined: 'bg-rose-50 text-rose-700',
};

const DIETARY_LABELS: Record<Attendee['dietaryPreference'], string> = {
  none: 'None',
  vegetarian: 'Vegetarian',
  vegan: 'Vegan',
  'gluten-free': 'Gluten-free',
};

const FILTERS: { value: RosterRsvpFilter; label: string }[] = [
  { value: 'all', label: 'All responses' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'pending', label: 'Pending' },
  { value: 'declined', label: 'Declined' },
];

function RosterRow({ attendee }: { attendee: Attendee }) {
  return (
    <>
      <div role="cell" className="min-w-0">
        <p className="truncate text-sm font-medium text-slate-900">{attendee.fullName}</p>
        <p className="truncate text-xs text-slate-500">{attendee.email}</p>
      </div>
      <div role="cell" className="truncate text-sm text-slate-500">
        {attendee.department}
      </div>
      <div role="cell">
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${RSVP_STYLES[attendee.rsvpStatus]}`}
        >
          {attendee.rsvpStatus}
        </span>
      </div>
      <div role="cell" className="truncate text-sm text-slate-500">
        {DIETARY_LABELS[attendee.dietaryPreference]}
      </div>
      <div role="cell" className="text-sm text-slate-500">
        {attendee.flightAssigned ? (
          <span className="inline-flex items-center gap-1.5 text-slate-900">
            <Plane className="h-4 w-4" aria-hidden="true" />
            Booked
          </span>
        ) : (
          <span>Not yet</span>
        )}
      </div>
    </>
  );
}

export default function AttendeeRoster() {
  const { data, isPending, isError, refetch } = useAttendeeList();
  const search = useUiStore((state) => state.rosterSearch);
  const rsvpFilter = useUiStore((state) => state.rosterRsvpFilter);
  const setSearch = useUiStore((state) => state.setRosterSearch);
  const setRsvpFilter = useUiStore((state) => state.setRosterRsvpFilter);

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

  return (
    <section aria-labelledby="roster-title" className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 id="roster-title" className="text-2xl font-bold tracking-tight text-slate-900">
            Attendees
          </h1>
          <p aria-live="polite" className="text-sm text-slate-500">
            {isPending
              ? 'Loading roster…'
              : `Showing ${rows.length.toLocaleString()} of ${data.total.toLocaleString()} attendees`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <label htmlFor="roster-search" className="sr-only">
              Search attendees by name, email or department
            </label>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
              aria-hidden="true"
            />
            <input
              id="roster-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, email, department"
              className="h-10 w-72 rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-500 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            />
          </div>

          <label htmlFor="roster-rsvp" className="sr-only">
            Filter by RSVP status
          </label>
          <select
            id="roster-rsvp"
            value={rsvpFilter}
            onChange={(event) => setRsvpFilter(event.target.value as RosterRsvpFilter)}
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            {FILTERS.map((filter) => (
              <option key={filter.value} value={filter.value}>
                {filter.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div
        role="table"
        aria-label="Attendee roster"
        aria-rowcount={rows.length + 1}
        className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
      >
        <div role="rowgroup" className="border-b border-slate-200 bg-slate-50">
          <div role="row" aria-rowindex={1} className={`${GRID_COLUMNS} h-11`}>
            {['Attendee', 'Department', 'RSVP', 'Dietary', 'Flight'].map((heading) => (
              <div
                key={heading}
                role="columnheader"
                className="text-xs font-semibold uppercase tracking-wide text-slate-500"
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
          className="h-[calc(100vh-19rem)] min-h-80 overflow-auto focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
        >
          {isPending ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 8 }, (_, index) => (
                <Skeleton key={index} className="h-10 w-full" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">No attendees match your filters.</p>
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
                    className={`${GRID_COLUMNS} absolute left-0 top-0 w-full border-b border-slate-100 hover:bg-slate-50`}
                    style={{
                      height: virtualRow.size,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <RosterRow attendee={attendee} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
