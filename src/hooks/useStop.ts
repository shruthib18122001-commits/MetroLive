import { useQuery } from '@tanstack/react-query';

import { fetchStopById } from '../lib/apiClient';

/** Resolves a `stop_id` to its name for the stop-page header. Effectively immutable. */
export function useStop(stopId: string) {
  return useQuery({
    queryKey: ['stops', 'byId', stopId],
    queryFn: ({ signal }) => fetchStopById(stopId, signal),
    enabled: stopId.trim().length > 0,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  });
}
