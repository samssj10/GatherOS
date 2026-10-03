import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/api/client';
import { attendeeKeys } from '@/api/keys';
import { useUiStore } from '@/store/uiStore';
import type {
  Attendee,
  AttendeeSummary,
  AttendeeUpdate,
  DepartmentStat,
  NudgeResult,
  Paginated,
} from '@/types';
import { XP } from '@/utils/gamification';

/** The whole roster in one request; filtering and windowing happen on the client. */
export function useAttendeeList() {
  return useQuery({
    queryKey: attendeeKeys.list,
    queryFn: ({ signal }) => apiFetch<Paginated<Attendee>>('/attendees?limit=2500', { signal }),
    staleTime: 60_000,
  });
}

export function useAttendee(id: string | undefined) {
  return useQuery({
    queryKey: attendeeKeys.detail(id ?? ''),
    queryFn: ({ signal }) => apiFetch<Attendee>(`/attendees/${id}`, { signal }),
    enabled: id !== undefined,
  });
}

export function useAttendeeSummary() {
  return useQuery({
    queryKey: attendeeKeys.summary,
    queryFn: ({ signal }) => apiFetch<AttendeeSummary>('/attendees/summary', { signal }),
  });
}

/** Department-level acceptance rates for the passport "team race". */
export function useDepartmentStats() {
  return useQuery({
    queryKey: attendeeKeys.departments,
    queryFn: ({ signal }) => apiFetch<DepartmentStat[]>('/attendees/departments', { signal }),
  });
}

function invalidateAttendeeData(queryClient: ReturnType<typeof useQueryClient>, id: string) {
  void queryClient.invalidateQueries({ queryKey: attendeeKeys.detail(id) });
  void queryClient.invalidateQueries({ queryKey: attendeeKeys.summary });
  void queryClient.invalidateQueries({ queryKey: attendeeKeys.list });
  void queryClient.invalidateQueries({ queryKey: attendeeKeys.departments });
}

/**
 * Optimistic update: the cached attendee changes instantly on mutate, rolls back if the
 * request fails, and the success toast is shown only once the server has confirmed.
 */
export function useUpdateAttendee(id: string) {
  const queryClient = useQueryClient();
  const queryKey = attendeeKeys.detail(id);

  return useMutation({
    mutationFn: (update: AttendeeUpdate) =>
      apiFetch<Attendee>(`/attendees/${id}`, { method: 'PATCH', body: update }),

    onMutate: async (update) => {
      // Stop in-flight refetches from overwriting the optimistic value.
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Attendee>(queryKey);
      if (previous) {
        queryClient.setQueryData<Attendee>(queryKey, {
          ...previous,
          ...update,
          // Choosing a dietary option, even "none", counts as answering.
          dietaryConfirmed: update.dietaryPreference !== undefined ? true : previous.dietaryConfirmed,
        });
      }
      return { previous };
    },

    onError: (_error, _update, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
      useUiStore.getState().addToast('error', 'Could not save your change. Please try again.');
    },

    onSuccess: (_saved, update, context) => {
      const { addToast } = useUiStore.getState();
      if (update.rsvpStatus === 'accepted') {
        const firstTime = context.previous?.rsvpStatus !== 'accepted';
        addToast('success', `RSVP accepted. See you there!${firstTime ? ` +${XP.rsvp} XP` : ''}`);
      } else if (update.rsvpStatus === 'declined') {
        addToast('success', 'RSVP declined. Sorry you can’t make it.');
      } else if (update.rsvpStatus === 'pending') {
        addToast('success', 'RSVP reset to pending.');
      } else {
        const firstTime = context.previous?.dietaryConfirmed === false;
        addToast('success', `Dietary preference saved.${firstTime ? ` +${XP.dietary} XP` : ''}`);
      }
    },

    onSettled: () => invalidateAttendeeData(queryClient, id),
  });
}

export interface CheckInInput {
  sessionId: string;
  /** The code shown in the room, typed or scanned. */
  code: string;
}

/**
 * Check in to a live session with the room code. Unlike RSVP and dietary this is not optimistic:
 * the server decides (code, clock, RSVP), so the stamp appears once it has said yes. A refusal
 * arrives as an ApiError whose message is ready to show and whose code says why.
 */
export function useCheckInWithCode(attendeeId: string) {
  const queryClient = useQueryClient();
  const queryKey = attendeeKeys.detail(attendeeId);

  return useMutation({
    mutationFn: ({ sessionId, code }: CheckInInput) =>
      apiFetch<Attendee>(`/attendees/${attendeeId}/stamps`, { method: 'POST', body: { sessionId, code } }),

    onSuccess: (attendee) => {
      queryClient.setQueryData<Attendee>(queryKey, attendee);
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });
}

/**
 * Superseded by useCheckInWithCode: the server now requires a room code, so this no longer works.
 * Removed when the Journey switches over.
 */
export function useCheckIn(attendeeId: string) {
  const queryClient = useQueryClient();
  const queryKey = attendeeKeys.detail(attendeeId);

  return useMutation({
    mutationFn: (sessionId: string) =>
      apiFetch<Attendee>(`/attendees/${attendeeId}/stamps`, { method: 'POST', body: { sessionId } }),

    onMutate: async (sessionId) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Attendee>(queryKey);
      if (previous && !previous.stamps.includes(sessionId)) {
        queryClient.setQueryData<Attendee>(queryKey, {
          ...previous,
          stamps: [...previous.stamps, sessionId],
        });
      }
      return { previous };
    },

    onError: (_error, _sessionId, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
      useUiStore.getState().addToast('error', 'Could not check in. Please try again.');
    },

    onSuccess: () => {
      useUiStore.getState().addToast('success', `Stamp collected. +${XP.stamp} XP`);
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });
}

/**
 * Planner reminder. This is a mock: the server records who was nudged but sends nothing.
 * With no ids it targets every pending attendee.
 */
export function useNudge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids?: string[]) =>
      apiFetch<NudgeResult>('/attendees/nudge', { method: 'POST', body: ids ? { ids } : {} }),

    onSuccess: ({ nudged }) => {
      useUiStore
        .getState()
        .addToast('success', nudged === 1 ? 'Nudged 1 attendee.' : `Nudged ${nudged.toLocaleString()} attendees.`);
      void queryClient.invalidateQueries({ queryKey: attendeeKeys.list });
    },

    onError: () => {
      useUiStore.getState().addToast('error', 'Could not send the nudge. Please try again.');
    },
  });
}
