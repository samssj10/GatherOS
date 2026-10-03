import type { Attendee } from '../types';
import { AppError } from '../utils/AppError';
import { db } from './mockDb';

export interface ListAttendeesParams {
  page: number;
  limit: number;
  search?: string;
  rsvpStatus?: Attendee['rsvpStatus'];
  department?: string;
}

export interface PaginatedAttendees {
  data: Attendee[];
  total: number;
  page: number;
  limit: number;
}

export interface AttendeeSummary {
  total: number;
  rsvp: Record<Attendee['rsvpStatus'], number>;
  dietary: Record<Attendee['dietaryPreference'], number>;
  flightsAssigned: number;
}

export type AttendeeUpdate = Partial<Pick<Attendee, 'rsvpStatus' | 'dietaryPreference'>>;

export function listAttendees(params: ListAttendeesParams): PaginatedAttendees {
  const { page, limit, search, rsvpStatus, department } = params;
  const needle = search?.toLowerCase();

  const filtered = db.attendees.filter((a) => {
    if (rsvpStatus && a.rsvpStatus !== rsvpStatus) return false;
    if (department && a.department !== department) return false;
    if (needle && !a.fullName.toLowerCase().includes(needle) && !a.email.includes(needle)) {
      return false;
    }
    return true;
  });

  const start = (page - 1) * limit;
  return { data: filtered.slice(start, start + limit), total: filtered.length, page, limit };
}

export function getAttendeeById(id: string): Attendee {
  const attendee = db.attendees.find((a) => a.id === id);
  if (!attendee) throw AppError.notFound(`Attendee ${id} not found`);
  return attendee;
}

export function updateAttendee(id: string, update: AttendeeUpdate): Attendee {
  const attendee = getAttendeeById(id);
  Object.assign(attendee, update);
  // Choosing a dietary option, even 'none', is an answer.
  if (update.dietaryPreference !== undefined) attendee.dietaryConfirmed = true;
  return attendee;
}

/** Records a check-in. Only attendees who are going can collect stamps; repeating one is harmless. */
export function addStamp(attendeeId: string, sessionId: string): Attendee {
  const attendee = getAttendeeById(attendeeId);
  if (!db.schedule.some((item) => item.id === sessionId)) {
    throw AppError.notFound(`Session ${sessionId} not found`);
  }
  if (attendee.rsvpStatus !== 'accepted') {
    throw AppError.forbidden('Accept your RSVP to collect stamps');
  }
  if (!attendee.stamps.includes(sessionId)) attendee.stamps.push(sessionId);
  return attendee;
}

/**
 * Mock reminder: marks pending attendees as nudged. No message is actually sent. With no ids,
 * every pending attendee is nudged. Attendees who already answered are skipped.
 */
export function nudgeAttendees(ids?: string[]): { nudged: number } {
  const targets = ids
    ? ids.map((id) => getAttendeeById(id))
    : db.attendees.filter((attendee) => attendee.rsvpStatus === 'pending');

  const now = new Date().toISOString();
  let nudged = 0;
  for (const attendee of targets) {
    if (attendee.rsvpStatus !== 'pending') continue;
    attendee.nudgedAt = now;
    nudged += 1;
  }
  return { nudged };
}

export interface DepartmentStat {
  department: string;
  total: number;
  accepted: number;
  /** Whole-number percentage of the department that has accepted. */
  pct: number;
}

/** Aggregate only: safe to show to any signed-in user because it holds no personal data. */
export function getDepartmentStats(): DepartmentStat[] {
  const byDepartment = new Map<string, { total: number; accepted: number }>();
  for (const attendee of db.attendees) {
    const entry = byDepartment.get(attendee.department) ?? { total: 0, accepted: 0 };
    entry.total += 1;
    if (attendee.rsvpStatus === 'accepted') entry.accepted += 1;
    byDepartment.set(attendee.department, entry);
  }

  return [...byDepartment.entries()]
    .map(([department, { total, accepted }]) => ({
      department,
      total,
      accepted,
      pct: Math.round((accepted / total) * 100),
    }))
    .sort((a, b) => b.pct - a.pct || a.department.localeCompare(b.department));
}

export function getAttendeeSummary(): AttendeeSummary {
  const summary: AttendeeSummary = {
    total: db.attendees.length,
    rsvp: { accepted: 0, declined: 0, pending: 0 },
    dietary: { none: 0, vegetarian: 0, vegan: 0, 'gluten-free': 0 },
    flightsAssigned: 0,
  };

  for (const a of db.attendees) {
    summary.rsvp[a.rsvpStatus] += 1;
    summary.dietary[a.dietaryPreference] += 1;
    if (a.flightAssigned) summary.flightsAssigned += 1;
  }

  return summary;
}
