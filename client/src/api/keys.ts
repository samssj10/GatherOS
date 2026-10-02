export const sessionKey = ['session'] as const;

export const attendeeKeys = {
  detail: (id: string) => ['attendees', 'detail', id] as const,
  summary: ['attendees', 'summary'] as const,
};

export const scheduleKeys = {
  planner: ['schedule', 'planner'] as const,
  mine: ['schedule', 'mine'] as const,
  budget: ['schedule', 'budget'] as const,
};
