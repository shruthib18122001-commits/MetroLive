import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { searchStops } from '../lib/apiClient';
import { MIN_QUERY_LENGTH } from '../lib/stops';
import { useDebouncedValue } from './useDebouncedValue';

export const SEARCH_DEBOUNCE_MS = 300;

/** Debounced (300ms) stop-name search against `/api/stops`. */
export function useStopSearch(rawQuery: string) {
  const debouncedQuery = useDebouncedValue(rawQuery.trim(), SEARCH_DEBOUNCE_MS);
  const isActive = debouncedQuery.length >= MIN_QUERY_LENGTH;

  const query = useQuery({
    queryKey: ['stops', 'search', debouncedQuery],
    queryFn: ({ signal }) => searchStops(debouncedQuery, signal),
    enabled: isActive,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });

  return { debouncedQuery, isActive, query };
}
