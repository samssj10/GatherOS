import { usePageTitle } from '@/hooks/usePageTitle';
import Timeline from '@/components/attendee/Timeline';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function AttendeeSchedule() {
  usePageTitle('Your schedule');
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-slate-900">Your schedule</h1>
      <ErrorBoundary inline>
        <Timeline />
      </ErrorBoundary>
    </div>
  );
}
