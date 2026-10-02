import AttendeeRoster from '@/components/planner/AttendeeRoster';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function PlannerAttendees() {
  return (
    <ErrorBoundary inline>
      <AttendeeRoster />
    </ErrorBoundary>
  );
}
