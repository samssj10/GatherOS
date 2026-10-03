import { describe, expect, it } from 'vitest';
import { checkInDenial } from './checkInRules';
import type { CheckInContext } from './checkInRules';

const ok: CheckInContext = { rsvpStatus: 'accepted', alreadyStamped: false, status: 'live', codeCheck: 'valid' };
const denial = (overrides: Partial<CheckInContext>) => checkInDenial({ ...ok, ...overrides });

describe('checkInDenial', () => {
  it('lets a going attendee check in to a live session with a valid code', () => {
    expect(denial({})).toBeNull();
  });

  it('refuses attendees who have not accepted', () => {
    for (const rsvpStatus of ['pending', 'declined'] as const) {
      const error = denial({ rsvpStatus });
      expect(error?.statusCode).toBe(403);
      expect(error?.code).toBe('NOT_GOING');
    }
  });

  it('refuses a repeat check-in', () => {
    const error = denial({ alreadyStamped: true });
    expect(error?.statusCode).toBe(409);
    expect(error?.code).toBe('ALREADY_STAMPED');
  });

  it('refuses before the session starts and after it ends', () => {
    expect(denial({ status: 'upcoming' })?.code).toBe('CHECK_IN_NOT_OPEN');
    expect(denial({ status: 'ended' })?.code).toBe('CHECK_IN_CLOSED');
  });

  it('refuses expired and wrong codes with different errors', () => {
    expect(denial({ codeCheck: 'expired' })?.code).toBe('CODE_EXPIRED');
    expect(denial({ codeCheck: 'invalid' })?.code).toBe('CODE_INVALID');
    expect(denial({ codeCheck: 'invalid' })?.statusCode).toBe(400);
  });

  it('reports the first failing rule: RSVP before timing before the code', () => {
    expect(denial({ rsvpStatus: 'pending', status: 'ended', codeCheck: 'invalid' })?.code).toBe('NOT_GOING');
    expect(denial({ alreadyStamped: true, status: 'ended' })?.code).toBe('ALREADY_STAMPED');
    expect(denial({ status: 'upcoming', codeCheck: 'invalid' })?.code).toBe('CHECK_IN_NOT_OPEN');
  });
});
