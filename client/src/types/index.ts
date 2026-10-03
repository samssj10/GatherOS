export type UserRole = 'planner' | 'attendee';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  eventId: string;
}

export interface ScheduleItem {
  id: string;
  day: number;
  startTime: string;
  endTime: string;
  title: string;
  description: string;
  location: string;
  category: 'workshop' | 'keynote' | 'meal' | 'activity';
  costEstimate: number;
}

export interface Attendee {
  id: string;
  fullName: string;
  email: string;
  department: string;
  rsvpStatus: 'accepted' | 'declined' | 'pending';
  dietaryPreference: 'none' | 'vegetarian' | 'vegan' | 'gluten-free';
  flightAssigned: boolean;
  /** True once the attendee has explicitly chosen a dietary option (including 'none'). */
  dietaryConfirmed: boolean;
  /** Ids of the sessions the attendee has checked in to. */
  stamps: string[];
  /** ISO timestamp of the last reminder a planner sent, or null. */
  nudgedAt: string | null;
}

export interface AttendeeScheduleDTO {
  id: string;
  eventId: string;
  day: number;
  sessionTitle: string;
  startTime: string;
  endTime: string;
  locationName: string;
  category: string;
  isRsvpRequired: boolean;
  /** Check-in is open only while a session is live. */
  checkInStatus: 'upcoming' | 'live' | 'ended';
}

export type AttendeeUpdate = Partial<Pick<Attendee, 'rsvpStatus' | 'dietaryPreference'>>;

export interface BudgetSummary {
  budget: number;
  estimatedSpend: number;
  remaining: number;
}

export interface AttendeeSummary {
  total: number;
  rsvp: Record<Attendee['rsvpStatus'], number>;
  dietary: Record<Attendee['dietaryPreference'], number>;
  flightsAssigned: number;
}

export interface ApiErrorBody {
  error: { code: string; message: string; details?: unknown };
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface GenerateScheduleInput {
  prompt: string;
  city?: string;
  days: number;
  attendeeCount: number;
  budget?: number;
}

export interface DepartmentStat {
  department: string;
  total: number;
  accepted: number;
  /** Whole-number percentage of the department that has accepted. */
  pct: number;
}

export interface NudgeResult {
  nudged: number;
}
