/**
 * Client-side realtime insights derived from successive `/api/arrivals` polls.
 * Pure — no React. Given the previous history and a fresh arrivals array it
 * returns enriched arrivals plus:
 *
 *  - trend      how each prediction has drifted over the last few minutes (#1)
 *  - vanished   trips that were "due" and then dropped out of the feed (#2)
 *  - feedStale  whether the feed / a vehicle has gone quiet (#3)
 *  - bunching / long-gap flags on each arrival (#5)
 *
 * and a short spoken-form summary of what changed since last time (#6).
 */
import type { Arrival } from '../types/transit';
import { arrivalSummary } from './format';

export const TREND_WINDOW_MS = 4 * 60_000;
export const TREND_MIN_SAMPLES = 2;
/** Predicted arrival moved at least this much later / earlier ⇒ "slipping" / "gaining". */
export const TREND_SHIFT_SECONDS = 60;
export const MAX_SAMPLES = 12;

/** Remember a trip that left the feed for this long before forgetting it. */
export const VANISH_MEMORY_MS = 4 * 60_000;
/** Only call it "vanished" (vs. simply departed) if it was still this far out when last seen. */
export const VANISH_MIN_LEAD_MS = 90_000;
/** ...but not so far out that its disappearance is unremarkable. */
export const VANISH_MAX_LEAD_MS = 25 * 60_000;

export const STALE_FEED_SECONDS = 120;
export const STALE_VEHICLE_SECONDS = 300;

/** Same-route arrivals within this window are "bunched". */
export const BUNCH_WITHIN_SECONDS = 150;
/** A gap after an arrival longer than this (when that arrival is soon) is worth flagging. */
export const LONG_GAP_MINUTES = 18;
export const LONG_GAP_RELEVANT_WITHIN_MINUTES = 20;

/** Announce a prediction shift only once it exceeds this. */
export const ANNOUNCE_SHIFT_SECONDS = 120;

export type TrendDirection = 'earlier' | 'later' | 'steady' | 'unknown';

export interface ArrivalTrend {
  direction: TrendDirection;
  /** Signed seconds the predicted arrival has moved over the window (+ = later). */
  shiftSeconds: number;
  sampleCount: number;
}

export interface EnrichedArrival extends Arrival {
  /** Stable identity used for matching across polls. */
  key: string;
  trend: ArrivalTrend;
  vehicleAgeSeconds: number | null;
  vehicleStale: boolean;
  /** This arrival and the next are the same route within {@link BUNCH_WITHIN_SECONDS}. */
  bunchedWithNext: boolean;
  bunchedWithPrev: boolean;
  /** Minutes until the following arrival, when that gap is notably long. */
  longGapAfterMinutes: number | null;
}

export interface VanishedArrival {
  key: string;
  routeId: string;
  routeName: string;
  headsign: string;
  lastPredictedTime: string | null;
  lastSeenAt: number;
  wasMinutesAway: number | null;
}

export interface ArrivalInsights {
  arrivals: EnrichedArrival[];
  vanished: VanishedArrival[];
  feedTimestamp: string | null;
  feedAgeSeconds: number | null;
  feedStale: boolean;
}

interface TripSample {
  at: number;
  predictedMs: number | null;
}

export interface TripRecord {
  key: string;
  routeId: string;
  routeName: string;
  headsign: string;
  samples: TripSample[];
  firstSeenAt: number;
  lastSeenAt: number;
  lastPredictedTime: string | null;
}

export type ArrivalHistory = Record<string, TripRecord>;

function keyFor(arrival: Arrival): string {
  const tripId = (arrival.tripId ?? '').trim();
  if (tripId !== '') return `trip:${tripId}`;
  return `rt:${arrival.routeId}@${arrival.predictedTime ?? 'na'}`;
}

function parseMs(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : t;
}

function computeTrend(samples: readonly TripSample[], now: number): ArrivalTrend {
  const inWindow = samples.filter(
    (s) => s.predictedMs !== null && s.at >= now - TREND_WINDOW_MS,
  );
  if (inWindow.length < TREND_MIN_SAMPLES) {
    return { direction: 'unknown', shiftSeconds: 0, sampleCount: inWindow.length };
  }
  const first = inWindow[0];
  const last = inWindow[inWindow.length - 1];
  if (!first || !last || first.predictedMs === null || last.predictedMs === null) {
    return { direction: 'unknown', shiftSeconds: 0, sampleCount: inWindow.length };
  }
  const shiftSeconds = Math.round((last.predictedMs - first.predictedMs) / 1000);
  const direction: TrendDirection =
    shiftSeconds >= TREND_SHIFT_SECONDS
      ? 'later'
      : shiftSeconds <= -TREND_SHIFT_SECONDS
        ? 'earlier'
        : 'steady';
  return { direction, shiftSeconds, sampleCount: inWindow.length };
}

