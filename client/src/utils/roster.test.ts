import { describe, expect, it } from 'vitest';
import { dietaryLabel, tripReadiness } from '@/utils/roster';

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

describe('tripReadiness', () => {
  it('counts the answered, accepted and flight steps', () => {
    expect(tripReadiness({ rsvpStatus: 'pending', flightAssigned: false })).toEqual({
      steps: [false, false, false],
      score: 0,
      counted: true,
    });
    expect(tripReadiness({ rsvpStatus: 'accepted', flightAssigned: true }).score).toBe(3);
  });

  it('does not count someone who declined', () => {
    expect(tripReadiness({ rsvpStatus: 'declined', flightAssigned: true }).counted).toBe(false);
  });
});
