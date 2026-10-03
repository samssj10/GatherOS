import { describe, expect, it } from 'vitest';
import { checkInStatus, parseEventDate, sessionWindow, todayAsEventDate } from './eventClock';

// Local-time constructors on purpose: the clock works in the server's local time zone.
const eventStart = parseEventDate('2030-06-03');
const keynote = { day: 1, startTime: '09:00', endTime: '10:00' };
const dayTwo = { day: 2, startTime: '09:30', endTime: '11:30' };

describe('parseEventDate', () => {
  it('reads a YYYY-MM-DD date as local midnight', () => {
    expect(eventStart.getFullYear()).toBe(2030);
    expect(eventStart.getMonth()).toBe(5);
    expect(eventStart.getDate()).toBe(3);
    expect(eventStart.getHours()).toBe(0);
  });
});

describe('todayAsEventDate', () => {
  it('formats a date as zero-padded YYYY-MM-DD', () => {
    expect(todayAsEventDate(new Date(2030, 0, 5, 14, 30))).toBe('2030-01-05');
    expect(todayAsEventDate(new Date(2030, 11, 25))).toBe('2030-12-25');
  });
});

describe('sessionWindow', () => {
  it('puts day 1 on the event start date', () => {
    const { start, end } = sessionWindow(keynote, eventStart);
    expect(start).toEqual(new Date(2030, 5, 3, 9, 0));
    expect(end).toEqual(new Date(2030, 5, 3, 10, 0));
  });

  it('moves later days forward by whole days', () => {
    const { start } = sessionWindow(dayTwo, eventStart);
    expect(start).toEqual(new Date(2030, 5, 4, 9, 30));
  });

  it('rolls over month ends', () => {
    const lateStart = parseEventDate('2030-06-30');
    expect(sessionWindow(dayTwo, lateStart).start).toEqual(new Date(2030, 6, 1, 9, 30));
  });
});

describe('checkInStatus', () => {
  it('is upcoming before the session starts', () => {
    expect(checkInStatus(keynote, new Date(2030, 5, 3, 8, 59), eventStart)).toBe('upcoming');
  });

  it('is live from the start time, inclusive', () => {
    expect(checkInStatus(keynote, new Date(2030, 5, 3, 9, 0), eventStart)).toBe('live');
    expect(checkInStatus(keynote, new Date(2030, 5, 3, 9, 59), eventStart)).toBe('live');
  });

  it('has ended at the end time, exclusive', () => {
    expect(checkInStatus(keynote, new Date(2030, 5, 3, 10, 0), eventStart)).toBe('ended');
  });

  it('keeps later days upcoming while an earlier day is running', () => {
    expect(checkInStatus(dayTwo, new Date(2030, 5, 3, 9, 30), eventStart)).toBe('upcoming');
    expect(checkInStatus(dayTwo, new Date(2030, 5, 4, 10, 0), eventStart)).toBe('live');
  });

  it('treats everything as ended once the event is over', () => {
    expect(checkInStatus(dayTwo, new Date(2030, 5, 5, 8, 0), eventStart)).toBe('ended');
  });
});
