import { NavLink } from 'react-router-dom';
import { ATTENDEE_NAV } from '@/components/layout/attendeeNav';

/** Phone tab bar. The desktop layout uses TopNav instead. */
export default function BottomNav() {
  return (
    <nav
      aria-label="Attendee"
      className="fixed bottom-0 left-1/2 z-20 w-full max-w-md -translate-x-1/2 border-t border-line bg-white px-2 pt-1.5 pb-[max(0.625rem,env(safe-area-inset-bottom,0px))] lg:hidden"
    >
      <ul className="grid grid-cols-4">
        {ATTENDEE_NAV.map(({ to, label, icon: Icon, end }) => (
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
