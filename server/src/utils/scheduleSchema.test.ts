import { describe, expect, it } from 'vitest';
import {
  MAX_EVENT_DAYS,
  generateScheduleBodySchema,
  scheduleItemSchema,
} from './scheduleSchema';

const body = (days: number) => ({ prompt: 'Team retreat in Lisbon', days, attendeeCount: 100 });

const item = (day: number) => ({
  id: 'x',
  day,
  startTime: '09:00',
  endTime: '10:00',
  title: 'Keynote',
  description: '',
  location: 'Hall',
  category: 'keynote' as const,
  costEstimate: 0,
});

describe('generateScheduleBodySchema', () => {
  it('accepts every length from 1 day up to the maximum', () => {
    for (let days = 1; days <= MAX_EVENT_DAYS; days += 1) {
      expect(generateScheduleBodySchema.safeParse(body(days)).success).toBe(true);
    }
  });

  it('accepts a retreat longer than three days', () => {
    expect(generateScheduleBodySchema.safeParse(body(5)).success).toBe(true);
  });

  it('rejects zero days, more than the maximum and fractions', () => {
    expect(generateScheduleBodySchema.safeParse(body(0)).success).toBe(false);
    expect(generateScheduleBodySchema.safeParse(body(MAX_EVENT_DAYS + 1)).success).toBe(false);
    expect(generateScheduleBodySchema.safeParse(body(2.5)).success).toBe(false);
  });

  it('rejects unknown fields', () => {
    expect(generateScheduleBodySchema.safeParse({ ...body(3), extra: true }).success).toBe(false);
  });
});

describe('scheduleItemSchema', () => {
  it('allows sessions on any day up to the maximum', () => {
    expect(scheduleItemSchema.safeParse(item(MAX_EVENT_DAYS)).success).toBe(true);
    expect(scheduleItemSchema.safeParse(item(MAX_EVENT_DAYS + 1)).success).toBe(false);
    expect(scheduleItemSchema.safeParse(item(0)).success).toBe(false);
  });
});
