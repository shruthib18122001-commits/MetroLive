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
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Find your stop</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Search any LA Metro bus stop or rail station for live arrivals.
        </p>
      </div>

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
              <p className="text-xs text-neutral-500">
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
