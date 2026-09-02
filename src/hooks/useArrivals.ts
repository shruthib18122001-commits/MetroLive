import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { fetchArrivals } from '../lib/apiClient';

/** Polls `/api/arrivals` every 30s; keeps the previous board visible while refetching. */
export function useArrivals(stopId: string) {
  return useQuery({
    queryKey: ['arrivals', stopId],
    queryFn: ({ signal }) => fetchArrivals(stopId, signal),
    enabled: stopId.trim().length > 0,
    refetchInterval: 30_000,
    staleTime: 20_000,
    refetchOnWindowFocus: true,
    placeholderData: keepPreviousData,
  });
}
