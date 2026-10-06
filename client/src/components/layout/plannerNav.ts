import { LayoutGrid, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface PlannerNavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
  /** Shows the pending-RSVP count next to the label. */
  showPending?: boolean;
}

/** The planner's destinations, shared by the desktop sidebar and the phone tab bar. */
export const PLANNER_NAV: PlannerNavItem[] = [
  { to: '/planner', label: 'Dashboard', icon: LayoutGrid, end: true },
  { to: '/planner/attendees', label: 'Attendees', icon: Users, showPending: true },
];
