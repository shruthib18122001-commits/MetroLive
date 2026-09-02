/**
 * Pure display helpers shared by the arrival components. No React.
 */
import type { Arrival, ArrivalStatus } from '../types/transit';

/** Whole minutes from `now` until `iso`. Negative = already past. `null` if no estimate. */
export function minutesUntil(iso: string | null, now: number = Date.now()): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  return Math.round((t - now) / 60_000);
}

/** "Due" / "1 min" / "7 min" / "No estimate" — the big countdown on each row. */
export function formatCountdown(iso: string | null, now?: number): string {
  const mins = minutesUntil(iso, now);
  if (mins === null) return 'No estimate';
  if (mins <= 0) return 'Due';
  if (mins === 1) return '1 min';
  return `${mins} min`;
}

const STATUS_LABEL: Record<ArrivalStatus, string> = {
  early: 'Early',
  ontime: 'On time',
  late: 'Late',
  unknown: 'No data',
};

export function statusLabel(status: ArrivalStatus): string {
  return STATUS_LABEL[status];
}

/** "On time" / "3 min late" / "1 min early" / "No data" — the delay pill text. */
export function delayLabel(arrival: Pick<Arrival, 'status' | 'delaySeconds'>): string {
  if (arrival.status === 'unknown') return 'No data';
  if (arrival.status === 'ontime') return 'On time';
  const mins = Math.max(1, Math.round(Math.abs(arrival.delaySeconds) / 60));
  return arrival.status === 'late' ? `${mins} min late` : `${mins} min early`;
}

/** "just now" / "20s ago" / "3m ago" — freshness of the last successful fetch. */
export function formatAge(updatedAt: number, now: number = Date.now()): string {
  const seconds = Math.max(0, Math.round((now - updatedAt) / 1000));
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  return `${minutes}m ago`;
}

/** One-line screen-reader summary of an arrival row. */
export function arrivalSummary(arrival: Arrival, now?: number): string {
  const route = arrival.routeName || arrival.routeId || 'Unknown route';
  const headsign = arrival.headsign || 'destination unavailable';
  return `Route ${route} to ${headsign}. ${formatCountdown(arrival.predictedTime, now)}. ${delayLabel(arrival)}.`;
}
