import { useId, useState } from 'react';

import { Button } from '../components/Button';
import { FavoritesList } from '../components/FavoritesList';
import { Spinner } from '../components/Spinner';
import { StateMessage } from '../components/StateMessage';
import { StopResultList } from '../components/StopResultList';
import { StopSearchInput } from '../components/StopSearchInput';
import { useStopSearch } from '../hooks/useStopSearch';
import { ApiError } from '../lib/apiClient';

export function SearchRoute() {
  const [rawQuery, setRawQuery] = useState('');
  const { debouncedQuery, isActive, query } = useStopSearch(rawQuery);
  const resultsHeadingId = useId();

  const trimmed = rawQuery.trim();
  const showFavorites = trimmed.length === 0;
  const results = query.data ?? [];

  return (
    <div className="flex animate-fade-in flex-col gap-6">
      <header>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-100 px-2.5 py-1 text-[0.6875rem] font-bold uppercase tracking-wider text-brand-700">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-pulse-soft" aria-hidden="true" />
          Live LA Metro
        </span>
        <h1 className="mt-2 text-[1.375rem] font-bold leading-tight tracking-[-0.015em] text-neutral-900">
          Find your stop
        </h1>
        <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-neutral-600">
          Real-time arrivals for any bus stop or rail station.
        </p>
      </header>

      {showFavorites ? <FavoritesList /> : null}

      <StopSearchInput
        value={rawQuery}
        onChange={setRawQuery}
        busy={isActive && query.isFetching}
      />

      {!showFavorites ? (
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
              <p className="px-1 text-xs text-neutral-600">
                {results.length} {results.length === 1 ? 'match' : 'matches'} for “{debouncedQuery}”
              </p>
              <StopResultList stops={results} labelledBy={resultsHeadingId} />
            </>
          )}
        </section>
      ) : null}
    </div>
  );
}
