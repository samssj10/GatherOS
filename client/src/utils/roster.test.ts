import { describe, expect, it } from 'vitest';
import { dietaryLabel, hasDietaryChoice, tripReadiness } from '@/utils/roster';

describe('dietaryLabel', () => {
  it('says "Not set" until a choice has been made, whatever the stored value is', () => {
    expect(dietaryLabel({ dietaryConfirmed: false, dietaryPreference: 'none' })).toBe('Not set');
    expect(dietaryLabel({ dietaryConfirmed: false, dietaryPreference: 'vegan' })).toBe('Not set');
  });

  it('says "No restrictions" when someone chose none, and names any other choice', () => {
    expect(dietaryLabel({ dietaryConfirmed: true, dietaryPreference: 'none' })).toBe('No restrictions');
    expect(dietaryLabel({ dietaryConfirmed: true, dietaryPreference: 'gluten-free' })).toBe('Gluten-free');
  });
});

describe('hasDietaryChoice', () => {
  it('is true only once a choice has been made', () => {
    expect(hasDietaryChoice({ dietaryConfirmed: false })).toBe(false);
    expect(hasDietaryChoice({ dietaryConfirmed: true })).toBe(true);
  });
});

describe('tripReadiness', () => {
  const someone = { rsvpStatus: 'pending', dietaryConfirmed: false, flightAssigned: false } as const;

  it('counts the accepted, dietary and flight steps, in that order', () => {
    expect(tripReadiness(someone)).toEqual({ steps: [false, false, false], score: 0, counted: true });
    expect(tripReadiness({ ...someone, rsvpStatus: 'accepted' }).steps).toEqual([true, false, false]);
    expect(tripReadiness({ ...someone, dietaryConfirmed: true }).steps).toEqual([false, true, false]);
    expect(tripReadiness({ ...someone, flightAssigned: true }).steps).toEqual([false, false, true]);
    expect(tripReadiness({ rsvpStatus: 'accepted', dietaryConfirmed: true, flightAssigned: true }).score).toBe(3);
  });

  it('does not count an answer on its own: a pending person with a meal and a flight is 2 of 3', () => {
    expect(tripReadiness({ rsvpStatus: 'pending', dietaryConfirmed: true, flightAssigned: true }).score).toBe(2);
  });

  it('is not ready without a meal choice even when accepted with a flight', () => {
    expect(tripReadiness({ rsvpStatus: 'accepted', dietaryConfirmed: false, flightAssigned: true }).score).toBe(2);
  });

  it('does not count someone who declined', () => {
    expect(tripReadiness({ ...someone, rsvpStatus: 'declined', flightAssigned: true }).counted).toBe(false);
  });
});
