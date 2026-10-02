import { CalendarDays, Home, UtensilsCrossed } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { NavLink } from 'react-router-dom';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/attendee', label: 'Home', icon: Home, end: true },
  { to: '/attendee/schedule', label: 'Schedule', icon: CalendarDays },
  { to: '/attendee/preferences', label: 'Dietary', icon: UtensilsCrossed },
];

export default function BottomNav() {
  return (
    <nav
      aria-label="Attendee navigation"
      className="fixed bottom-0 left-1/2 z-20 w-full max-w-md -translate-x-1/2 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom,0px)]"
    >
      <ul className="grid grid-cols-3">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                [
                  'flex h-16 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors',
                  'hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500',
                  isActive ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-900',
                ].join(' ')
              }
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
