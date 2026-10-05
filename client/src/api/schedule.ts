import { skipToken, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError, apiFetch } from '@/api/client';
import { scheduleKeys } from '@/api/keys';
import { useUiStore } from '@/store/uiStore';
import { reflowDay } from '@/utils/reflow';
import { applyTiming } from '@/utils/restoreTiming';
import type { TimingEntry } from '@/utils/restoreTiming';
import type {
  AttendeeScheduleDTO,
  BudgetSummary,
  CheckInCodeInfo,
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
    // Check-in opens and closes by the clock, so keep each session's status fresh.
    refetchInterval: 30_000,
  });
}

/** The code on the room screen. Polled so the code, countdown and check-in count stay live. */
export function useCheckInCode(sessionId: string | undefined) {
  return useQuery({
    queryKey: scheduleKeys.checkInCode(sessionId ?? ''),
    queryFn: ({ signal }) => apiFetch<CheckInCodeInfo>(`/schedule/${sessionId}/checkin-code`, { signal }),
    enabled: sessionId !== undefined,
    refetchInterval: 5_000,
    // The code changes every minute: never show a cached one.
    staleTime: 0,
    gcTime: 0,
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

interface ReorderInput {
  day: number;
  /** Every session that should be on `day`, in the new order (may include one moved in from another day). */
  orderedIds: string[];
  /** The caller shows its own confirmation (e.g. a toast with Undo), so skip the generic one. */
  quiet?: boolean;
}

/**
 * Reorders a day, or moves a session onto it. The day is re-timed: sessions run back to back,
 * 15 minutes apart, durations kept. Optimistic: the board updates immediately using the same
 * rule as the server, snaps back if the save fails, and adopts the server's answer on success.
 * While an AI draft exists the change only touches the local draft.
 */
export function useReorderDay() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ day, orderedIds }: ReorderInput) => {
      if (queryClient.getQueryData(scheduleKeys.draft)) return null;
      return apiFetch<ScheduleItem[]>(`/schedule/days/${day}/order`, {
        method: 'PUT',
        body: { itemIds: orderedIds },
      });
    },

    onMutate: async ({ day, orderedIds }) => {
      const key = queryClient.getQueryData(scheduleKeys.draft)
        ? scheduleKeys.draft
        : scheduleKeys.planner;
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<ScheduleItem[] | null>(key);
      const moved = (previous ?? []).some((item) => orderedIds.includes(item.id) && item.day !== day);
      const next = previous ? reflowDay(previous, day, orderedIds) : null;
      if (next) queryClient.setQueryData<ScheduleItem[]>(key, next);
      return { key, previous, moved };
    },

    onError: (_error, _input, context) => {
      if (context?.previous) queryClient.setQueryData(context.key, context.previous);
      useUiStore.getState().addToast('error', 'Could not save that change. Please try again.');
    },

    onSuccess: (saved, { day, quiet }, context) => {
      // The server computed the times itself, so its answer is the source of truth.
      if (saved) queryClient.setQueryData(scheduleKeys.planner, saved);
      if (quiet) return;
      useUiStore
        .getState()
        .addToast('success', context.moved ? `Moved to Day ${day}.` : `Day ${day} reordered.`);
    },

    onSettled: (_data, _error, _input, context) => {
      if (context?.key === scheduleKeys.planner) {
        void queryClient.invalidateQueries({ queryKey: scheduleKeys.planner });
        void queryClient.invalidateQueries({ queryKey: scheduleKeys.mine });
      }
    },
  });
}

/**
 * Undoes a move exactly by putting the given sessions back on the days and times they had. Moving a
 * session back by reordering would not do: re-timing the days it passed through shifted the others too.
 * Optimistic like the move itself; on an AI draft it only touches the local draft.
 */
export function useRestoreTiming() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entries: TimingEntry[]) => {
      if (queryClient.getQueryData(scheduleKeys.draft)) return null;
      return apiFetch<ScheduleItem[]>('/schedule/timing', { method: 'PUT', body: { items: entries } });
    },

    onMutate: async (entries) => {
      const key = queryClient.getQueryData(scheduleKeys.draft) ? scheduleKeys.draft : scheduleKeys.planner;
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<ScheduleItem[] | null>(key);
      if (previous) queryClient.setQueryData<ScheduleItem[]>(key, applyTiming(previous, entries));
      return { key, previous };
    },

    onError: (_error, _entries, context) => {
      if (context?.previous) queryClient.setQueryData(context.key, context.previous);
      useUiStore.getState().addToast('error', 'Could not undo that move. Please try again.');
    },

    onSuccess: (saved) => {
      if (saved) queryClient.setQueryData(scheduleKeys.planner, saved);
      useUiStore.getState().addToast('success', 'Move undone.');
    },

    onSettled: (_data, _error, _entries, context) => {
      if (context?.key === scheduleKeys.planner) {
        void queryClient.invalidateQueries({ queryKey: scheduleKeys.planner });
        void queryClient.invalidateQueries({ queryKey: scheduleKeys.mine });
      }
    },
  });
}
