import { memo } from 'react';

import { minutesUntil } from '../lib/format';
import type { Arrival, ArrivalStatus } from '../types/transit';
import { DelayStatusBadge } from './DelayStatusBadge';
import { RouteBadge } from './RouteBadge';

interface ArrivalRowProps {
  arrival: Arrival;
  now: number;
}

const ACCENT: Record<ArrivalStatus, string> = {
  early: 'bg-sky-500',
  ontime: 'bg-emerald-500',
  late: 'bg-rose-500',
  unknown: 'bg-neutral-300',
};

const ROW_TINT: Record<ArrivalStatus, string> = {
  early: 'bg-sky-50/70',
  ontime: 'bg-white',
  late: 'bg-rose-50/70',
  unknown: 'bg-white',
};

function Countdown({ iso, now }: { iso: string | null; now: number }) {
  const mins = minutesUntil(iso, now);

  if (mins === null) {
    return <span className="text-sm font-semibold text-neutral-600">No ETA</span>;
  }
  if (mins <= 0) {
    return (
      <span className="rounded-lg bg-brand-600 px-2.5 py-1 text-sm font-bold text-white shadow-sm">
        Due
      </span>
    );
  }
  return (
    <span className="flex items-baseline gap-1">
      <span
        className={`text-2xl font-extrabold leading-none tracking-tight tabular-nums ${
          mins <= 3 ? 'text-brand-600' : 'text-neutral-900'
        }`}
      >
        {mins}
      </span>
      <span className="text-xs font-semibold text-neutral-600">min</span>
    </span>
  );
}

/** Presentational card for one arrival. The list wraps it in an `<li>` that
 * carries the full screen-reader summary, so this subtree is `aria-hidden`. */
export const ArrivalRow = memo(function ArrivalRow({ arrival, now }: ArrivalRowProps) {
  return (
    <div
      aria-hidden="true"
      className={`relative flex h-full items-center gap-3 overflow-hidden rounded-2xl border border-neutral-200 px-3.5 shadow-card transition-shadow hover:shadow-card-hover ${ROW_TINT[arrival.status]}`}
    >
      <span className={`absolute inset-y-0 left-0 w-1.5 ${ACCENT[arrival.status]}`} />

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
