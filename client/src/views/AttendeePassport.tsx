import ErrorBoundary from '@/components/ErrorBoundary';
import ErrorNotice from '@/components/ErrorNotice';
import BadgeList from '@/components/attendee/BadgeList';
import StampGrid from '@/components/attendee/StampGrid';
import TeamRace from '@/components/attendee/TeamRace';
import Skeleton from '@/components/Skeleton';
import { useAttendeeProgress } from '@/hooks/useAttendeeProgress';
import type { AttendeeProgress } from '@/hooks/useAttendeeProgress';
import { useAuth } from '@/hooks/useAuth';
import { usePageTitle } from '@/hooks/usePageTitle';
import { initials } from '@/utils/format';
import { stampsHint } from '@/utils/gamification';

/** Desktop-only tiles beside the passport holder: XP, stamps and badges at a glance. */
function StatTiles({ progress }: { progress: AttendeeProgress }) {
  const { level, stamps, sessions, badges, earnedBadges } = progress;
  const firstDay = sessions.length > 0 ? Math.min(...sessions.map((session) => session.day)) : undefined;
  const badgesLeft = badges.length - earnedBadges;

  const tiles = [
    {
      label: 'XP',
      value: <>{level.xp}</>,
      sub: level.next ? `${level.next.xpToGo} to ${level.next.rank}` : 'Top level reached',
    },
    {
      label: 'Stamps',
      value: (
        <>
          {stamps.size}
          <span className="text-ink-text-3">/{sessions.length}</span>
        </>
      ),
      sub: stampsHint(stamps.size, sessions.length, firstDay),
    },
    {
      label: 'Badges',
      value: (
        <span className="text-lime">
          {earnedBadges}
          <span className="text-ink-text-3">/{badges.length}</span>
        </span>
      ),
      sub: badgesLeft === 0 ? 'All earned' : `${badgesLeft} to unlock`,
    },
  ];

  return (
    <dl className="hidden flex-[1_1_420px] grid-cols-3 gap-3 lg:grid">
      {tiles.map((tile) => (
        <div key={tile.label} className="rounded-2xl border border-ink-line bg-ink-raised px-4 py-3.5">
          <dt className="text-[13px] text-ink-text-2">{tile.label}</dt>
          <dd className="font-display text-[28px] font-extrabold">{tile.value}</dd>
          <dd className="text-xs text-ink-text-3">{tile.sub}</dd>
        </div>
      ))}
    </dl>
  );
}

function PassportBody({ attendeeId, name }: { attendeeId: string; name: string }) {
  const { progress, isError, refetch } = useAttendeeProgress(attendeeId);

  return (
    <>
      <header className="flex flex-wrap items-center gap-4 rounded-3xl bg-ink p-5 text-canvas lg:gap-x-10 lg:gap-y-6 lg:p-7">
        <div className="flex min-w-0 flex-1 items-center gap-4 lg:flex-[1_1_340px] lg:gap-5">
          <span
            className="flex size-16 flex-none items-center justify-center rounded-full bg-brand font-display text-[22px] font-extrabold text-white shadow-[0_0_0_3px_var(--color-ink),0_0_0_5px_var(--color-lime)] lg:size-20 lg:text-[28px] lg:shadow-[0_0_0_4px_var(--color-ink),0_0_0_7px_var(--color-lime)]"
            aria-hidden="true"
          >
            {initials(name)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-lime lg:text-xs">Offsite passport</p>
            <h1 className="mt-0.5 font-display text-2xl font-extrabold lg:my-1 lg:text-[34px]">{name}</h1>
            <p className="text-[13px] text-ink-text-2 lg:text-[15px]">
              {progress ? (
                <>
                  <span className="lg:hidden">LVL {progress.level.level}</span>
                  <span className="hidden lg:inline">Level {progress.level.level}</span> {progress.level.rank} ·{' '}
                  {progress.attendee.department}
                </>
              ) : (
                ' '
              )}
            </p>
          </div>
        </div>
        {progress && <StatTiles progress={progress} />}
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
          <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-start lg:gap-5">
            <div className="min-w-0 lg:flex-[2_1_520px]">
              <BadgeList badges={progress.badges} />
            </div>
            <div className="min-w-0 lg:flex-[1_1_320px]">
              <TeamRace ownDepartment={progress.attendee.department} />
            </div>
          </div>
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
    <div className="flex flex-col gap-4 lg:gap-5">
      <ErrorBoundary inline>
        <PassportBody attendeeId={session.id} name={session.name} />
      </ErrorBoundary>
    </div>
  );
}
