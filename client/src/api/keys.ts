export const sessionKey = ['session'] as const;

export const attendeeKeys = {
  list: ['attendees', 'list'] as const,
  detail: (id: string) => ['attendees', 'detail', id] as const,
  summary: ['attendees', 'summary'] as const,
  departments: ['attendees', 'departments'] as const,
};

export const scheduleKeys = {
  planner: ['schedule', 'planner'] as const,
  mine: ['schedule', 'mine'] as const,
  budget: ['schedule', 'budget'] as const,
  // Cache-only: holds an unsaved AI draft (null = none). Never fetched from the server.
  draft: ['schedule', 'draft'] as const,
};
