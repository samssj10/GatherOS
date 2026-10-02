import { skipToken, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError, apiFetch } from '@/api/client';
import { scheduleKeys } from '@/api/keys';
import { useUiStore } from '@/store/uiStore';
import type {
  AttendeeScheduleDTO,
  BudgetSummary,
  GenerateScheduleInput,
  ScheduleItem,
} from '@/types';

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

/**
 * The unsaved AI draft. `skipToken` makes this a cache-only query: nothing ever refetches it,
 * so a window refocus cannot overwrite the planner's draft with the saved itinerary.
 */
export function useScheduleDraft() {
  return useQuery<ScheduleItem[] | null>({
    queryKey: scheduleKeys.draft,
    queryFn: skipToken,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

export function useDiscardDraft() {
  const queryClient = useQueryClient();
  return () => queryClient.setQueryData<ScheduleItem[] | null>(scheduleKeys.draft, null);
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

export function useGenerateSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: GenerateScheduleInput) =>
      apiFetch<{ items: ScheduleItem[] }>('/ai/generate-schedule', { method: 'POST', body: input }),
    onSuccess: ({ items }) => {
      queryClient.setQueryData<ScheduleItem[] | null>(scheduleKeys.draft, items);
      useUiStore.getState().addToast('success', `Draft itinerary ready with ${items.length} sessions.`);
    },
    onError: (error) => {
      useUiStore
        .getState()
        .addToast('error', errorMessage(error, 'Could not generate an itinerary. Please try again.'));
    },
  });
}

export function useSaveSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (items: ScheduleItem[]) =>
      apiFetch<ScheduleItem[]>('/schedule', { method: 'PUT', body: { items } }),
    onSuccess: (saved) => {
      queryClient.setQueryData(scheduleKeys.planner, saved);
      queryClient.setQueryData<ScheduleItem[] | null>(scheduleKeys.draft, null);
      void queryClient.invalidateQueries({ queryKey: scheduleKeys.budget });
      void queryClient.invalidateQueries({ queryKey: scheduleKeys.mine });
      useUiStore.getState().addToast('success', 'Itinerary saved. Attendees can now see it.');
    },
    onError: (error) => {
      useUiStore.getState().addToast('error', errorMessage(error, 'Could not save the itinerary.'));
    },
  });
}

interface MoveInput {
  id: string;
  day: number;
}

/**
 * Moves a session to another day. Optimistic: the card jumps columns immediately and snaps
 * back if the save fails. While an AI draft exists the move only touches the local draft.
 */
export function useMoveScheduleItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, day }: MoveInput) => {
      if (queryClient.getQueryData(scheduleKeys.draft)) return;
      await apiFetch<ScheduleItem>(`/schedule/${id}`, { method: 'PATCH', body: { day } });
    },

    onMutate: async ({ id, day }) => {
      const key = queryClient.getQueryData(scheduleKeys.draft)
        ? scheduleKeys.draft
        : scheduleKeys.planner;
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<ScheduleItem[] | null>(key);
      if (previous) {
        queryClient.setQueryData<ScheduleItem[]>(
          key,
          previous.map((item) => (item.id === id ? { ...item, day } : item)),
        );
      }
      return { key, previous };
    },

    onError: (_error, _input, context) => {
      if (context?.previous) queryClient.setQueryData(context.key, context.previous);
      useUiStore.getState().addToast('error', 'Could not move that session. Please try again.');
    },

    onSuccess: (_data, { day }) => {
      useUiStore.getState().addToast('success', `Moved to Day ${day}.`);
    },

    onSettled: (_data, _error, _input, context) => {
      if (context?.key === scheduleKeys.planner) {
        void queryClient.invalidateQueries({ queryKey: scheduleKeys.planner });
        void queryClient.invalidateQueries({ queryKey: scheduleKeys.mine });
      }
    },
  });
}
