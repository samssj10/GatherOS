import { useDepartmentStats } from '@/api/attendees';
import ErrorNotice from '@/components/ErrorNotice';
import Skeleton from '@/components/Skeleton';

const VISIBLE = 5;

/** Share of each department that is going. The attendee's own department is always shown. */
export default function TeamRace({ ownDepartment }: { ownDepartment: string }) {
  const { data, isPending, isError, refetch } = useDepartmentStats();

  const ranked = (data ?? []).map((stat, index) => ({ ...stat, position: index + 1 }));
  const top = ranked.slice(0, VISIBLE);
  const own = ranked.find((stat) => stat.department === ownDepartment);
  const rows = own && !top.some((stat) => stat.department === ownDepartment) ? [...top, own] : top;

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
          {rows.map((row) => {
            const mine = row.department === ownDepartment;
            return (
              <li key={row.department} className="flex items-center gap-2.5 lg:gap-3">
                <span className="w-5.5 font-mono text-[13px] text-muted">{row.position}</span>
                <div className="min-w-0 flex-1">
                  <div className={`mb-1 flex justify-between text-sm lg:mb-1.5 lg:text-[15px] ${mine ? 'font-bold' : 'font-medium'}`}>
                    <span>
                      {row.department}
                      {mine && <span className="sr-only"> (your team)</span>}
                    </span>
                    <span className="font-mono">{row.pct}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded bg-hairline">
                    <div
                      className={`h-full rounded ${mine ? 'bg-brand' : 'bg-ink-text'}`}
                      style={{ width: `${row.pct}%` }}
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
