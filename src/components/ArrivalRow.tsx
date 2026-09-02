import { memo } from 'react';

import { formatCountdown } from '../lib/format';
import type { Arrival } from '../types/transit';
import { DelayStatusBadge } from './DelayStatusBadge';
import { RouteBadge } from './RouteBadge';

interface ArrivalRowProps {
  arrival: Arrival;
  now: number;
}

/** The visual card for one arrival. The list wraps it in an `<li>` that carries
 * the screen-reader summary, so this stays presentational. */
export const ArrivalRow = memo(function ArrivalRow({ arrival, now }: ArrivalRowProps) {
  return (
    <div className="flex h-full items-center gap-3 rounded-xl border border-neutral-200 bg-white px-3">
      <RouteBadge routeId={arrival.routeId} routeName={arrival.routeName} />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-neutral-900">
          {arrival.headsign || 'Destination unavailable'}
        </p>
        <DelayStatusBadge status={arrival.status} delaySeconds={arrival.delaySeconds} />
      </div>

      <span className="shrink-0 text-lg font-bold tabular-nums leading-tight text-neutral-900">
        {formatCountdown(arrival.predictedTime, now)}
      </span>
    </div>
  );
});
