import { describe, expect, it } from 'vitest';
import {
  CODE_ALPHABET,
  CODE_LENGTH,
  CODE_PERIOD_MS,
  codeForPeriod,
  codePeriod,
  currentRoomCode,
  verifyRoomCode,
} from './checkInCode';

const secret = 'test-secret-that-is-at-least-32-characters-long';
// 1_900_000_020_000 is an exact minute boundary, so `at(m, s)` sits s seconds into minute m.
const at = (minutes: number, seconds = 0) => new Date(1_900_000_020_000 + minutes * 60_000 + seconds * 1000);

describe('codeForPeriod', () => {
  it('is 6 characters from the unambiguous alphabet', () => {
    const code = codeForPeriod(secret, 'sch-001', 123);
    expect(code).toHaveLength(CODE_LENGTH);
    for (const char of code) expect(CODE_ALPHABET).toContain(char);
    expect(CODE_ALPHABET).not.toMatch(/[01OI]/);
  });

  it('is stable for the same secret, session and minute', () => {
    expect(codeForPeriod(secret, 'sch-001', 123)).toBe(codeForPeriod(secret, 'sch-001', 123));
  });

  it('differs between sessions, minutes and secrets', () => {
    const base = codeForPeriod(secret, 'sch-001', 123);
    expect(codeForPeriod(secret, 'sch-002', 123)).not.toBe(base);
    expect(codeForPeriod(secret, 'sch-001', 124)).not.toBe(base);
    expect(codeForPeriod(`${secret}x`, 'sch-001', 123)).not.toBe(base);
  });
});

describe('currentRoomCode', () => {
  it('expires at the end of the current minute', () => {
    const { expiresAt } = currentRoomCode(secret, 'sch-001', at(5, 17));
    expect(expiresAt.getTime()).toBe((codePeriod(at(5, 17)) + 1) * CODE_PERIOD_MS);
    expect(expiresAt.getTime() - at(5, 17).getTime()).toBeLessThanOrEqual(CODE_PERIOD_MS);
  });

  it('keeps the same code within a minute and changes it on the next', () => {
    const first = currentRoomCode(secret, 'sch-001', at(5, 1)).code;
    expect(currentRoomCode(secret, 'sch-001', at(5, 58)).code).toBe(first);
    expect(currentRoomCode(secret, 'sch-001', at(6, 1)).code).not.toBe(first);
  });
});

describe('verifyRoomCode', () => {
  const now = at(10, 30);
  const current = currentRoomCode(secret, 'sch-001', now).code;
  const previous = codeForPeriod(secret, 'sch-001', codePeriod(now) - 1);
  const older = codeForPeriod(secret, 'sch-001', codePeriod(now) - 2);

  it('accepts the current code, ignoring case and spaces', () => {
    expect(verifyRoomCode(secret, 'sch-001', current, now)).toBe('valid');
    expect(verifyRoomCode(secret, 'sch-001', ` ${current.toLowerCase()} `, now)).toBe('valid');
  });

  it('accepts the previous minute so a scan across the change still works', () => {
    expect(verifyRoomCode(secret, 'sch-001', previous, now)).toBe('valid');
  });

  it('reports older codes as expired, not wrong', () => {
    expect(verifyRoomCode(secret, 'sch-001', older, now)).toBe('expired');
  });

  it('rejects a code from another session', () => {
    const other = currentRoomCode(secret, 'sch-002', now).code;
    expect(verifyRoomCode(secret, 'sch-001', other, now)).toBe('invalid');
  });

  it('rejects guesses and empty input', () => {
    expect(verifyRoomCode(secret, 'sch-001', 'AAAAAA', now)).toBe('invalid');
    expect(verifyRoomCode(secret, 'sch-001', '', now)).toBe('invalid');
    expect(verifyRoomCode(secret, 'sch-001', current.slice(0, 5), now)).toBe('invalid');
  });

  it('does not accept a code from the future', () => {
    const future = codeForPeriod(secret, 'sch-001', codePeriod(now) + 1);
    expect(verifyRoomCode(secret, 'sch-001', future, now)).toBe('invalid');
  });
});
