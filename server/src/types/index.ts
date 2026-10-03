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
}
