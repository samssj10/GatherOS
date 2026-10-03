import ErrorBoundary from '@/components/ErrorBoundary';
import ErrorNotice from '@/components/ErrorNotice';
import BadgeList from '@/components/attendee/BadgeList';
import StampGrid from '@/components/attendee/StampGrid';
import TeamRace from '@/components/attendee/TeamRace';
import Skeleton from '@/components/Skeleton';
import { useAttendeeProgress } from '@/hooks/useAttendeeProgress';
import { useAuth } from '@/hooks/useAuth';
import { usePageTitle } from '@/hooks/usePageTitle';
import { initials } from '@/utils/format';

function PassportBody({ attendeeId, name }: { attendeeId: string; name: string }) {
  const { progress, isError, refetch } = useAttendeeProgress(attendeeId);

  return (
    <>
      <header className="flex items-center gap-4 rounded-3xl bg-ink p-5 text-canvas">
        <span
          className="flex size-16 flex-none items-center justify-center rounded-full bg-brand font-display text-[22px] font-extrabold text-white shadow-[0_0_0_3px_var(--color-ink),0_0_0_5px_var(--color-lime)]"
          aria-hidden="true"
        >
          {initials(name)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-lime">Offsite passport</p>
          <h1 className="mt-0.5 font-display text-2xl font-extrabold">{name}</h1>
          <p className="text-[13px] text-ink-text-2">
            {progress ? `LVL ${progress.level.level} ${progress.level.rank} · ${progress.attendee.department}` : ' '}
          </p>
        </div>
      </header>

      {isError ? (
        <ErrorNotice message="Could not load your passport." onRetry={refetch} />
      ) : !progress ? (
        <>
          <Skeleton className="h-64 rounded-3xl" />
          <Skeleton className="h-80 rounded-3xl" />
        </>
      ) : (
        <>
          <StampGrid progress={progress} />
          <BadgeList badges={progress.badges} />
          <TeamRace ownDepartment={progress.attendee.department} />
        </>
      )}
    </>
  );
}

export default function AttendeePassport() {
  usePageTitle('Your passport');
  const { session } = useAuth();
  if (!session) return null;

  return (
    <div className="flex flex-col gap-4">
      <ErrorBoundary inline>
        <PassportBody attendeeId={session.id} name={session.name} />
      </ErrorBoundary>
    </div>
  );
}
