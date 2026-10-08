import { Info, Search } from 'lucide-react';
import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAttendeeList, useAttendeeSummary, useNudge } from '@/api/attendees';
import ErrorNotice from '@/components/ErrorNotice';
import NudgeBanner from '@/components/planner/NudgeBanner';
import RosterCards from '@/components/planner/RosterCards';
import RosterTable from '@/components/planner/RosterTable';
import { TRIP_READY_RULE } from '@/components/planner/rosterShared';
import { DESKTOP_QUERY, useMediaQuery } from '@/hooks/useMediaQuery';
import { useUiStore } from '@/store/uiStore';
import type { RosterRsvpFilter } from '@/store/uiStore';
import { formatNumber } from '@/utils/format';

const RESPONSE_VALUES: RosterRsvpFilter[] = ['all', 'accepted', 'pending', 'declined'];
const isResponseFilter = (value: string | null): value is RosterRsvpFilter =>
  value !== null && (RESPONSE_VALUES as string[]).includes(value);

export default function AttendeeRoster() {
  const { data, isPending, isError, refetch } = useAttendeeList();
  const summary = useAttendeeSummary().data;
  const nudge = useNudge();
  const search = useUiStore((state) => state.rosterSearch);
  const rsvpFilter = useUiStore((state) => state.rosterRsvpFilter);
  const setSearch = useUiStore((state) => state.setRosterSearch);
  const setRsvpFilter = useUiStore((state) => state.setRosterRsvpFilter);
  // A table on a wide screen, a list of cards below it. One tree at a time, so there is one set of controls.
  const wide = useMediaQuery(DESKTOP_QUERY);
  const [helpOpen, setHelpOpen] = useState(false);

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
  const list = {
    rows,
    isPending,
    onNudge: (id: string) => nudge.mutate([id]),
    nudgingId: nudge.isPending ? nudge.variables?.[0] : undefined,
  };

  // Below lg the header dissolves (`contents`), so the page reads title, reminder, search, filters, list.
  return (
    <section aria-labelledby="roster-title" className="flex w-full max-w-310 flex-col gap-5.5 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-wrap items-end justify-between gap-4 max-lg:contents">
        <div className="max-lg:order-1">
          <p className="font-mono text-xs uppercase tracking-[0.08em] text-muted">
            Roster{summary ? ` · ${formatNumber(summary.total)} invited` : ''}
          </p>
          <h1
            id="roster-title"
            className="mt-1.5 font-display text-[32px] leading-tight font-extrabold tracking-[-0.02em] sm:text-[40px]"
          >
            Attendees
          </h1>
        </div>
        <div className="flex min-h-12 flex-[0_1_360px] items-center gap-2.5 rounded-[14px] border border-field bg-white px-4 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand max-lg:order-3 max-lg:w-full max-lg:flex-none">
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

      <div className="max-lg:order-2">
        <NudgeBanner />
      </div>

      <div className="flex flex-col gap-3 max-lg:order-4 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between">
        <div
          role="group"
          aria-label="Filter by response"
          className="flex gap-2 max-lg:-mx-4 max-lg:overflow-x-auto max-lg:px-4 max-lg:pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:max-lg:-mx-6 sm:max-lg:px-6 lg:flex-wrap"
        >
          {filters.map((filter) => {
            const active = rsvpFilter === filter.value;
            return (
              <button
                key={filter.value}
                type="button"
                aria-pressed={active}
                onClick={() => setRsvpFilter(filter.value)}
                className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors ${
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
        <div className="flex items-center justify-between gap-3 lg:justify-end">
          <p aria-live="polite" className="text-sm text-body">
            {isPending
              ? 'Loading roster…'
              : searching
                ? `Showing ${formatNumber(rows.length)} of ${formatNumber(data.total)} · matches for “${deferredSearch.trim()}”`
                : rows.length === data.total
                  ? `Showing all ${formatNumber(data.total)} attendees`
                  : `Showing ${formatNumber(rows.length)} of ${formatNumber(data.total)} attendees`}
          </p>
          <button
            type="button"
            aria-expanded={helpOpen}
            aria-controls="trip-ready-help"
            onClick={() => setHelpOpen((open) => !open)}
            className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg px-2 text-[13px] font-medium text-brand-ink hover:underline lg:hidden"
          >
            <Info className="size-4" strokeWidth={1.9} aria-hidden="true" />
            What’s trip ready?
          </button>
        </div>
      </div>

      {helpOpen && (
        <p id="trip-ready-help" className="rounded-2xl border border-line bg-white px-4 py-3 text-sm text-body max-lg:order-4 lg:hidden">
          {TRIP_READY_RULE}
        </p>
      )}

      <div className="max-lg:order-5">{wide ? <RosterTable {...list} /> : <RosterCards {...list} />}</div>
    </section>
  );
}
