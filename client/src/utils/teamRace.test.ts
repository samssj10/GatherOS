import { describe, expect, it } from 'vitest';
import { teamRaceRows } from '@/utils/teamRace';

const teams = (count: number) =>
  Array.from({ length: count }, (_, index) => ({ department: `Team ${index + 1}`, pct: 90 - index }));

describe('teamRaceRows', () => {
  it('shows the top teams only when the attendee is among them', () => {
    const { rows, hidden } = teamRaceRows(teams(8), 'Team 3', 5);
    expect(rows.map((row) => row.position)).toEqual([1, 2, 3, 4, 5]);
    expect(hidden).toBe(0);
  });

  it('adds the attendee team after the top, and counts the teams left out between', () => {
    const { rows, hidden } = teamRaceRows(teams(8), 'Team 7', 5);
    expect(rows.map((row) => row.position)).toEqual([1, 2, 3, 4, 5, 7]);
    expect(hidden).toBe(1);
  });

  it('says nothing is hidden when the attendee team is the very next one', () => {
    const { rows, hidden } = teamRaceRows(teams(8), 'Team 6', 5);
    expect(rows.map((row) => row.position)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(hidden).toBe(0);
  });

  it('counts several hidden teams', () => {
    expect(teamRaceRows(teams(10), 'Team 10', 5).hidden).toBe(4);
  });

  it('shows just the top when the attendee team is not in the list', () => {
    const { rows, hidden } = teamRaceRows(teams(8), 'Nowhere', 5);
    expect(rows).toHaveLength(5);
    expect(hidden).toBe(0);
  });
});
