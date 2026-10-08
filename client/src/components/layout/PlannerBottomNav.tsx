import { NavLink } from 'react-router-dom';
import { PLANNER_NAV } from '@/components/layout/plannerNav';

/** Phone tab bar for the planner. From lg up the sidebar is used instead. */
export default function PlannerBottomNav() {
  return (
    <nav
      aria-label="Planner"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-white px-2 pt-1.5 pb-[max(0.625rem,env(safe-area-inset-bottom,0px))] lg:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-2">
        {PLANNER_NAV.map(({ to, label, icon: Icon, end }) => (
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
                    className={`relative flex h-7.5 w-12 items-center justify-center rounded-full transition-colors ${
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
