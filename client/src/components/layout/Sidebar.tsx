import { LayoutDashboard, LogOut, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/planner', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/planner/attendees', label: 'Attendees', icon: Users },
];

export default function Sidebar() {
  const { session, signOut } = useAuth();

  return (
    <aside className="fixed inset-y-0 left-0 z-20 flex w-[250px] flex-col border-r border-slate-200 bg-white">
      <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-6">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
          G
        </span>
        <span className="text-lg font-bold tracking-tight text-slate-900">GatherOS</span>
      </div>

      <nav aria-label="Planner navigation" className="flex-1 space-y-1 p-4">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              [
                'flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors',
                'hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
                isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-900',
              ].join(' ')
            }
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-200 p-4">
        <p className="truncate px-3 text-sm font-medium text-slate-900">{session?.name}</p>
        <p className="truncate px-3 text-xs text-slate-500">{session?.email}</p>
        <button
          type="button"
          onClick={signOut}
          className="mt-3 flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
