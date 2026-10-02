import { QueryCache, QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/api/client';
import { sessionKey } from '@/api/keys';

export const queryClient: QueryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      // An expired or revoked cookie anywhere means the user is signed out.
      if (error instanceof ApiError && error.status === 401) {
        queryClient.setQueryData(sessionKey, null);
      }
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) =>
        !(error instanceof ApiError && error.status < 500) && failureCount < 2,
    },
  },
});
