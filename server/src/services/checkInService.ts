import type { Attendee } from '../types';
import { AppError } from '../utils/AppError';
import { currentRoomCode, verifyRoomCode } from '../utils/checkInCode';
import { checkInDenial } from '../utils/checkInRules';
import type { CheckInStatus } from '../utils/eventClock';
import { env } from '../utils/env';
import { getAttendeeById } from './attendeeService';
import { db } from './mockDb';
import { eventNow, sessionCheckInStatus } from './scheduleService';

export interface RoomCodeInfo {
  sessionId: string;
  code: string;
  /** ISO time the code changes. */
  expiresAt: string;
  status: CheckInStatus;
  /** Attendees who have checked in to this session. */
  checkedIn: number;
  /** Attendees who are going, so could check in. */
  eligible: number;
}

function findSession(sessionId: string) {
  const session = db.schedule.find((item) => item.id === sessionId);
  if (!session) throw AppError.notFound(`Session ${sessionId} not found`);
  return session;
}

/** The code to show in the room, with live check-in numbers. Planner only (enforced by the route). */
export function getRoomCode(sessionId: string): RoomCodeInfo {
  const session = findSession(sessionId);
  const now = eventNow();
  const { code, expiresAt } = currentRoomCode(env.SESSION_SECRET, session.id, now);

  let checkedIn = 0;
  let eligible = 0;
  for (const attendee of db.attendees) {
    if (attendee.rsvpStatus === 'accepted') eligible += 1;
    if (attendee.stamps.includes(session.id)) checkedIn += 1;
  }

  return {
    sessionId: session.id,
    code,
    expiresAt: expiresAt.toISOString(),
    status: sessionCheckInStatus(session, now),
    checkedIn,
    eligible,
  };
}

/** Records a check-in after the RSVP, the clock and the room code all agree. */
export function checkIn(attendeeId: string, sessionId: string, submittedCode: string): Attendee {
  const attendee = getAttendeeById(attendeeId);
  const session = findSession(sessionId);
  const now = eventNow();

  const denial = checkInDenial({
    rsvpStatus: attendee.rsvpStatus,
    alreadyStamped: attendee.stamps.includes(session.id),
    status: sessionCheckInStatus(session, now),
    codeCheck: verifyRoomCode(env.SESSION_SECRET, session.id, submittedCode, now),
  });
  if (denial) throw denial;

  attendee.stamps.push(session.id);
  return attendee;
}
