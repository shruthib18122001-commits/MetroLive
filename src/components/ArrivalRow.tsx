import { memo } from 'react';

import { minutesUntil } from '../lib/format';
import type { Arrival } from '../types/transit';
import { DelayStatusBadge } from './DelayStatusBadge';
import { RouteBadge } from './RouteBadge';

interface ArrivalRowProps {
  arrival: Arrival;
  now: number;
}

function Countdown({ iso, now }: { iso: string | null; now: number }) {
  const mins = minutesUntil(iso, now);

  if (mins === null) {
    return <span className="text-sm font-medium text-neutral-400">No ETA</span>;
  }
  if (mins <= 0) {
    return (
      <span className="rounded-lg bg-brand-50 px-2 py-1 text-sm font-bold text-brand-800">Due</span>
    );
  }
  return (
    <span className="flex items-baseline gap-1">
      <span className="text-[1.375rem] font-bold leading-none tracking-tight text-neutral-900 tabular-nums">
        {mins}
      </span>
      <span className="text-xs font-medium text-neutral-500">min</span>
    </span>
  );
}

/** Presentational card for one arrival. The list wraps it in an `<li>` that
 * carries the full screen-reader summary, so this subtree is `aria-hidden`. */
export const ArrivalRow = memo(function ArrivalRow({ arrival, now }: ArrivalRowProps) {
  return (
    <div
      aria-hidden="true"
      className="flex h-full items-center gap-3 rounded-2xl border border-neutral-200/80 bg-white px-3.5 shadow-card"
    >
      <RouteBadge routeId={arrival.routeId} routeName={arrival.routeName} />

      <div className="min-w-0 flex-1">
        <p className="truncate text-[0.9375rem] font-semibold leading-tight text-neutral-900">
          {arrival.headsign || 'Destination unavailable'}
        </p>
        <div className="mt-1">
          <DelayStatusBadge status={arrival.status} delaySeconds={arrival.delaySeconds} />
        </div>
      </div>

      <div className="shrink-0 pl-1 text-right">
        <Countdown iso={arrival.predictedTime} now={now} />
      </div>
    </div>
  );
});
