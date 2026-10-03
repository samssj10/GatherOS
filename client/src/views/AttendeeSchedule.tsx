import ErrorBoundary from '@/components/ErrorBoundary';
import ErrorNotice from '@/components/ErrorNotice';
import Journey from '@/components/attendee/Journey';
import JourneyBoard from '@/components/attendee/JourneyBoard';
import Skeleton from '@/components/Skeleton';
import { useAttendeeProgress } from '@/hooks/useAttendeeProgress';
import { useAuth } from '@/hooks/useAuth';
import { DESKTOP_QUERY, useMediaQuery } from '@/hooks/useMediaQuery';
import { usePageTitle } from '@/hooks/usePageTitle';

function JourneyBody({ attendeeId }: { attendeeId: string }) {
  const { progress, isError, refetch } = useAttendeeProgress(attendeeId);
  const desktop = useMediaQuery(DESKTOP_QUERY);
  const dayCount = progress ? new Set(progress.sessions.map((session) => session.day)).size : 0;

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-4 lg:mb-2">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted lg:text-xs">
            {progress ? (
              <>
                <span className="lg:hidden">
                  {progress.sessions.length} stops · {progress.stamps.size}{' '}
                  {progress.stamps.size === 1 ? 'stamp' : 'stamps'} collected
                </span>
                <span className="hidden lg:inline">
                  {progress.sessions.length} stops · {dayCount} {dayCount === 1 ? 'day' : 'days'}
                </span>
              </>
            ) : (
              'Loading your stops'
            )}
          </p>
          <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight lg:mt-1.5 lg:text-[40px]">
            Your journey
          </h1>
        </div>
        <p className="hidden max-w-105 text-[15px] text-body lg:block">
          Check in at each session to stamp your passport.
        </p>
      </header>

      {isError ? (
        <ErrorNotice message="Could not load your journey." onRetry={refetch} />
      ) : progress ? (
        desktop ? <JourneyBoard progress={progress} /> : <Journey progress={progress} />
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
    <div className="flex flex-col gap-4 lg:gap-6">
      <ErrorBoundary inline>
        <JourneyBody attendeeId={session.id} />
      </ErrorBoundary>
    </div>
  );
}
