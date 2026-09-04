import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';

import { enrichedArrivalSummary } from '../lib/insights';
import type { EnrichedArrival, VanishedArrival } from '../lib/insights';
import { ArrivalRow } from './ArrivalRow';
import { ArrivalRowSkeleton } from './Skeleton';
import { Button } from './Button';
import { StateMessage } from './StateMessage';

const ROW_HEIGHT = 80;
const ROW_HEIGHT_GLANCE = 104;
const ROW_GAP = 10;

interface ArrivalsListProps {
  arrivals: EnrichedArrival[] | undefined;
  vanished?: VanishedArrival[];
  isPending: boolean;
  isError: boolean;
  isFetching: boolean;
  errorMessage: string | null;
  now: number;
  glance?: boolean;
  onRetry: () => void;
}

function VanishedNotice({ vanished, now }: { vanished: VanishedArrival[]; now: number }) {
  return (
    <section
      aria-label="Recently dropped from the feed"
      className="mt-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-3"
    >
      <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-amber-800">
        Dropped off the board
      </p>
      <ul className="mt-1.5 flex flex-col gap-1.5">
        {vanished.map((v) => {
          const secsAgo = Math.max(0, Math.round((now - v.lastSeenAt) / 1000));
          const ago = secsAgo < 60 ? `${secsAgo}s ago` : `${Math.round(secsAgo / 60)}m ago`;
          return (
            <li key={v.key} className="text-[0.8125rem] leading-snug text-amber-900">
              <span className="font-bold">{v.routeName || v.routeId}</span>
              {v.headsign ? ` to ${v.headsign}` : ''} — was{' '}
              {v.wasMinutesAway === null ? 'due' : `${v.wasMinutesAway} min away`}, left the feed{' '}
              {ago}. May be cancelled or running without GPS.
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function ArrivalsList({
  arrivals,
  vanished = [],
  isPending,
  isError,
  isFetching,
  errorMessage,
  now,
  glance = false,
  onRetry,
}: ArrivalsListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const rows = arrivals ?? [];
  const rowHeight = glance ? ROW_HEIGHT_GLANCE : ROW_HEIGHT;

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => rowHeight,
    gap: ROW_GAP,
    overscan: 8,
  });

  return (
    <section
      aria-label="Upcoming arrivals"
      aria-live="polite"
      aria-busy={isPending || isFetching}
      className="min-h-[18rem]"
    >
      {isPending ? (
        <div role="status">
          <span className="sr-only">Loading arrivals…</span>
          <div className="flex flex-col gap-2.5" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <ArrivalRowSkeleton key={i} delayMs={i * 80} />
            ))}
          </div>
        </div>
      ) : isError && rows.length === 0 ? (
        <StateMessage
          tone="error"
          title="Couldn’t load arrivals"
          description={errorMessage ?? 'Something went wrong reaching the arrivals service.'}
          action={
            <Button onClick={onRetry} variant="secondary">
              Try again
            </Button>
          }
        />
      ) : rows.length === 0 ? (
        <>
          <StateMessage
            title="No upcoming arrivals"
            description="Nothing is predicted for this stop in the next hour. Service may have ended for the day."
          />
          {vanished.length > 0 ? <VanishedNotice vanished={vanished} now={now} /> : null}
        </>
      ) : (
        <div className="animate-fade-in">
          {isError ? (
            <p
              role="status"
              className="mb-2.5 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
              </svg>
              Couldn’t refresh just now — showing the last known times.
            </p>
          ) : null}

          <div ref={scrollRef} className="-mx-1 max-h-[70vh] overflow-y-auto px-1">
            <ol
              role="list"
              className="relative m-0 list-none p-0"
              style={{ height: `${virtualizer.getTotalSize()}px` }}
            >
              {virtualizer.getVirtualItems().map((item) => {
                const arrival = rows[item.index];
                if (!arrival) return null;
                return (
                  <li
                    key={arrival.key}
                    aria-label={enrichedArrivalSummary(arrival, now)}
                    className="absolute left-0 top-0 w-full"
                    style={{ height: `${item.size}px`, transform: `translateY(${item.start}px)` }}
                  >
                    <div
                      className="h-full animate-rise"
                      style={{ animationDelay: `${Math.min(item.index, 6) * 45}ms` }}
                    >
                      <ArrivalRow arrival={arrival} now={now} glance={glance} />
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>

          {vanished.length > 0 ? <VanishedNotice vanished={vanished} now={now} /> : null}
        </div>
      )}
    </section>
  );
}
