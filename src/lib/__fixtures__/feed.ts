/**
 * Synthetic GTFS-realtime TripUpdates fixtures, encoded with the real
 * `gtfs-realtime-bindings` protobuf schema (so `decodeTripUpdates` exercises the
 * genuine wire format). Content is fabricated pending a live Swiftly API key.
 *
 * `scripts/make-fixtures.ts` writes these to `.pb` files next to this module.
 */
import GtfsRealtimeBindings from 'gtfs-realtime-bindings';

const { FeedMessage } = GtfsRealtimeBindings.transit_realtime;

/** The "wall clock" every fixture arrival is offset from: 2026-01-15T18:00:00Z. */
export const FIXTURE_NOW_MS = Date.UTC(2026, 0, 15, 18, 0, 0);
const NOW_S = Math.floor(FIXTURE_NOW_MS / 1000);

export const FIXTURE_STOP_A = '80122';
export const FIXTURE_STOP_B = '5307';

export interface FixtureCase {
  entityId: string;
  tripId: string;
  routeId: string;
  stopId: string;
  /** Arrival time as an offset from {@link FIXTURE_NOW_MS}, in seconds. */
  arrivalOffsetSeconds: number;
  /** `arrival.delay` in seconds, or `null` to omit it entirely. */
  delaySeconds: number | null;
  /** Emit `schedule_relationship = SKIPPED`. */
  skipped?: boolean;
  /** Omit `arrival.time` (delay-only update). */
  omitTime?: boolean;
  expectedStatus: 'early' | 'ontime' | 'late' | 'unknown';
  /** Whether this case appears in `extractArrivals(feed, FIXTURE_STOP_A, { now })`. */
  visibleForStopA: boolean;
}

export const FIXTURE_CASES: readonly FixtureCase[] = [
  {
    entityId: 'e-late',
    tripId: 't-late',
    routeId: '720',
    stopId: FIXTURE_STOP_A,
    arrivalOffsetSeconds: 300,
    delaySeconds: 240,
    expectedStatus: 'late',
    visibleForStopA: true,
  },
  {
    entityId: 'e-ontime',
    tripId: 't-ontime',
    routeId: '720',
    stopId: FIXTURE_STOP_A,
    arrivalOffsetSeconds: 420,
    delaySeconds: 15,
    expectedStatus: 'ontime',
    visibleForStopA: true,
  },
  {
    entityId: 'e-early',
    tripId: 't-early',
    routeId: '2',
    stopId: FIXTURE_STOP_A,
    arrivalOffsetSeconds: 600,
    delaySeconds: -120,
    expectedStatus: 'early',
    visibleForStopA: true,
  },
  {
    entityId: 'e-unknown',
    tripId: 't-unknown',
    routeId: '4',
    stopId: FIXTURE_STOP_A,
    arrivalOffsetSeconds: 720,
    delaySeconds: null,
    expectedStatus: 'unknown',
    visibleForStopA: true,
  },
  {
    entityId: 'e-notime',
    tripId: 't-notime',
    routeId: '16',
    stopId: FIXTURE_STOP_A,
    arrivalOffsetSeconds: 0,
    delaySeconds: 300,
    omitTime: true,
    expectedStatus: 'late',
    visibleForStopA: true,
  },
  {
    entityId: 'e-skipped',
    tripId: 't-skipped',
    routeId: '720',
    stopId: FIXTURE_STOP_A,
    arrivalOffsetSeconds: 900,
    delaySeconds: 0,
    skipped: true,
    expectedStatus: 'ontime',
    visibleForStopA: false,
  },
  {
    entityId: 'e-past',
    tripId: 't-past',
    routeId: '720',
    stopId: FIXTURE_STOP_A,
    arrivalOffsetSeconds: -600,
    delaySeconds: 60,
    expectedStatus: 'late',
    visibleForStopA: false,
  },
  {
    entityId: 'e-otherstop',
    tripId: 't-otherstop',
    routeId: '10',
    stopId: FIXTURE_STOP_B,
    arrivalOffsetSeconds: 200,
    delaySeconds: 30,
    expectedStatus: 'ontime',
    visibleForStopA: false,
  },
];

function toStopTimeUpdate(testCase: FixtureCase): Record<string, unknown> {
  const arrival: Record<string, unknown> = {};
  if (!testCase.omitTime) arrival.time = NOW_S + testCase.arrivalOffsetSeconds;
  if (testCase.delaySeconds !== null) arrival.delay = testCase.delaySeconds;
  return {
    stopId: testCase.stopId,
    scheduleRelationship: testCase.skipped === true ? 1 : 0,
    arrival,
  };
}

function toPayload(cases: readonly FixtureCase[]): Record<string, unknown> {
  return {
    header: { gtfsRealtimeVersion: '2.0', incrementality: 0, timestamp: NOW_S },
    entity: cases.map((testCase) => ({
      id: testCase.entityId,
      tripUpdate: {
        trip: { tripId: testCase.tripId, routeId: testCase.routeId, scheduleRelationship: 0 },
        stopTimeUpdate: [toStopTimeUpdate(testCase)],
      },
    })),
  };
}

/** A populated, valid TripUpdates feed covering every branch of `extractArrivals`. */
export function buildTripUpdatesFixture(): Uint8Array {
  const message = FeedMessage.fromObject(toPayload(FIXTURE_CASES));
  return FeedMessage.encode(message).finish();
}

/** A valid feed with a header but zero entities. */
export function buildEmptyFixture(): Uint8Array {
  const message = FeedMessage.fromObject({
    header: { gtfsRealtimeVersion: '2.0', incrementality: 0, timestamp: NOW_S },
    entity: [],
  });
  return FeedMessage.encode(message).finish();
}

/** Bytes that are not a valid protobuf message at all. */
export const NOT_PROTOBUF_BYTES = new Uint8Array([0xff, 0xff, 0xff, 0xff, 0xff, 0x00, 0x13, 0x37]);
