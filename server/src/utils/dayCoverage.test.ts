import { describe, expect, it } from 'vitest';
import { dayCoverageProblems } from './dayCoverage';

const onDays = (...days: number[]) => days.map((day) => ({ day }));

describe('dayCoverageProblems', () => {
  it('reports nothing when every requested day has sessions', () => {
    expect(dayCoverageProblems(onDays(1, 1, 2, 3, 4, 5), 5)).toEqual({ missing: [], extra: [] });
  });

  it('lists requested days that have no sessions', () => {
    expect(dayCoverageProblems(onDays(1, 2, 4), 5)).toEqual({ missing: [3, 5], extra: [] });
  });

  it('lists days past the requested length', () => {
    expect(dayCoverageProblems(onDays(1, 2, 3, 5), 2)).toEqual({ missing: [], extra: [3, 5] });
  });
});
