import { LogOut } from 'lucide-react';
import ErrorBoundary from '@/components/ErrorBoundary';
import ErrorNotice from '@/components/ErrorNotice';
import FirstStopCard from '@/components/attendee/FirstStopCard';
import LevelCard from '@/components/attendee/LevelCard';
import QuestList from '@/components/attendee/QuestList';
import RsvpCard from '@/components/attendee/RsvpCard';
import Skeleton from '@/components/Skeleton';
import { useAttendeeProgress } from '@/hooks/useAttendeeProgress';
import { useAuth } from '@/hooks/useAuth';
import { usePageTitle } from '@/hooks/usePageTitle';
import { initials } from '@/utils/format';

function HomeBody({ attendeeId }: { attendeeId: string }) {
  const { progress, isError, refetch } = useAttendeeProgress(attendeeId);

  if (isError) return <ErrorNotice message="Could not load your offsite." onRetry={refetch} />;

  if (!progress) {
    return (
      <>
        <Skeleton className="h-44 rounded-3xl" />
        <Skeleton className="h-52 rounded-3xl" />
        <Skeleton className="h-64 rounded-3xl" />
      </>
    );
  }

  return (
    <>
      <LevelCard progress={progress} />
      <RsvpCard attendee={progress.attendee} />
      <QuestList quests={progress.quests} />
      <FirstStopCard session={progress.sessions[0]} />
    </>
  );
}

export default function AttendeeView() {
  usePageTitle('Your offsite');
  const { session, signOut } = useAuth();
  if (!session) return null;

  const firstName = session.name.split(' ')[0];

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center gap-3">
        <span
          className="flex size-11 flex-none items-center justify-center rounded-full bg-brand text-[15px] lg:hidden font-semibold text-white"
          aria-hidden="true"
        >
          {initials(session.name)}
        </span>
        <div className="flex-1">
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted">Company offsite</p>
          <h1 className="mt-0.5 font-display text-[26px] leading-tight font-extrabold tracking-tight">
            Hi, {firstName}
          </h1>
        </div>
        <button
          type="button"
          onClick={signOut}
          aria-label="Sign out"
          className="flex size-11 items-center justify-center rounded-xl border border-field bg-white text-body transition-colors hover:bg-wash lg:hidden"
        >
          <LogOut className="size-5" strokeWidth={1.8} aria-hidden="true" />
        </button>
      </header>

      <ErrorBoundary inline>
        <HomeBody attendeeId={session.id} />
      </ErrorBoundary>
    </div>
  );
}
