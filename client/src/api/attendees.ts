import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/api/client';
import { attendeeKeys } from '@/api/keys';
import { useUiStore } from '@/store/uiStore';
import type { Attendee, AttendeeSummary, AttendeeUpdate, Paginated } from '@/types';

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

function successMessage(update: AttendeeUpdate): string {
  if (update.rsvpStatus === 'accepted') return 'RSVP accepted. See you there!';
  if (update.rsvpStatus === 'declined') return 'RSVP declined. Sorry you can’t make it.';
  if (update.rsvpStatus === 'pending') return 'RSVP reset to pending.';
  return 'Dietary preference saved.';
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
      if (previous) queryClient.setQueryData<Attendee>(queryKey, { ...previous, ...update });
      return { previous };
    },

    onError: (_error, _update, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
      useUiStore.getState().addToast('error', 'Could not save your change. Please try again.');
    },

    onSuccess: (_saved, update) => {
      useUiStore.getState().addToast('success', successMessage(update));
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey });
      void queryClient.invalidateQueries({ queryKey: attendeeKeys.summary });
      void queryClient.invalidateQueries({ queryKey: attendeeKeys.list });
    },
  });
}
