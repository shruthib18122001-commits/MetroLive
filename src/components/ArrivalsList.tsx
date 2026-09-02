import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';

import { arrivalSummary } from '../lib/format';
import type { Arrival } from '../types/transit';
import { ArrivalRow } from './ArrivalRow';
import { ArrivalRowSkeleton } from './Skeleton';
import { Button } from './Button';
import { StateMessage } from './StateMessage';

const ROW_HEIGHT = 80;
const ROW_GAP = 10;

interface ArrivalsListProps {
  arrivals: Arrival[] | undefined;
  isPending: boolean;
  isError: boolean;
  isFetching: boolean;
  errorMessage: string | null;
  now: number;
  onRetry: () => void;
}

export function ArrivalsList({
  arrivals,
  isPending,
  isError,
  isFetching,
  errorMessage,
  now,
  onRetry,
}: ArrivalsListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const rows = arrivals ?? [];

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
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
        <StateMessage
          title="No upcoming arrivals"
          description="Nothing is predicted for this stop in the next hour. Service may have ended for the day."
        />
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
                    key={`${arrival.routeId}-${arrival.predictedTime ?? 'na'}-${item.index}`}
                    aria-label={arrivalSummary(arrival, now)}
                    className="absolute left-0 top-0 w-full"
                    style={{ height: `${item.size}px`, transform: `translateY(${item.start}px)` }}
                  >
                    <div
                      className="h-full animate-rise"
                      style={{ animationDelay: `${Math.min(item.index, 6) * 45}ms` }}
                    >
                      <ArrivalRow arrival={arrival} now={now} />
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      )}
    </section>
  );
}
