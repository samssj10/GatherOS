/** One department in the team race, with its place in the full ranking. */
export interface RankedTeam {
  department: string;
  pct: number;
  position: number;
}

export interface TeamRaceRows {
  rows: RankedTeam[];
  /** How many teams sit between the last row shown at the top and the attendee's own team. */
  hidden: number;
}

/**
 * The top few teams, then the attendee's own team if it is further down. `hidden` counts the teams left out
 * between the two, so the board can say so instead of jumping from 5 to 7.
 */
export function teamRaceRows(
  ranked: Array<{ department: string; pct: number }>,
  ownDepartment: string,
  visible: number,
): TeamRaceRows {
  const all: RankedTeam[] = ranked.map((team, index) => ({ ...team, position: index + 1 }));
  const top = all.slice(0, visible);
  const own = all.find((team) => team.department === ownDepartment);
  if (!own || top.some((team) => team.department === ownDepartment)) return { rows: top, hidden: 0 };
  return { rows: [...top, own], hidden: Math.max(0, own.position - top.length - 1) };
}
