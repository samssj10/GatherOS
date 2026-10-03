import ErrorBoundary from '@/components/ErrorBoundary';
import ErrorNotice from '@/components/ErrorNotice';
import Journey from '@/components/attendee/Journey';
import Skeleton from '@/components/Skeleton';
import { useAttendeeProgress } from '@/hooks/useAttendeeProgress';
import { useAuth } from '@/hooks/useAuth';
import { usePageTitle } from '@/hooks/usePageTitle';

function JourneyBody({ attendeeId }: { attendeeId: string }) {
  const { progress, isError, refetch } = useAttendeeProgress(attendeeId);

  return (
    <>
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted">
          {progress
            ? `${progress.sessions.length} stops · ${progress.stamps.size} ${progress.stamps.size === 1 ? 'stamp' : 'stamps'} collected`
            : 'Loading your stops'}
        </p>
        <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight">Your journey</h1>
      </header>

      {isError ? (
        <ErrorNotice message="Could not load your journey." onRetry={refetch} />
      ) : progress ? (
        <Journey progress={progress} />
      ) : (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-16 rounded-2xl" />
          <Skeleton className="h-36 rounded-[18px]" />
          <Skeleton className="h-36 rounded-[18px]" />
        </div>
      )}
    </>
  );
}

export default function AttendeeSchedule() {
  usePageTitle('Your journey');
  const { session } = useAuth();
  if (!session) return null;

  return (
    <div className="flex flex-col gap-4">
      <ErrorBoundary inline>
        <JourneyBody attendeeId={session.id} />
      </ErrorBoundary>
    </div>
  );
}
