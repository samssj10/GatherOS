import { Check } from 'lucide-react';
import ErrorNotice from '@/components/ErrorNotice';
import Skeleton from '@/components/Skeleton';
import { usePlannerProgress } from '@/hooks/usePlannerProgress';
import type { Milestone } from '@/utils/progress';

/** Open milestones show their own accent; completed ones turn solid ink. */
function barColor(milestone: Milestone): string {
  if (milestone.done) return 'bg-ink';
  if (milestone.id === 'half-house') return 'bg-ok';
  if (milestone.id === 'everyone') return 'bg-warn';
  return 'bg-ink';
}

export default function MilestonesCard() {
  const { milestones, isError, refetch } = usePlannerProgress();

  if (isError) {
    return (
      <div className="flex-[2_1_320px]">
        <ErrorNotice message="Could not load milestones." onRetry={refetch} />
      </div>
    );
  }

  if (milestones.length === 0) {
    return <Skeleton className="min-h-92.5 flex-[2_1_320px] rounded-3xl" />;
  }

  const doneCount = milestones.filter((milestone) => milestone.done).length;

  return (
    <section
      aria-labelledby="milestones-title"
      className="flex flex-[2_1_320px] flex-col gap-1.5 rounded-3xl border border-line bg-white p-6"
    >
      <div className="mb-2 flex items-baseline justify-between">
        <h2 id="milestones-title" className="font-display text-xl font-bold">
          Milestones
        </h2>
        <span className="font-mono text-[13px] text-muted">
          {doneCount} of {milestones.length}
        </span>
      </div>

      <ul className="flex flex-col">
        {milestones.map((milestone) => (
          <li key={milestone.id} className="flex items-center gap-3.5 border-t border-hairline py-3">
            {milestone.done ? (
              <span className="flex size-8 flex-none items-center justify-center rounded-full bg-ink text-lime">
                <Check className="size-4" strokeWidth={2.6} aria-hidden="true" />
                <span className="sr-only">Complete</span>
              </span>
            ) : (
              <span
                className="size-8 flex-none rounded-full border-2 border-dashed border-ink-text"
                role="img"
                aria-label="In progress"
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold">{milestone.title}</p>
              <div className="mt-1.5 flex items-center gap-2.5">
                <div
                  role="progressbar"
                  aria-label={`${milestone.title} progress`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(milestone.pct)}
                  className="h-1.5 flex-1 overflow-hidden rounded-[3px] bg-hairline"
                >
                  <div
                    className={`h-full rounded-[3px] transition-[width] duration-500 ${barColor(milestone)}`}
                    style={{ width: `${milestone.pct}%` }}
                  />
                </div>
                <span className="font-mono text-xs whitespace-nowrap text-body">{milestone.meta}</span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
