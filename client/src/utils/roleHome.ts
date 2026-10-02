import type { UserRole } from '@/types';

export function roleHome(role: UserRole): string {
  return role === 'planner' ? '/planner' : '/attendee';
}
