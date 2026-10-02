import type { UserSession } from '../types';
import { AppError } from '../utils/AppError';
import { env } from '../utils/env';
import { DEFAULT_EVENT_ID, db } from './mockDb';

/**
 * Mock, passwordless login for the demo: the planner is identified by PLANNER_EMAIL,
 * everyone else must match an attendee in the mock database.
 */
export function login(email: string): UserSession {
  const normalized = email.toLowerCase();

  if (normalized === env.PLANNER_EMAIL.toLowerCase()) {
    return {
      id: 'planner-001',
      name: 'Event Planner',
      email: env.PLANNER_EMAIL,
      role: 'planner',
      eventId: DEFAULT_EVENT_ID,
    };
  }

  const attendee = db.attendees.find((a) => a.email === normalized);
  if (!attendee) throw AppError.unauthorized('Unknown email address');

  return {
    id: attendee.id,
    name: attendee.fullName,
    email: attendee.email,
    role: 'attendee',
    eventId: DEFAULT_EVENT_ID,
  };
}
