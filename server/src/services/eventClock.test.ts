import { afterEach, describe, expect, it, vi } from 'vitest';

// The service reads its settings when it is first imported, so each case sets them and imports a fresh copy.
async function loadClock(settings: Record<string, string>) {
  vi.resetModules();
  vi.stubEnv('PORT', '3999');
  vi.stubEnv('SESSION_SECRET', 'test-secret-that-is-at-least-32-characters-long');
  vi.stubEnv('LOG_LEVEL', 'silent');
  vi.stubEnv('EVENT_START_DATE', '2030-06-03');
  for (const [key, value] of Object.entries(settings)) vi.stubEnv(key, value);
  return import('./scheduleService.js');
}

afterEach(() => {
  vi.unstubAllEnvs();
});

const local = (hours: number, minutes: number, seconds = 0) => new Date(2030, 5, 3, hours, minutes, seconds);
// An arbitrary real moment, far from any special value.
const REAL = 1_900_000_000_000;

describe('the event clock', () => {
  it('is the real clock by default', async () => {
    const { eventNowAt } = await loadClock({});
    const real = new Date(2031, 0, 1, 15, 30);
    expect(eventNowAt(real)).toBe(real);
  });

  it('is pinned by EVENT_NOW, which beats the loop', async () => {
    const { eventNowAt } = await loadClock({ EVENT_NOW: '2030-06-03T11:00:00', DEMO_LIVE_LOOP: 'true' });
    expect(eventNowAt(new Date(2031, 0, 1, 15, 30)).getTime()).toBe(local(11, 0).getTime());
  });

  it('with DEMO_LIVE_LOOP keeps the Opening Keynote live at every time of day', async () => {
    const { eventNowAt, sessionCheckInStatus, listSchedule } = await loadClock({ DEMO_LIVE_LOOP: 'true' });
    const keynote = listSchedule().find((item) => item.day === 1 && item.startTime === '09:00');
    expect(keynote).toBeDefined();
    // One probe every 11 minutes and 7 seconds for two days, covering every hour and many jumps.
    for (let t = 0; t < 48 * 60 * 60_000; t += 11 * 60_000 + 7_000) {
      const now = eventNowAt(new Date(REAL + t));
      expect(sessionCheckInStatus(keynote!, now)).toBe('live');
    }
  });

  it('with DEMO_LIVE_LOOP leaves the other sessions upcoming', async () => {
    const { eventNowAt, sessionCheckInStatus, listSchedule } = await loadClock({ DEMO_LIVE_LOOP: 'true' });
    const others = listSchedule().filter((item) => !(item.day === 1 && item.startTime === '09:00'));
    const now = eventNowAt(new Date(REAL));
    expect(others.length).toBeGreaterThan(0);
    expect(others.every((item) => sessionCheckInStatus(item, now) === 'upcoming')).toBe(true);
  });

  it('with DEMO_LIVE_LOOP reads a real minute ago as the previous minute of the loop', async () => {
    const { eventNowAt } = await loadClock({ DEMO_LIVE_LOOP: 'true' });
    const real = new Date(REAL + 25 * 60_000 + 5_000);
    const now = eventNowAt(real).getTime();
    const ago = eventNowAt(new Date(real.getTime() - 60_000)).getTime();
    expect(now - ago).toBe(60_000);
  });

  it('with DEMO_LIVE_LOOP falls back to the real clock when Day 1 has no sessions', async () => {
    const { eventNowAt, replaceSchedule, listSchedule } = await loadClock({ DEMO_LIVE_LOOP: 'true' });
    replaceSchedule(listSchedule().filter((item) => item.day !== 1));
    const real = new Date(2031, 0, 1, 15, 30);
    expect(eventNowAt(real)).toBe(real);
  });

  it('with DEMO_LIVE_LOOP follows whichever session opens Day 1 after a new itinerary is saved', async () => {
    const { eventNowAt, replaceSchedule, listSchedule } = await loadClock({ DEMO_LIVE_LOOP: 'true' });
    const [template] = listSchedule();
    replaceSchedule([{ ...template, id: 'x', day: 1, startTime: '14:00', endTime: '15:30' }]);
    for (let t = 0; t < 6 * 60 * 60_000; t += 9 * 60_000 + 11_000) {
      const now = eventNowAt(new Date(REAL + t));
      expect(now.getTime()).toBeGreaterThanOrEqual(local(14, 0).getTime());
      expect(now.getTime()).toBeLessThan(local(15, 30).getTime());
    }
  });

  it('lists every saved session as upcoming, live or ended on the event clock', async () => {
    const { listSessionStatuses, listSchedule } = await loadClock({});
    const sessions = listSchedule();
    const keynote = sessions.find((item) => item.day === 1 && item.startTime === '09:00')!;
    const lunch = sessions.find((item) => item.day === 1 && item.startTime === '12:15')!;

    const morning = listSessionStatuses(local(9, 30));
    expect(Object.keys(morning).sort()).toEqual(sessions.map((item) => item.id).sort());
    expect(morning[keynote.id]).toBe('live');
    expect(morning[lunch.id]).toBe('upcoming');

    const afternoon = listSessionStatuses(local(14, 0));
    expect(afternoon[keynote.id]).toBe('ended');
    expect(afternoon[lunch.id]).toBe('ended');
  });
});