interface ComputeOptions {
  now?: number;
  feedTimestamp?: string | null;
}

/**
 * Fold a fresh arrivals array into `previous` history and return the next
 * history plus the derived {@link ArrivalInsights}.
 */
export function computeInsights(
  previous: ArrivalHistory,
  arrivals: readonly Arrival[],
  options: ComputeOptions = {},
): { history: ArrivalHistory; insights: ArrivalInsights } {
  const now = options.now ?? Date.now();
  const feedTimestamp = options.feedTimestamp ?? null;

  const sorted = [...arrivals].sort((a, b) =>
    (a.predictedTime ?? '￿').localeCompare(b.predictedTime ?? '￿'),
  );

  const history: ArrivalHistory = {};
  for (const [k, record] of Object.entries(previous)) {
    history[k] = { ...record, samples: [...record.samples] };
  }

  const seen = new Set<string>();

  // 1. Upsert history from the current board.
  for (const arrival of sorted) {
    const key = keyFor(arrival);
    seen.add(key);
    const predictedMs = parseMs(arrival.predictedTime);
    const existing = history[key];
    if (existing) {
      existing.samples.push({ at: now, predictedMs });
      if (existing.samples.length > MAX_SAMPLES) {
        existing.samples.splice(0, existing.samples.length - MAX_SAMPLES);
      }
      existing.lastSeenAt = now;
      existing.lastPredictedTime = arrival.predictedTime;
      existing.routeName = arrival.routeName;
      existing.headsign = arrival.headsign;
    } else {
      history[key] = {
        key,
        routeId: arrival.routeId,
        routeName: arrival.routeName,
        headsign: arrival.headsign,
        samples: [{ at: now, predictedMs }],
        firstSeenAt: now,
        lastSeenAt: now,
        lastPredictedTime: arrival.predictedTime,
      };
    }
  }

  // 2. Enrich each arrival (trend, staleness, bunching, gaps).
  const enriched: EnrichedArrival[] = sorted.map((arrival, index) => {
    const key = keyFor(arrival);
    const record = history[key];
    const trend = record
      ? computeTrend(record.samples, now)
      : { direction: 'unknown' as const, shiftSeconds: 0, sampleCount: 0 };

    const vehicleMs = parseMs(arrival.vehicleTimestamp);
    const vehicleAgeSeconds = vehicleMs === null ? null : Math.round((now - vehicleMs) / 1000);
    const vehicleStale = vehicleAgeSeconds !== null && vehicleAgeSeconds > STALE_VEHICLE_SECONDS;

    const next = sorted[index + 1];
    const prev = sorted[index - 1];
    const thisMs = parseMs(arrival.predictedTime);
    const nextMs = next ? parseMs(next.predictedTime) : null;
    const prevMs = prev ? parseMs(prev.predictedTime) : null;

    const gapToNextSeconds = thisMs !== null && nextMs !== null ? (nextMs - thisMs) / 1000 : null;
    const gapFromPrevSeconds = thisMs !== null && prevMs !== null ? (thisMs - prevMs) / 1000 : null;

    const bunchedWithNext =
      next !== undefined &&
      next.routeId === arrival.routeId &&
      gapToNextSeconds !== null &&
      gapToNextSeconds >= 0 &&
      gapToNextSeconds <= BUNCH_WITHIN_SECONDS;

    const bunchedWithPrev =
      prev !== undefined &&
      prev.routeId === arrival.routeId &&
      gapFromPrevSeconds !== null &&
      gapFromPrevSeconds >= 0 &&
      gapFromPrevSeconds <= BUNCH_WITHIN_SECONDS;

    const minutesUntilThis = thisMs === null ? null : (thisMs - now) / 60_000;
    const longGapAfterMinutes =
      gapToNextSeconds !== null &&
      gapToNextSeconds / 60 > LONG_GAP_MINUTES &&
      minutesUntilThis !== null &&
      minutesUntilThis <= LONG_GAP_RELEVANT_WITHIN_MINUTES
        ? Math.round(gapToNextSeconds / 60)
        : null;

    return {
      ...arrival,
      key,
      trend,
      vehicleAgeSeconds,
      vehicleStale,
      bunchedWithNext,
      bunchedWithPrev,
      longGapAfterMinutes,
    };
  });

  // 3. Vanished trips: in history, not on the current board, still recent.
  const vanished: VanishedArrival[] = [];
  for (const [key, record] of Object.entries(history)) {
    if (seen.has(key)) continue;
    const age = now - record.lastSeenAt;
    if (age > VANISH_MEMORY_MS) {
      delete history[key];
      continue;
    }
    const lastPredictedMs = parseMs(record.lastPredictedTime);
    const lead = lastPredictedMs === null ? 0 : lastPredictedMs - record.lastSeenAt;
    const wasStillComing =
      lastPredictedMs !== null &&
      lead > VANISH_MIN_LEAD_MS &&
      lead < VANISH_MAX_LEAD_MS &&
      lastPredictedMs > now - 60_000;
    if (!wasStillComing) continue;
    vanished.push({
      key,
      routeId: record.routeId,
      routeName: record.routeName,
      headsign: record.headsign,
      lastPredictedTime: record.lastPredictedTime,
      lastSeenAt: record.lastSeenAt,
      wasMinutesAway: Math.round((lastPredictedMs - record.lastSeenAt) / 60_000),
    });
  }
  vanished.sort((a, b) => b.lastSeenAt - a.lastSeenAt);

  // 4. Feed freshness.
  const feedMs = parseMs(feedTimestamp);
  const feedAgeSeconds = feedMs === null ? null : Math.round((now - feedMs) / 1000);
  const feedStale = feedAgeSeconds !== null && feedAgeSeconds > STALE_FEED_SECONDS;

  return {
    history,
    insights: { arrivals: enriched, vanished, feedTimestamp, feedAgeSeconds, feedStale },
  };
}

