import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/api/client';
import { scheduleKeys } from '@/api/keys';
import type { AttendeeScheduleDTO, BudgetSummary, ScheduleItem } from '@/types';

export function usePlannerSchedule() {
  return useQuery({
    queryKey: scheduleKeys.planner,
    queryFn: ({ signal }) => apiFetch<ScheduleItem[]>('/schedule', { signal }),
  });
}

export function useBudgetSummary() {
  return useQuery({
    queryKey: scheduleKeys.budget,
    queryFn: ({ signal }) => apiFetch<BudgetSummary>('/schedule/budget', { signal }),
  });
}

export function useMySchedule() {
  return useQuery({
    queryKey: scheduleKeys.mine,
    queryFn: ({ signal }) => apiFetch<AttendeeScheduleDTO[]>('/schedule/me', { signal }),
  });
}
