import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';

import { arrivalSummary } from '../lib/format';
import type { Arrival } from '../types/transit';
import { ArrivalRow } from './ArrivalRow';
import { Button } from './Button';
import { Spinner } from './Spinner';
import { StateMessage } from './StateMessage';

const ROW_HEIGHT = 72;
const ROW_GAP = 8;

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
    <section aria-label="Upcoming arrivals" aria-live="polite" aria-busy={isPending || isFetching}>
      {isPending ? (
        <StateMessage
          icon={<Spinner label="Loading arrivals" />}
          title="Loading arrivals…"
          description="Fetching the latest predictions for this stop."
        />
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
        <>
          {isError ? (
            <p
              role="status"
              className="mb-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900"
            >
              Couldn’t refresh just now — showing the last known times.
            </p>
          ) : null}

          <div ref={scrollRef} className="max-h-[70vh] overflow-y-auto">
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
                    <ArrivalRow arrival={arrival} now={now} />
                  </li>
                );
              })}
            </ol>
          </div>
        </>
      )}
    </section>
  );
}
