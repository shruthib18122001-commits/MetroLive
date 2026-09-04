/**
 * Pure decode / filter / shape logic for the LA Metro GTFS-realtime TripUpdates
 * feed. No React, no network, no `process` access — the serverless handler in
 * `/api/arrivals.ts` fetches bytes and delegates every transformation here.
 */
import GtfsRealtimeBindings from 'gtfs-realtime-bindings';

import type { Arrival, ArrivalStatus } from '../types/transit';

const { FeedMessage } = GtfsRealtimeBindings.transit_realtime;

/** A vehicle within this many seconds of schedule counts as "on time". */
export const ONTIME_THRESHOLD_SECONDS = 60;

/** Matched arrivals older than this (relative to `now`) are dropped by default. */
export const PAST_ARRIVAL_GRACE_SECONDS = 60;

/* -------------------------------------------------------------------------- *
 * Structural view of the slice of GTFS-realtime this app consumes. Kept
 * independent of the protobuf binding so the pure functions can be exercised
 * with plain object literals.
 * -------------------------------------------------------------------------- */

export interface StopTimeEventLike {
  time?: number | null;
  delay?: number | null;
}

export interface StopTimeUpdateLike {
  stopId?: string | null;
  stopSequence?: number | null;
  scheduleRelationship?: number | string | null;
  arrival?: StopTimeEventLike | null;
  departure?: StopTimeEventLike | null;
}

export interface TripDescriptorLike {
  tripId?: string | null;
  routeId?: string | null;
  directionId?: number | null;
  tripHeadsign?: string | null;
}

export interface VehicleDescriptorLike {
  id?: string | null;
}

export interface TripUpdateLike {
  trip?: TripDescriptorLike | null;
  vehicle?: VehicleDescriptorLike | null;
  stopTimeUpdate?: readonly StopTimeUpdateLike[] | null;
  delay?: number | null;
  timestamp?: number | null;
}

export interface FeedEntityLike {
  id?: string | null;
  tripUpdate?: TripUpdateLike | null;
}

export interface FeedHeaderLike {
  timestamp?: number | null;
}

export interface FeedMessageLike {
  header?: FeedHeaderLike | null;
  entity?: readonly FeedEntityLike[] | null;
}

export interface ExtractOptions {
  /** Milliseconds since epoch. Defaults to `Date.now()`; injected for deterministic tests. */
  now?: number;
  /** `routeId` -> display name. Realtime feeds carry no names; supply a map to enrich. */
  routeNames?: Readonly<Record<string, string>>;
  /** `tripId` -> headsign, for feeds that omit `trip_headsign`. */
  headsigns?: Readonly<Record<string, string>>;
  /** Keep arrivals whose predicted time is already in the past. Default `false`. */
  includePast?: boolean;
  /** Override {@link PAST_ARRIVAL_GRACE_SECONDS}. */
  pastGraceSeconds?: number;
}

/** Thrown when the upstream bytes are not a valid GTFS-realtime `FeedMessage`. */
export class FeedDecodeError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'FeedDecodeError';
  }
}

/** `StopTimeUpdate.ScheduleRelationship.SKIPPED` */
const SKIPPED_NUMERIC = 1;

/**
 * Bucket a delay (seconds; positive = late) into a status. `null`/`undefined`/
 * non-finite means the feed gave us no delay information.
 */
export function classifyDelay(delaySeconds: number | null | undefined): ArrivalStatus {
  if (delaySeconds === null || delaySeconds === undefined || !Number.isFinite(delaySeconds)) {
    return 'unknown';
  }
  if (delaySeconds <= -ONTIME_THRESHOLD_SECONDS) return 'early';
  if (delaySeconds >= ONTIME_THRESHOLD_SECONDS) return 'late';
  return 'ontime';
}

/** protobuf.js encodes 64-bit ints as `number`, `Long`, or occasionally a string. */
function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (typeof value === 'object' && 'toNumber' in value) {
    const maybeFn = (value as { toNumber: unknown }).toNumber;
    if (typeof maybeFn === 'function') {
      try {
        const n: unknown = maybeFn.call(value);
        return typeof n === 'number' && Number.isFinite(n) ? n : null;
      } catch {
        return null;
      }
    }
  }
  return null;
}

