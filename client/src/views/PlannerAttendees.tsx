import ErrorBoundary from '@/components/ErrorBoundary';
import AttendeeRoster from '@/components/planner/AttendeeRoster';
import { usePageTitle } from '@/hooks/usePageTitle';

export default function PlannerAttendees() {
  usePageTitle('Attendees');

  return (
    <ErrorBoundary inline>
      <AttendeeRoster />
    </ErrorBoundary>
  );
}
