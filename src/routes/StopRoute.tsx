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

  const sortedArrivals = useMemo(() => {
    const list = arrivalsQuery.data?.arrivals;
    if (!list) return undefined;
    return [...list].sort((a, b) =>
      (a.predictedTime ?? '￿').localeCompare(b.predictedTime ?? '￿'),
    );
  }, [arrivalsQuery.data?.arrivals]);

  return (
    <div className="animate-fade-in">
      <Link
        to="/"
        className="inline-flex w-fit items-center gap-1 rounded-lg py-0.5 text-sm font-semibold text-brand-700 transition-colors hover:text-brand-800 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
      >
        <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true" fill="currentColor">
          <path d="M12.79 5.23a.75.75 0 0 1 0 1.06L9.06 10l3.73 3.71a.75.75 0 1 1-1.06 1.06l-4.25-4.24a.75.75 0 0 1 0-1.06l4.25-4.24a.75.75 0 0 1 1.06 0Z" />
        </svg>
        All stops
      </Link>

      <div className="mt-3 lg:grid lg:grid-cols-[minmax(0,21rem)_1fr] lg:gap-10">
        {/* Stop detail panel */}
        <aside className="animate-rise lg:sticky lg:top-24 lg:self-start">
          <div className="glass rounded-3xl p-5 shadow-card">
          <h1 className="text-2xl font-black leading-tight tracking-tight text-neutral-900 lg:text-[1.75rem]">
            {stopName}
          </h1>
          <p className="mt-1 text-[0.8125rem] text-neutral-600">
            Stop {stopId}
            {stopQuery.isPending ? ' · loading name…' : ''}
          </p>

          <div className="mt-4">
            <FavoriteToggle stop={{ id: stopId, name: stopName }} />
          </div>

          {source === 'demo' ? (
            <p
              role="note"
              className="mt-4 flex items-start gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3.5 py-2.5 text-[0.8125rem] leading-relaxed text-sky-900"
            >
              <svg viewBox="0 0 20 20" className="mt-px h-4 w-4 shrink-0 text-sky-500" aria-hidden="true" fill="currentColor">
                <path d="M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm0 5a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm1 7a1 1 0 1 1-2 0V9a1 1 0 1 1 2 0v5Z" />
              </svg>
              <span>
                Showing <strong>demo data</strong>. Set{' '}
                <code className="rounded bg-sky-100 px-1 py-px font-mono text-[0.75rem]">
                  SWIFTLY_API_KEY
                </code>{' '}
                on the server for live LA Metro predictions.
              </span>
            </p>
          ) : null}

          <div className="mt-4 flex items-center justify-between border-t border-neutral-200/70 pt-3 text-xs text-neutral-600">
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
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 font-semibold text-brand-700 transition-colors hover:bg-brand-100 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
            >
              <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" aria-hidden="true" fill="currentColor">
                <path d="M10 3a7 7 0 0 1 6.32 4h-2.2a5 5 0 1 0 .1 6h2.16A7 7 0 1 1 10 3Z" />
                <path d="M17 3v4h-4z" />
              </svg>
              Refresh
            </button>
          </div>
        </div>
      </aside>

        {/* Arrivals */}
        <div
          className="mt-6 max-w-2xl animate-rise lg:mt-0"
          style={{ animationDelay: '80ms' }}
        >
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
      </div>
    </div>
  );
}
