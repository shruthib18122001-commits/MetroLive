import { Link, useParams } from 'react-router-dom';

import { ArrivalsList } from '../components/ArrivalsList';
import { FavoriteToggle } from '../components/FavoriteToggle';
import { useArrivalInsights } from '../hooks/useArrivalInsights';
import { useLocalStorageBoolean } from '../hooks/useLocalStorageBoolean';
import { useNow } from '../hooks/useNow';
import { useStop } from '../hooks/useStop';
import { ApiError } from '../lib/apiClient';
import { formatAge } from '../lib/format';
import { STALE_FEED_SECONDS } from '../lib/insights';

export function StopRoute() {
  const params = useParams<{ stopId: string }>();
  const stopId = params.stopId ?? '';
  const now = useNow(15_000);
  const [glance, setGlance] = useLocalStorageBoolean('metrolive.glance.v1', false);

  const stopQuery = useStop(stopId);
  const { query: arrivalsQuery, insights, announcement } = useArrivalInsights(stopId);

  const stopName = stopQuery.data?.name ?? `Stop ${stopId}`;
  const source = arrivalsQuery.data?.source;

  const errorMessage = arrivalsQuery.isError
    ? arrivalsQuery.error instanceof ApiError
      ? arrivalsQuery.error.message
      : 'Could not reach the arrivals service.'
    : null;

  const feedTimestamp = insights?.feedTimestamp ?? arrivalsQuery.data?.feedTimestamp ?? null;
  const feedMs = feedTimestamp ? Date.parse(feedTimestamp) : null;
  const feedAgeSeconds = feedMs === null ? null : Math.max(0, Math.round((now - feedMs) / 1000));
  const feedStale = feedAgeSeconds !== null && feedAgeSeconds > STALE_FEED_SECONDS;

  let freshness = '';
  if (arrivalsQuery.isFetching) {
    freshness = 'Refreshing…';
  } else if (feedMs !== null) {
    freshness = `${feedStale ? 'Feed delayed' : 'Live feed'} · ${formatAge(feedMs, now)}`;
  } else if (arrivalsQuery.dataUpdatedAt) {
    freshness = `Updated ${formatAge(arrivalsQuery.dataUpdatedAt, now)}`;
  }

  return (
    <div className="animate-fade-in">
      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>

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

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <FavoriteToggle stop={{ id: stopId, name: stopName }} />
              <button
                type="button"
                aria-pressed={glance}
                onClick={() => setGlance()}
                className={`inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 ${
                  glance
                    ? 'bg-brand-100 text-brand-800 ring-1 ring-inset ring-brand-300'
                    : 'bg-white text-neutral-700 ring-1 ring-inset ring-neutral-300 hover:bg-neutral-50'
                }`}
              >
                <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true" fill="currentColor">
                  <path d="M3 5.5A2.5 2.5 0 0 1 5.5 3H8v2H5.5a.5.5 0 0 0-.5.5V8H3V5.5Zm14 0V8h-2V5.5a.5.5 0 0 0-.5-.5H12V3h2.5A2.5 2.5 0 0 1 17 5.5ZM3 12h2v2.5a.5.5 0 0 0 .5.5H8v2H5.5A2.5 2.5 0 0 1 3 14.5V12Zm14 0v2.5a2.5 2.5 0 0 1-2.5 2.5H12v-2h2.5a.5.5 0 0 0 .5-.5V12h2Z" />
                </svg>
                {glance ? 'Large text on' : 'Large text'}
              </button>
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

            <div className="mt-4 flex items-center justify-between border-t border-neutral-200/70 pt-3 text-xs">
              <span
                aria-live="off"
                className={feedStale ? 'font-semibold text-amber-700' : 'text-neutral-600'}
              >
                {freshness}
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
        <div className="mt-6 max-w-2xl animate-rise lg:mt-0" style={{ animationDelay: '80ms' }}>
          <ArrivalsList
            arrivals={insights?.arrivals}
            vanished={insights?.vanished ?? []}
            isPending={arrivalsQuery.isPending}
            isError={arrivalsQuery.isError}
            isFetching={arrivalsQuery.isFetching}
            errorMessage={errorMessage}
            now={now}
            glance={glance}
            onRetry={() => void arrivalsQuery.refetch()}
          />
        </div>
      </div>
    </div>
  );
}
