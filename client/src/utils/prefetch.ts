import type { UserRole } from '@/types';

/**
 * Starts downloading the first pages someone will land on after signing in, while they are still on the sign-in
 * page. The imports are the same ones the router uses, so the code is ready when it asks. A failure is ignored:
 * the router fetches the page itself when it is needed.
 */
export function prefetchHome(role: UserRole): void {
  const pages =
    role === 'planner'
      ? [import('@/components/layout/PlannerLayout'), import('@/views/PlannerDashboard')]
      : [import('@/components/layout/AttendeeLayout'), import('@/views/AttendeeView')];
  for (const page of pages) page.catch(() => undefined);
}
