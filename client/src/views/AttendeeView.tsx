import { LogOut } from 'lucide-react';
import ErrorBoundary from '@/components/ErrorBoundary';
import ErrorNotice from '@/components/ErrorNotice';
import DayGlance from '@/components/attendee/DayGlance';
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
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-5">
      <div className="flex min-w-0 flex-col gap-4 lg:flex-[1_1_380px] lg:gap-5">
        <LevelCard progress={progress} />
        <RsvpCard attendee={progress.attendee} />
      </div>
      <div className="flex min-w-0 flex-col gap-4 lg:flex-[1.5_1_460px] lg:gap-5">
        <QuestList quests={progress.quests} />
        <div className="lg:hidden">
          <FirstStopCard session={progress.sessions[0]} />
        </div>
        <DayGlance sessions={progress.sessions} />
      </div>
    </div>
  );
}

export default function AttendeeView() {
  usePageTitle('Your offsite');
  const { session, signOut } = useAuth();
  if (!session) return null;

  const firstName = session.name.split(' ')[0];

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      <header className="flex items-center gap-3">
        <span
          className="flex size-11 flex-none items-center justify-center rounded-full bg-brand text-[15px] lg:hidden font-semibold text-white"
          aria-hidden="true"
        >
          {initials(session.name)}
        </span>
        <div className="flex-1">
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted lg:text-xs">Company offsite</p>
          <h1 className="mt-0.5 font-display text-[26px] leading-tight font-extrabold tracking-tight lg:mt-1.5 lg:text-[40px]">
            Hi, {firstName}
          </h1>
          <p className="mt-1.5 hidden text-base text-body lg:block">Here's where your trip stands.</p>
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
