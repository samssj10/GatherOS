import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError, apiFetch } from '@/api/client';
import { sessionKey } from '@/api/keys';
import type { UserSession } from '@/types';

/** Resolves to the current session, or null when signed out (a 401 is not an error here). */
export function useSessionQuery() {
  return useQuery({
    queryKey: sessionKey,
    queryFn: async ({ signal }): Promise<UserSession | null> => {
      try {
        return await apiFetch<UserSession>('/auth/me', { signal });
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) return null;
        throw error;
      }
    },
    staleTime: Infinity,
    retry: false,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (email: string) =>
      apiFetch<UserSession>('/auth/login', { method: 'POST', body: { email } }),
    onSuccess: (session) => {
      queryClient.setQueryData(sessionKey, session);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiFetch<void>('/auth/logout', { method: 'POST' }),
    onSettled: () => {
      // Drop every cached payload so the next user never sees the previous user's data.
      queryClient.clear();
      queryClient.setQueryData(sessionKey, null);
    },
  });
}
