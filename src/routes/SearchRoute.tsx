import { useId, useState } from 'react';

import { Button } from '../components/Button';
import { FavoritesList } from '../components/FavoritesList';
import { PopularStops } from '../components/PopularStops';
import { Spinner } from '../components/Spinner';
import { StateMessage } from '../components/StateMessage';
import { StopResultList } from '../components/StopResultList';
import { StopSearchInput } from '../components/StopSearchInput';
import { useStopSearch } from '../hooks/useStopSearch';
import { ApiError } from '../lib/apiClient';
import { useFavoritesStore } from '../store/favorites';

export function SearchRoute() {
  const [rawQuery, setRawQuery] = useState('');
  const { debouncedQuery, isActive, query } = useStopSearch(rawQuery);
  const resultsHeadingId = useId();
  const hasFavorites = useFavoritesStore((state) => state.favorites.length > 0);

  const trimmed = rawQuery.trim();
  const showFavorites = trimmed.length === 0;
  const results = query.data ?? [];

  return (
    <div className="animate-fade-in">
      <div className="-mx-4 -mt-5 rounded-b-3xl bg-gradient-to-b from-brand-800 to-brand-900 px-4 pb-11 pt-5 text-white shadow-hero">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-2.5 py-1 text-[0.6875rem] font-bold uppercase tracking-wider text-white ring-1 ring-white/20">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse-soft" aria-hidden="true" />
          Live LA Metro
        </span>
        <h1 className="mt-2.5 text-[1.5rem] font-bold leading-tight tracking-[-0.02em] text-white">
          Find your stop
        </h1>
        <p className="mt-1 text-[0.9375rem] leading-relaxed text-brand-200">
          Real-time arrivals for any bus stop or rail station.
        </p>
        <div className="mt-4">
          <StopSearchInput
            tone="onBrand"
            value={rawQuery}
            onChange={setRawQuery}
            busy={isActive && query.isFetching}
          />
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-5">
        {showFavorites ? (
          <>
            <FavoritesList />
            {hasFavorites ? null : <PopularStops />}
          </>
        ) : (
          <section aria-labelledby={resultsHeadingId} aria-live="polite" className="flex flex-col gap-3">
            <h2 id={resultsHeadingId} className="sr-only">
              Search results
            </h2>

            {!isActive ? (
              <StateMessage title="Keep typing…" description="Enter at least two letters to search." />
            ) : query.isPending ? (
              <StateMessage icon={<Spinner label="Searching stops" />} title="Searching stops…" />
            ) : query.isError ? (
              <StateMessage
                tone="error"
                title="Search failed"
                description={
                  query.error instanceof ApiError
                    ? query.error.message
                    : 'Could not reach the stop search service.'
                }
                action={
                  <Button variant="secondary" onClick={() => void query.refetch()}>
                    Try again
                  </Button>
                }
              />
            ) : results.length === 0 ? (
              <StateMessage
                title="No stops found"
                description={`Nothing matched “${debouncedQuery}”. Try part of a street name or station.`}
              />
            ) : (
              <>
                <p className="px-1 text-xs font-semibold uppercase tracking-wide text-brand-700">
                  {results.length} {results.length === 1 ? 'match' : 'matches'} for “{debouncedQuery}”
                </p>
                <StopResultList stops={results} labelledBy={resultsHeadingId} />
              </>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
