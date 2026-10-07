import { LogIn } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAttendeeSummary } from '@/api/attendees';
import { PLANNER_NAV } from '@/components/layout/plannerNav';
import HostRankCard from '@/components/planner/HostRankCard';
import { useAuth } from '@/hooks/useAuth';
import { formatNumber, initials } from '@/utils/format';

export default function Sidebar() {
  const { session, signOut } = useAuth();
  const pending = useAttendeeSummary().data?.rsvp.pending;
  // The rank is earned on the dashboard, so the card only appears there.
  const onDashboard = useLocation().pathname === '/planner';

  return (
    <aside className="hidden flex-col gap-7 bg-ink px-4.5 py-6 text-canvas lg:sticky lg:top-0 lg:flex lg:h-screen lg:overflow-y-auto">
      <div className="flex items-center gap-3 px-2">
        <span className="flex size-9.5 items-center justify-center rounded-[11px] bg-brand font-display text-xl font-extrabold text-white">
          G
        </span>
        <span className="font-display text-xl font-bold tracking-tight">GatherOS</span>
      </div>

      <nav aria-label="Planner" className="flex flex-col gap-1">
        {PLANNER_NAV.map(({ to, label, icon: Icon, end, showPending }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex min-h-11.5 items-center gap-3 rounded-xl px-3.5 text-[15px] font-medium no-underline transition-colors ${
                isActive
                  ? 'bg-ink-active text-white'
                  : 'text-ink-text hover:bg-ink-active/60 hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={`size-5 ${isActive ? 'text-lime' : ''}`}
                  strokeWidth={1.8}
                  aria-hidden="true"
                />
                {label}
                {showPending && pending !== undefined && (
                  <span className="ml-auto rounded-full bg-ink-line px-2 py-0.5 font-mono text-xs text-[#e6e8f0]">
                    <span className="sr-only">{formatNumber(pending)} pending responses</span>
                    <span aria-hidden="true">{formatNumber(pending)}</span>
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {onDashboard && <HostRankCard />}

      <div className="mt-auto flex flex-col gap-3.5 border-t border-ink-line px-1 pt-4">
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-ink-line text-[13px] font-semibold">
            {initials(session?.name ?? '')}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{session?.name}</p>
            <p className="truncate text-xs text-ink-text-3" title={session?.email}>
              {session?.email}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={signOut}
          className="-mx-1.5 flex min-h-11 items-center gap-2.5 rounded-[10px] px-1.5 text-sm text-ink-text transition-colors hover:bg-ink-active/60 hover:text-white"
        >
          <LogIn className="size-4.5" strokeWidth={1.8} aria-hidden="true" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
