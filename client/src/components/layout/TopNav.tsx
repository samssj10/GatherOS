import { Link, NavLink } from 'react-router-dom';
import SignOutIcon from '@/components/layout/SignOutIcon';
import { ATTENDEE_NAV } from '@/components/layout/attendeeNav';
import { useAttendeeProgress } from '@/hooks/useAttendeeProgress';
import { useAuth } from '@/hooks/useAuth';
import { initials } from '@/utils/format';

/** Level badge, progress and XP. Shares the cached attendee and itinerary queries with the pages. */
function LevelPill({ attendeeId }: { attendeeId: string }) {
  const { progress } = useAttendeeProgress(attendeeId);
  if (!progress) return <span className="h-11 w-40" aria-hidden="true" />;

  const { level } = progress;
  return (
    <Link
      to="/attendee/passport"
      aria-label={`Level ${level.level}, ${level.xp} XP`}
      className="flex min-h-11 items-center gap-2.5 rounded-xl border border-ink-line px-3 text-canvas no-underline transition-colors hover:bg-ink-active hover:text-canvas"
    >
      <span className="rounded-md bg-lime px-1.75 py-0.5 font-mono text-[11px] font-semibold text-ink">
        LVL {level.level}
      </span>
      <span className="h-1.5 w-18 overflow-hidden rounded-[3px] bg-ink-line" aria-hidden="true">
        <span className="block h-full bg-lime" style={{ width: `${level.pct}%` }} />
      </span>
      <span className="font-mono text-[13px]">{level.xp} XP</span>
    </Link>
  );
}

/** Desktop top bar (from the lg breakpoint). Phones use BottomNav instead. */
export default function TopNav() {
  const { session, signOut } = useAuth();

  return (
    <header className="hidden bg-ink text-canvas lg:block">
      <div className="mx-auto flex max-w-300 flex-wrap items-center gap-x-7 gap-y-3 px-8 py-3">
        <Link to="/attendee" className="flex items-center gap-2.5 text-white no-underline hover:text-white">
          <span className="flex size-8.5 items-center justify-center rounded-[10px] bg-brand font-display text-lg font-extrabold">
            G
          </span>
          <span className="font-display text-[19px] font-bold">GatherOS</span>
        </Link>

        <nav aria-label="Attendee" className="flex flex-1 flex-wrap gap-1">
          {ATTENDEE_NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-[15px] font-medium no-underline transition-colors ${
                  isActive
                    ? 'bg-ink-active text-white hover:text-white'
                    : 'text-ink-text hover:bg-ink-raised hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`size-4.5 ${isActive ? 'text-lime' : ''}`} strokeWidth={1.9} aria-hidden="true" />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {session && <LevelPill attendeeId={session.id} />}
          <span
            className="flex size-10 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white"
            aria-hidden="true"
          >
            {initials(session?.name ?? '')}
          </span>
          <button
            type="button"
            onClick={signOut}
            aria-label="Sign out"
            className="flex size-11 items-center justify-center rounded-xl text-ink-text transition-colors hover:bg-ink-active hover:text-white"
          >
            <SignOutIcon className="size-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
