import { QueryClient } from '@tanstack/react-query';

/** One client per app instance (and a fresh one per test). */
export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        staleTime: 20_000,
        refetchOnWindowFocus: true,
        gcTime: 5 * 60_000,
      },
    },
  });
}
