import { memo } from 'react';

import { minutesUntil } from '../lib/format';
import type { EnrichedArrival } from '../lib/insights';
import type { ArrivalStatus } from '../types/transit';
import { DelayStatusBadge } from './DelayStatusBadge';
import { RouteBadge } from './RouteBadge';

interface ArrivalRowProps {
  arrival: EnrichedArrival;
  now: number;
  glance?: boolean;
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

function Countdown({ iso, now, glance }: { iso: string | null; now: number; glance: boolean }) {
  const mins = minutesUntil(iso, now);
  const numberClass = glance ? 'text-4xl' : 'text-2xl';

  if (mins === null) {
    return <span className={`font-semibold text-neutral-600 ${glance ? 'text-xl' : 'text-sm'}`}>No ETA</span>;
  }
  if (mins <= 0) {
    return (
      <span className={`rounded-lg bg-brand-600 px-2.5 py-1 font-bold text-white shadow-sm ${glance ? 'text-xl' : 'text-sm'}`}>
        Due
      </span>
    );
  }
  return (
    <span className="flex items-baseline gap-1">
      <span
        className={`font-extrabold leading-none tracking-tight tabular-nums ${numberClass} ${
          mins <= 3 ? 'text-brand-600' : 'text-neutral-900'
        }`}
      >
        {mins}
      </span>
      <span className={`font-semibold text-neutral-600 ${glance ? 'text-sm' : 'text-xs'}`}>min</span>
    </span>
  );
}

function TrendChip({ shiftSeconds, direction }: { shiftSeconds: number; direction: 'earlier' | 'later' }) {
  const mins = Math.max(1, Math.round(Math.abs(shiftSeconds) / 60));
  const later = direction === 'later';
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[0.6875rem] font-bold ${
        later ? 'bg-rose-100 text-rose-700' : 'bg-sky-100 text-sky-700'
      }`}
      title={later ? 'Predicted arrival is slipping later' : 'Predicted arrival is being pulled in'}
    >
      {later ? '▲' : '▼'} {mins}m {later ? 'later' : 'sooner'}
    </span>
  );
}

/** Presentational card for one arrival. The list wraps it in an `<li>` that
 * carries the full screen-reader summary, so this subtree is `aria-hidden`. */
export const ArrivalRow = memo(function ArrivalRow({ arrival, now, glance = false }: ArrivalRowProps) {
  const showTrend =
    (arrival.trend.direction === 'later' || arrival.trend.direction === 'earlier') &&
    Math.abs(arrival.trend.shiftSeconds) >= 60;

  const notes: string[] = [];
  if (arrival.bunchedWithNext) notes.push(`Another ${arrival.routeName || arrival.routeId} close behind`);
  if (arrival.longGapAfterMinutes) notes.push(`${arrival.longGapAfterMinutes}-min gap after this`);

  return (
    <div
      aria-hidden="true"
      className={`relative flex h-full items-center gap-3 overflow-hidden rounded-2xl border border-neutral-200 px-3.5 shadow-card transition-shadow hover:shadow-card-hover ${ROW_TINT[arrival.status]}`}
    >
      <span className={`absolute inset-y-0 left-0 ${glance ? 'w-2' : 'w-1.5'} ${ACCENT[arrival.status]}`} />

      <RouteBadge routeId={arrival.routeId} routeName={arrival.routeName} />

      <div className="min-w-0 flex-1">
        <p
          className={`truncate font-semibold leading-tight text-neutral-900 ${
            glance ? 'text-lg' : 'text-[0.9375rem]'
          }`}
        >
          {arrival.headsign || 'Destination unavailable'}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <DelayStatusBadge status={arrival.status} delaySeconds={arrival.delaySeconds} />
          {showTrend ? (
            <TrendChip
              shiftSeconds={arrival.trend.shiftSeconds}
              direction={arrival.trend.direction === 'later' ? 'later' : 'earlier'}
            />
          ) : null}
          {arrival.vehicleStale && arrival.vehicleAgeSeconds !== null ? (
            <span
              className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[0.6875rem] font-bold text-amber-800"
              title="This vehicle has not reported recently — position uncertain"
            >
              ⚠ no signal {Math.round(arrival.vehicleAgeSeconds / 60)}m
            </span>
          ) : null}
        </div>
        {!glance && notes.length > 0 ? (
          <p className="mt-1 truncate text-[0.6875rem] font-medium text-neutral-500">
            {notes.join(' · ')}
          </p>
        ) : null}
      </div>

      <div className="shrink-0 pl-1 text-right">
        <Countdown iso={arrival.predictedTime} now={now} glance={glance} />
      </div>
    </div>
  );
});
