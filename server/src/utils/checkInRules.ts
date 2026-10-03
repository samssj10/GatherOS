import type { Attendee } from '../types';
import { AppError } from './AppError';
import type { CodeCheck } from './checkInCode';
import type { CheckInStatus } from './eventClock';

export interface CheckInContext {
  rsvpStatus: Attendee['rsvpStatus'];
  alreadyStamped: boolean;
  status: CheckInStatus;
  codeCheck: CodeCheck;
}

/**
 * Why a check-in is refused, or null when it should go through. The first failing rule wins, in the
 * order an attendee can act on: RSVP, already done, session timing, then the code itself.
 */
export function checkInDenial(context: CheckInContext): AppError | null {
  if (context.rsvpStatus !== 'accepted') {
    return new AppError(403, 'Accept your RSVP to collect stamps', 'NOT_GOING');
  }
  if (context.alreadyStamped) {
    return new AppError(409, "You've already collected this stamp", 'ALREADY_STAMPED');
  }
  if (context.status === 'upcoming') {
    return new AppError(409, 'Check-in opens when the session starts', 'CHECK_IN_NOT_OPEN');
  }
  if (context.status === 'ended') {
    return new AppError(409, 'Check-in closed when the session ended', 'CHECK_IN_CLOSED');
  }
  if (context.codeCheck === 'expired') {
    return new AppError(
      400,
      'That code has expired. Codes change every minute, so use the one on the screen now.',
      'CODE_EXPIRED',
    );
  }
  if (context.codeCheck === 'invalid') {
    return new AppError(400, "That code doesn't match. Check the screen in the room and try again.", 'CODE_INVALID');
  }
  return null;
}
