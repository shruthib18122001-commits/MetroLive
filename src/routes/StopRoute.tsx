import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';

import { ArrivalsList } from '../components/ArrivalsList';
import { FavoriteToggle } from '../components/FavoriteToggle';
import { useArrivals } from '../hooks/useArrivals';
import { useNow } from '../hooks/useNow';
import { useStop } from '../hooks/useStop';
import { ApiError } from '../lib/apiClient';
import { formatAge } from '../lib/format';

export function StopRoute() {
  const params = useParams<{ stopId: string }>();
  const stopId = params.stopId ?? '';
  const now = useNow(15_000);

  const stopQuery = useStop(stopId);
  const arrivalsQuery = useArrivals(stopId);

  const stopName = stopQuery.data?.name ?? `Stop ${stopId}`;
  const source = arrivalsQuery.data?.source;

  const errorMessage = arrivalsQuery.isError
    ? arrivalsQuery.error instanceof ApiError
      ? arrivalsQuery.error.message
      : 'Could not reach the arrivals service.'
    : null;

  // Defensive client-side re-sort; memoized so polling refetches don't re-sort
  // an already-ordered list on every render.
  const sortedArrivals = useMemo(() => {
    const list = arrivalsQuery.data?.arrivals;
    if (!list) return undefined;
    return [...list].sort((a, b) =>
      (a.predictedTime ?? '￿').localeCompare(b.predictedTime ?? '￿'),
    );
  }, [arrivalsQuery.data?.arrivals]);

  return (
    <div className="flex flex-col gap-4">
      <Link
        to="/"
        className="inline-flex w-fit items-center gap-1 rounded-md text-sm font-medium text-brand-700 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
      >
        <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true" fill="currentColor">
          <path d="M12.79 5.23a.75.75 0 0 1 0 1.06L9.06 10l3.73 3.71a.75.75 0 1 1-1.06 1.06l-4.25-4.24a.75.75 0 0 1 0-1.06l4.25-4.24a.75.75 0 0 1 1.06 0Z" />
        </svg>
        All stops
      </Link>

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="break-words text-xl font-bold text-neutral-900">{stopName}</h1>
          <p className="mt-0.5 text-xs text-neutral-500">
            Stop {stopId}
            {stopQuery.isPending ? ' · loading name…' : ''}
          </p>
        </div>
        <FavoriteToggle stop={{ id: stopId, name: stopName }} className="shrink-0" />
      </div>

      {source === 'demo' ? (
        <p
          role="note"
          className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-900"
        >
          Showing <strong>demo data</strong>. Set <code className="font-mono">SWIFTLY_API_KEY</code>{' '}
          on the server for live LA Metro predictions.
        </p>
      ) : null}

      <div className="flex items-center justify-between text-xs text-neutral-500">
        <span aria-live="off">
          {arrivalsQuery.isFetching
            ? 'Updating…'
            : arrivalsQuery.dataUpdatedAt
              ? `Updated ${formatAge(arrivalsQuery.dataUpdatedAt, now)}`
              : ''}
        </span>
        <button
          type="button"
          onClick={() => void arrivalsQuery.refetch()}
          className="rounded-md px-2 py-1 font-medium text-brand-700 hover:bg-brand-50 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
        >
          Refresh
        </button>
      </div>

      <ArrivalsList
        arrivals={sortedArrivals}
        isPending={arrivalsQuery.isPending}
        isError={arrivalsQuery.isError}
        isFetching={arrivalsQuery.isFetching}
        errorMessage={errorMessage}
        now={now}
        onRetry={() => void arrivalsQuery.refetch()}
      />
    </div>
  );
}
