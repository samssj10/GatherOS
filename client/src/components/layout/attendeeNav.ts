import { Award, CalendarDays, House, Utensils } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface AttendeeNavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

/** The four attendee destinations, shared by the phone tab bar and the desktop top bar. */
export const ATTENDEE_NAV: AttendeeNavItem[] = [
  { to: '/attendee', label: 'Home', icon: House, end: true },
  { to: '/attendee/schedule', label: 'Journey', icon: CalendarDays },
  { to: '/attendee/passport', label: 'Passport', icon: Award },
  { to: '/attendee/preferences', label: 'Dietary', icon: Utensils },
];
