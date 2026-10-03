import { Award, CalendarDays, House, Utensils } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { NavLink } from 'react-router-dom';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/attendee', label: 'Home', icon: House, end: true },
  { to: '/attendee/schedule', label: 'Journey', icon: CalendarDays },
  { to: '/attendee/passport', label: 'Passport', icon: Award },
  { to: '/attendee/preferences', label: 'Dietary', icon: Utensils },
];

export default function BottomNav() {
  return (
    <nav
      aria-label="Attendee"
      className="fixed bottom-0 left-1/2 z-20 w-full max-w-md -translate-x-1/2 border-t border-line bg-white px-2 pt-1.5 pb-[max(0.625rem,env(safe-area-inset-bottom,0px))]"
    >
      <ul className="grid grid-cols-4">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex min-h-14 flex-col items-center justify-center gap-1 text-xs no-underline transition-colors ${
                  isActive ? 'font-semibold text-brand-ink' : 'font-medium text-body hover:text-ink'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`flex h-7.5 w-12 items-center justify-center rounded-full transition-colors ${
                      isActive ? 'bg-brand-tint' : ''
                    }`}
                  >
                    <Icon className="size-5" strokeWidth={1.9} aria-hidden="true" />
                  </span>
                  {label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
