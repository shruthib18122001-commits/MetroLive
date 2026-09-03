import { useId, useState } from 'react';

import { Button } from '../components/Button';
import { FavoritesList } from '../components/FavoritesList';
import { FeatureCards } from '../components/FeatureCards';
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
  const showLanding = trimmed.length === 0;
  const results = query.data ?? [];

  return (
    <div
      className={`animate-fade-in ${
        showLanding ? 'lg:flex lg:min-h-[calc(100dvh-13rem)] lg:flex-col lg:justify-center' : ''
      }`}
    >
      <section className="mx-auto max-w-3xl text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 text-[0.6875rem] font-bold uppercase tracking-wider text-brand-700 ring-1 ring-brand-200">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-pulse-soft" aria-hidden="true" />
          Live LA Metro
        </span>

        <h1 className="mt-4 animate-rise text-4xl font-black leading-[1.05] tracking-tight text-neutral-900 sm:text-5xl lg:text-[3.5rem]">
          Find your stop
        </h1>
        <p
          className="mx-auto mt-3 max-w-xl animate-rise text-base leading-relaxed text-neutral-600 md:text-lg"
          style={{ animationDelay: '60ms' }}
        >
          Real-time arrivals for any LA Metro bus stop or rail station — search a name and watch the
          board update itself.
        </p>

        <div
          className="mx-auto mt-7 max-w-xl animate-rise text-left"
          style={{ animationDelay: '120ms' }}
        >
          <StopSearchInput
            value={rawQuery}
            onChange={setRawQuery}
            busy={isActive && query.isFetching}
          />
        </div>
      </section>

      <section
        aria-labelledby={resultsHeadingId}
        aria-live="polite"
        className="mx-auto mt-9 flex max-w-4xl flex-col gap-7"
      >
        <h2 id={resultsHeadingId} className="sr-only">
          {showLanding ? 'Your stops and popular stations' : 'Search results'}
        </h2>

        {showLanding ? (
          <>
            {hasFavorites ? (
              <div className="mx-auto w-full max-w-xl">
                <FavoritesList />
              </div>
            ) : null}
            <div className="mx-auto w-full max-w-xl text-center">
              <PopularStops />
            </div>
            <FeatureCards />
          </>
        ) : (
          <div className="mx-auto w-full max-w-xl">
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
              <div className="flex flex-col gap-3">
                <p className="px-1 text-xs font-semibold text-neutral-600">
                  {results.length} {results.length === 1 ? 'match' : 'matches'} for “{debouncedQuery}”
                </p>
                <StopResultList stops={results} labelledBy={resultsHeadingId} />
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