function toIso(ms: number | null): string | null {
  if (ms === null || !Number.isFinite(ms)) return null;
  return new Date(ms).toISOString();
}

function isSkipped(rel: number | string | null | undefined): boolean {
  return rel === SKIPPED_NUMERIC || rel === 'SKIPPED';
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

function readString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

/** Read a field that may be camelCase (JS binding) or snake_case (raw proto / JSON). */
function pick(record: Record<string, unknown>, camel: string, snake: string): unknown {
  return record[camel] ?? record[snake];
}

function normalizeEvent(raw: unknown): StopTimeEventLike | null {
  if (raw === null || raw === undefined) return null;
  const r = asRecord(raw);
  return { time: toNumberOrNull(r.time), delay: toNumberOrNull(r.delay) };
}

function normalizeTrip(raw: unknown): TripDescriptorLike {
  const r = asRecord(raw);
  return {
    tripId: readString(pick(r, 'tripId', 'trip_id')),
    routeId: readString(pick(r, 'routeId', 'route_id')),
    directionId: toNumberOrNull(pick(r, 'directionId', 'direction_id')),
    tripHeadsign: readString(pick(r, 'tripHeadsign', 'trip_headsign')),
  };
}

function normalizeStopTimeUpdate(raw: unknown): StopTimeUpdateLike {
  const r = asRecord(raw);
  const rel = pick(r, 'scheduleRelationship', 'schedule_relationship');
  return {
    stopId: readString(pick(r, 'stopId', 'stop_id')),
    stopSequence: toNumberOrNull(pick(r, 'stopSequence', 'stop_sequence')),
    scheduleRelationship: typeof rel === 'number' || typeof rel === 'string' ? rel : null,
    arrival: normalizeEvent(r.arrival),
    departure: normalizeEvent(r.departure),
  };
}

function normalizeTripUpdate(raw: unknown): TripUpdateLike {
  const r = asRecord(raw);
  const stopTimeUpdates = pick(r, 'stopTimeUpdate', 'stop_time_update');
  const vehicle = asRecord(r.vehicle);
  return {
    trip: normalizeTrip(r.trip),
    vehicle: { id: readString(vehicle.id) },
    stopTimeUpdate: Array.isArray(stopTimeUpdates)
      ? stopTimeUpdates.map(normalizeStopTimeUpdate)
      : [],
    delay: toNumberOrNull(r.delay),
    timestamp: toNumberOrNull(r.timestamp),
  };
}

function normalizeEntity(raw: unknown): FeedEntityLike {
  const r = asRecord(raw);
  const tripUpdate = pick(r, 'tripUpdate', 'trip_update');
  return {
    id: readString(r.id),
    tripUpdate:
      tripUpdate === null || tripUpdate === undefined ? null : normalizeTripUpdate(tripUpdate),
  };
}

/**
 * Coerce anything shaped like a decoded `FeedMessage` (protobuf binding output,
 * hand-built fixture, JSON feed) into a clean {@link FeedMessageLike}. Never
 * throws — unrecognized shapes collapse to an empty feed.
 */
export function normalizeFeed(raw: unknown): FeedMessageLike {
  const r = asRecord(raw);
  const header = asRecord(r.header);
  const entities = Array.isArray(r.entity) ? r.entity : [];
  return {
    header: { timestamp: toNumberOrNull(header.timestamp) },
    entity: entities.map(normalizeEntity),
  };
}

/**
 * Decode raw protobuf bytes from the TripUpdates feed. Throws
 * {@link FeedDecodeError} if the bytes are not a valid `FeedMessage`.
 *
 * `toObject({ defaults: false })` is what lets us tell "no delay reported"
 * (field absent) apart from "exactly on time" (delay === 0) — a raw decoded
 * message exposes proto2 scalar defaults instead.
 */
export function decodeTripUpdates(bytes: Uint8Array): FeedMessageLike {
  let plain: unknown;
  try {
    const message = FeedMessage.decode(bytes);
    plain = FeedMessage.toObject(message, {
      longs: Number,
      enums: String,
      defaults: false,
    });
  } catch (err) {
    throw new FeedDecodeError('Could not decode GTFS-realtime FeedMessage', { cause: err });
  }
  return normalizeFeed(plain);
}

/** The feed's own "generated at" timestamp as ISO-8601, or `null` if absent. */
export function readFeedTimestamp(feed: FeedMessageLike): string | null {
  const seconds = feed.header?.timestamp ?? null;
  return seconds === null ? null : toIso(seconds * 1000);
}

function resolveHeadsign(
  trip: TripDescriptorLike,
  headsigns: Readonly<Record<string, string>>,
): string {
  const tripId = trip.tripId ?? '';
  const mapped = tripId === '' ? undefined : headsigns[tripId];
  if (mapped !== undefined && mapped !== '') return mapped;
  return (trip.tripHeadsign ?? '').trim();
}

function compareArrivals(a: Arrival, b: Arrival): number {
  const at = a.predictedTime ?? a.scheduledTime;
  const bt = b.predictedTime ?? b.scheduledTime;
  if (at === bt) return a.routeName.localeCompare(b.routeName);
  if (at === null) return 1;
  if (bt === null) return -1;
  return at < bt ? -1 : 1;
}

/**
 * Reduce a decoded feed to the arrivals for one stop: match `stop_time_update`s
 * by `stopId`, drop SKIPPED and (by default) already-departed entries, and
 * shape each into an {@link Arrival}. Result is sorted ascending by arrival time,
 * nulls last.
 */
export function extractArrivals(
  feed: FeedMessageLike,
  stopId: string,
  options: ExtractOptions = {},
): Arrival[] {
  const targetStopId = stopId.trim();
  if (targetStopId === '') return [];

  const now = options.now ?? Date.now();
  const includePast = options.includePast ?? false;
  const graceMs = (options.pastGraceSeconds ?? PAST_ARRIVAL_GRACE_SECONDS) * 1000;
  const routeNames = options.routeNames ?? {};
  const headsigns = options.headsigns ?? {};

  const arrivals: Arrival[] = [];

  for (const entity of feed.entity ?? []) {
    const tripUpdate = entity.tripUpdate;
    if (!tripUpdate) continue;

    const trip: TripDescriptorLike = tripUpdate.trip ?? {};
    const routeId = (trip.routeId ?? '').trim();
    const tripId = (trip.tripId ?? '').trim();
    const vehicleId = (tripUpdate.vehicle?.id ?? '').trim() || null;
    const tripDelay = toNumberOrNull(tripUpdate.delay);
    const vehicleTimestamp = toIso(
      tripUpdate.timestamp === null || tripUpdate.timestamp === undefined
        ? null
        : tripUpdate.timestamp * 1000,
    );

    for (const stu of tripUpdate.stopTimeUpdate ?? []) {
      if ((stu.stopId ?? '').trim() !== targetStopId) continue;
      if (isSkipped(stu.scheduleRelationship)) continue;

      const event = stu.arrival ?? stu.departure ?? null;
      const timeSeconds = event ? toNumberOrNull(event.time) : null;
      const eventDelay = event ? toNumberOrNull(event.delay) : null;
      const delaySeconds = eventDelay ?? tripDelay;

      const predictedMs = timeSeconds === null ? null : timeSeconds * 1000;
      if (!includePast && predictedMs !== null && predictedMs < now - graceMs) continue;

      const scheduledMs =
        predictedMs !== null && delaySeconds !== null
          ? predictedMs - delaySeconds * 1000
          : predictedMs;

      arrivals.push({
        routeId,
        routeName: routeNames[routeId] ?? (routeId === '' ? 'Unknown route' : routeId),
        headsign: resolveHeadsign(trip, headsigns),
        scheduledTime: toIso(scheduledMs),
        predictedTime: toIso(predictedMs),
        delaySeconds: delaySeconds ?? 0,
        status: classifyDelay(delaySeconds),
        tripId: tripId || undefined,
        vehicleId,
        stopSequence: stu.stopSequence ?? null,
        vehicleTimestamp,
      });
    }
  }

  arrivals.sort(compareArrivals);
  return arrivals;
}
