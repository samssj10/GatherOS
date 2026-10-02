import BudgetTracker from '@/components/planner/BudgetTracker';
import CalendarBoard from '@/components/planner/CalendarBoard';
import DraftBanner from '@/components/planner/DraftBanner';
import RsvpSummary from '@/components/planner/RsvpSummary';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function PlannerDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">Budget, responses and the three-day itinerary at a glance.</p>
      </div>

      <DraftBanner />

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <ErrorBoundary inline>
            <BudgetTracker />
          </ErrorBoundary>
        </div>
        <ErrorBoundary inline>
          <RsvpSummary />
        </ErrorBoundary>
      </div>

      <ErrorBoundary inline>
        <CalendarBoard />
      </ErrorBoundary>
    </div>
  );
}