/** Screen-reader label for a row: the base summary plus trend / no-signal notes. */
export function enrichedArrivalSummary(arrival: EnrichedArrival, now?: number): string {
  const parts = [arrivalSummary(arrival, now)];
  const shiftMinutes = Math.round(Math.abs(arrival.trend.shiftSeconds) / 60);
  if (arrival.trend.direction === 'later' && shiftMinutes >= 1) {
    parts.push(`Running behind — about ${shiftMinutes} minute${shiftMinutes === 1 ? '' : 's'} later than earlier estimates.`);
  } else if (arrival.trend.direction === 'earlier' && shiftMinutes >= 1) {
    parts.push('Coming sooner than earlier estimates.');
  }
  if (arrival.vehicleStale && arrival.vehicleAgeSeconds !== null) {
    const mins = Math.round(arrival.vehicleAgeSeconds / 60);
    parts.push(`This vehicle has not reported for ${mins} minutes; position uncertain.`);
  }
  if (arrival.bunchedWithNext) {
    parts.push(`Another ${arrival.routeName || arrival.routeId} is close behind.`);
  }
  return parts.join(' ');
}

/* ---------------------------------------------------------------- *
 * Spoken-form change summary (#6) — only meaningful deltas.
 * ---------------------------------------------------------------- */

export interface AnnounceState {
  seenKeys: Record<string, number | null>; // key -> last announced predictedMs
  vanishedKeys: string[];
}

export const EMPTY_ANNOUNCE_STATE: AnnounceState = { seenKeys: {}, vanishedKeys: [] };

function minutesLabel(ms: number | null, now: number): string {
  if (ms === null) return 'unknown';
  const mins = Math.round((ms - now) / 60_000);
  if (mins <= 0) return 'now';
  return `${mins} minute${mins === 1 ? '' : 's'}`;
}

/**
 * Compare the new insights with what was last announced and produce a short
 * sentence describing only what changed (slips ≥ 2 min, and dropped trips).
 * Returns `text: null` on the first call (nothing to compare against yet).
 */
export function describeChanges(
  previous: AnnounceState,
  insights: ArrivalInsights,
  now: number = Date.now(),
): { text: string | null; state: AnnounceState } {
  const nextSeen: Record<string, number | null> = {};
  const phrases: string[] = [];
  const isFirstRun = Object.keys(previous.seenKeys).length === 0;

  for (const arrival of insights.arrivals) {
    const predictedMs = parseMs(arrival.predictedTime);
    nextSeen[arrival.key] = predictedMs;
    if (isFirstRun) continue;

    const before = previous.seenKeys[arrival.key];
    if (before === undefined || before === null || predictedMs === null) continue;
    const shift = (predictedMs - before) / 1000;
    if (Math.abs(shift) < ANNOUNCE_SHIFT_SECONDS) continue;

    const label = arrival.routeName || arrival.routeId;
    const dest = arrival.headsign ? ` to ${arrival.headsign}` : '';
    phrases.push(
      `${label}${dest} now ${minutesLabel(predictedMs, now)}, was ${minutesLabel(before, now)}`,
    );
  }

  const vanishedKeys = insights.vanished.map((v) => v.key);
  for (const v of insights.vanished) {
    if (previous.vanishedKeys.includes(v.key)) continue;
    const label = v.routeName || v.routeId;
    const dest = v.headsign ? ` to ${v.headsign}` : '';
    phrases.push(`${label}${dest} is no longer listed`);
  }

  const state: AnnounceState = { seenKeys: nextSeen, vanishedKeys };
  const text = phrases.length === 0 ? null : `${phrases.slice(0, 3).join('. ')}.`;
  return { text, state };
}
