import { Fragment } from 'react';
import { useDepartmentStats } from '@/api/attendees';
import ErrorNotice from '@/components/ErrorNotice';
import Skeleton from '@/components/Skeleton';
import { teamRaceRows } from '@/utils/teamRace';

const VISIBLE = 5;

/** Share of each department that is going. The attendee's own department is always shown. */
export default function TeamRace({ ownDepartment }: { ownDepartment: string }) {
  const { data, isPending, isError, refetch } = useDepartmentStats();

  const { rows, hidden } = teamRaceRows(data ?? [], ownDepartment, VISIBLE);

  return (
    <section
      aria-labelledby="race-title"
      className="flex flex-col gap-3 rounded-3xl border border-line bg-white p-5 lg:gap-3.5 lg:p-6"
    >
      <div>
        <h2 id="race-title" className="font-display text-[19px] font-bold lg:text-[22px]">
          Team race
        </h2>
        <p className="mt-0.5 text-[13px] text-muted lg:text-sm lg:text-body">Share of each department that's going</p>
      </div>

      {isError ? (
        <ErrorNotice message="Could not load the team race." onRetry={() => void refetch()} />
      ) : isPending ? (
        <Skeleton className="h-40" />
      ) : (
        <ol className="flex flex-col gap-3 lg:gap-3.5">
          {rows.map((row, index) => {
            const mine = row.department === ownDepartment;
            // The teams between the top and this one are not shown, so say how many there are.
            const gapBefore = mine && hidden > 0 && index === rows.length - 1;
            return (
              <Fragment key={row.department}>
                {gapBefore && (
                  <li className="flex items-center gap-3 py-0.5 text-xs text-muted">
                    <span className="sr-only">
                      {hidden} more {hidden === 1 ? 'team' : 'teams'} not shown
                    </span>
                    <span className="flex-1 border-t border-dotted border-field" aria-hidden="true" />
                    <span aria-hidden="true">
                      {hidden} more {hidden === 1 ? 'team' : 'teams'}
                    </span>
                    <span className="flex-1 border-t border-dotted border-field" aria-hidden="true" />
                  </li>
                )}
                <li
                  className={`flex items-center gap-2.5 lg:gap-3 ${
                    mine ? '-mx-2.5 rounded-xl bg-brand-tint px-2.5 py-2' : ''
                  }`}
                >
                  <span className="w-5.5 font-mono text-[13px] text-muted">{row.position}</span>
                  <div className="min-w-0 flex-1">
                    <div className={`mb-1 flex justify-between text-sm lg:mb-1.5 lg:text-[15px] ${mine ? 'font-bold' : 'font-medium'}`}>
                      <span>
                        {row.department}
                        {mine && <span className="font-medium text-brand-ink"> · your team</span>}
                      </span>
                      <span className="font-mono">{row.pct}%</span>
                    </div>
                    <div className={`h-2 overflow-hidden rounded ${mine ? 'bg-white' : 'bg-hairline'}`}>
                      <div
                        className={`h-full rounded ${mine ? 'bg-brand' : 'bg-ink-text'}`}
                        style={{ width: `${row.pct}%` }}
                      />
                    </div>
                  </div>
                </li>
              </Fragment>
            );
          })}
        </ol>
      )}
    </section>
  );
}
