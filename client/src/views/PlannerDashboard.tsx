import AiCommandBar from '@/components/layout/AiCommandBar';
import ErrorBoundary from '@/components/ErrorBoundary';
import BudgetCard from '@/components/planner/BudgetCard';
import CalendarBoard from '@/components/planner/CalendarBoard';
import DraftBanner from '@/components/planner/DraftBanner';
import MilestonesCard from '@/components/planner/MilestonesCard';
import ReadinessCard from '@/components/planner/ReadinessCard';
import RsvpOverview from '@/components/planner/RsvpOverview';
import { usePageTitle } from '@/hooks/usePageTitle';
import { usePlannerProgress } from '@/hooks/usePlannerProgress';
import { eventDayNumbers } from '@/utils/eventLength';

export default function PlannerDashboard() {
  usePageTitle('Mission control');
  const items = usePlannerProgress().numbers?.items;
  const sessionCount = items?.length;
  const dayCount = eventDayNumbers(items ?? []).length;

  return (
    <>
      <ErrorBoundary inline>
        <AiCommandBar />
      </ErrorBoundary>

      <div className="flex w-full max-w-310 flex-col gap-6 p-8">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.08em] text-muted">
              Company offsite · {dayCount} days{sessionCount !== undefined ? ` · ${sessionCount} sessions` : ''}
            </p>
            <h1 className="mt-1.5 font-display text-[40px] leading-tight font-extrabold tracking-[-0.02em]">
              Mission control
            </h1>
          </div>
          <p className="text-[15px] text-body">Budget, responses and the itinerary at a glance.</p>
        </header>

        <DraftBanner />

        <div className="flex flex-wrap gap-5">
          <ErrorBoundary inline>
            <ReadinessCard />
          </ErrorBoundary>
          <ErrorBoundary inline>
            <MilestonesCard />
          </ErrorBoundary>
        </div>

        <div className="flex flex-wrap gap-5">
          <ErrorBoundary inline>
            <BudgetCard />
          </ErrorBoundary>
          <ErrorBoundary inline>
            <RsvpOverview />
          </ErrorBoundary>
        </div>

        <ErrorBoundary inline>
          <CalendarBoard />
        </ErrorBoundary>
      </div>
    </>
  );
}
