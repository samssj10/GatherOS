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
  return attendee;
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
