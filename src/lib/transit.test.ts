import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import type { Arrival } from '../types/transit';
import {
  FIXTURE_CASES,
  FIXTURE_NOW_MS,
  FIXTURE_STOP_A,
  FIXTURE_STOP_B,
  buildEmptyFixture,
  buildTripUpdatesFixture,
} from './__fixtures__/feed';
import {
  FeedDecodeError,
  ONTIME_THRESHOLD_SECONDS,
  PAST_ARRIVAL_GRACE_SECONDS,
  classifyDelay,
  decodeTripUpdates,
  extractArrivals,
  normalizeFeed,
  readFeedTimestamp,
} from './transit';

const now = FIXTURE_NOW_MS;

function stopA(options: Parameters<typeof extractArrivals>[2] = {}): Arrival[] {
  return extractArrivals(decodeTripUpdates(buildTripUpdatesFixture()), FIXTURE_STOP_A, { now, ...options });
}

describe('classifyDelay', () => {
  it('treats missing / non-finite delay as unknown', () => {
    expect(classifyDelay(null)).toBe('unknown');
    expect(classifyDelay(undefined)).toBe('unknown');
    expect(classifyDelay(Number.NaN)).toBe('unknown');
    expect(classifyDelay(Number.POSITIVE_INFINITY)).toBe('unknown');
  });

  it('is on time strictly inside +/- the threshold', () => {
    expect(classifyDelay(0)).toBe('ontime');
    expect(classifyDelay(ONTIME_THRESHOLD_SECONDS - 1)).toBe('ontime');
    expect(classifyDelay(-(ONTIME_THRESHOLD_SECONDS - 1))).toBe('ontime');
  });

  it('is late at exactly +threshold and beyond', () => {
    expect(classifyDelay(ONTIME_THRESHOLD_SECONDS)).toBe('late');
    expect(classifyDelay(ONTIME_THRESHOLD_SECONDS + 1)).toBe('late');
    expect(classifyDelay(3600)).toBe('late');
  });

  it('is early at exactly -threshold and beyond', () => {
    expect(classifyDelay(-ONTIME_THRESHOLD_SECONDS)).toBe('early');
    expect(classifyDelay(-(ONTIME_THRESHOLD_SECONDS + 1))).toBe('early');
    expect(classifyDelay(-3600)).toBe('early');
  });
});

describe('decodeTripUpdates', () => {
  it('decodes a populated feed into entities', () => {
    const feed = decodeTripUpdates(buildTripUpdatesFixture());
    expect(feed.entity).toHaveLength(FIXTURE_CASES.length);
  });

  it('decodes an empty feed into zero entities', () => {
    const feed = decodeTripUpdates(buildEmptyFixture());
    expect(feed.entity).toEqual([]);
  });

  it('throws FeedDecodeError on bytes that are not valid protobuf', () => {
    expect(() => decodeTripUpdates(new Uint8Array([0xff, 0xff, 0xff, 0xff, 0xff]))).toThrow(
      FeedDecodeError,
    );
  });

  it('decodes the committed .pb fixtures identically to the in-memory build', () => {
    const fromDisk = readFileSync(join(__dirname, '__fixtures__', 'trip-updates.pb'));
    expect(extractArrivals(decodeTripUpdates(new Uint8Array(fromDisk)), FIXTURE_STOP_A, { now })).toEqual(
      stopA(),
    );
  });
});

describe('readFeedTimestamp', () => {
  it('returns the feed header timestamp as ISO-8601', () => {
    expect(readFeedTimestamp(decodeTripUpdates(buildTripUpdatesFixture()))).toBe(
      new Date(FIXTURE_NOW_MS).toISOString(),
    );
  });

  it('returns null when there is no header timestamp', () => {
    expect(readFeedTimestamp({})).toBeNull();
    expect(readFeedTimestamp({ header: {} })).toBeNull();
  });
});

describe('normalizeFeed', () => {
  it('collapses alien input to an empty feed without throwing', () => {
    for (const bad of [null, undefined, 42, 'nope', [], {}, { entity: 'x' }, { entity: [1, 2] }]) {
      expect(extractArrivals(normalizeFeed(bad), FIXTURE_STOP_A, { now })).toEqual([]);
    }
  });

  it('reads snake_case feeds (raw proto / JSON shape)', () => {
    const snake = {
      entity: [
        {
          trip_update: {
            trip: { route_id: '2', trip_id: 't1', trip_headsign: 'Downtown' },
            stop_time_update: [{ stop_id: FIXTURE_STOP_A, arrival: { time: Math.floor(now / 1000) + 300, delay: 90 } }],
          },
        },
      ],
    };
    const [arrival] = extractArrivals(normalizeFeed(snake), FIXTURE_STOP_A, { now });
    expect(arrival).toMatchObject({ routeId: '2', headsign: 'Downtown', status: 'late', delaySeconds: 90 });
  });

  it('skips malformed / partial entities instead of throwing', () => {
    const partial = {
      entity: [{}, { tripUpdate: {} }, { tripUpdate: { stopTimeUpdate: [{}] } }, { tripUpdate: { stopTimeUpdate: null } }],
    };
    expect(extractArrivals(normalizeFeed(partial), FIXTURE_STOP_A, { now })).toEqual([]);
  });
});

describe('extractArrivals', () => {
  it('returns only the requested stop, sorted ascending by arrival time (nulls last)', () => {
    const arrivals = stopA();
    expect(arrivals.map((a) => a.routeId)).toEqual(['720', '720', '2', '4', '16']);

    const times = arrivals.map((a) => a.predictedTime);
    const present = times.filter((t): t is string => t !== null);
    expect(present).toEqual([...present].sort());
    expect(times.slice(present.length).every((t) => t === null)).toBe(true);
  });

  it('covers every delay status from the fixture', () => {
    const statuses = stopA().map((a) => a.status);
    expect(new Set(statuses)).toEqual(new Set(['late', 'ontime', 'early', 'unknown']));
  });

  it('emits null times for a delay-only update but still classifies it', () => {
    const delayOnly = stopA().find((a) => a.routeId === '16');
    expect(delayOnly).toMatchObject({ predictedTime: null, scheduledTime: null, delaySeconds: 300, status: 'late' });
  });

  it('derives scheduledTime = predictedTime - delay', () => {
    const late = stopA().find((a) => a.routeId === '720' && a.status === 'late');
    expect(late).toBeDefined();
    const predicted = Date.parse(late?.predictedTime ?? '');
    const scheduled = Date.parse(late?.scheduledTime ?? '');
    expect((predicted - scheduled) / 1000).toBe(late?.delaySeconds);
  });

  it('reports delaySeconds 0 and status unknown when the feed gives no delay', () => {
    const unknown = stopA().find((a) => a.status === 'unknown');
    expect(unknown).toMatchObject({ delaySeconds: 0, routeId: '4' });
  });

  it('excludes SKIPPED stop_time_updates even when includePast is set', () => {
    // e-skipped is 15 min out (18:15:00Z) and would otherwise survive both filters.
    const everything = stopA({ includePast: true });
    expect(everything.some((a) => a.predictedTime?.endsWith('18:15:00.000Z'))).toBe(false);
    const stopAOnStopA = FIXTURE_CASES.filter((c) => c.stopId === FIXTURE_STOP_A);
    expect(everything.length).toBe(stopAOnStopA.length - 1);
  });

  it('drops already-departed arrivals unless includePast is set', () => {
    expect(stopA()).toHaveLength(5);
    expect(stopA({ includePast: true })).toHaveLength(6);
    expect(stopA({ includePast: true }).some((a) => a.predictedTime?.endsWith('17:50:00.000Z'))).toBe(true);
  });

  it('respects the past grace window', () => {
    const feed = decodeTripUpdates(buildTripUpdatesFixture());
    const justInside = extractArrivals(feed, FIXTURE_STOP_A, {
      now: FIXTURE_NOW_MS - 600_000 + PAST_ARRIVAL_GRACE_SECONDS * 1000,
    });
    expect(justInside.some((a) => a.routeId === '720' && a.predictedTime?.endsWith('17:50:00.000Z'))).toBe(true);
  });

  it('isolates stops from one another', () => {
    const feed = decodeTripUpdates(buildTripUpdatesFixture());
    expect(extractArrivals(feed, FIXTURE_STOP_B, { now })).toHaveLength(1);
    expect(extractArrivals(feed, 'no-such-stop', { now })).toEqual([]);
    expect(extractArrivals(feed, '   ', { now })).toEqual([]);
    expect(extractArrivals(feed, '', { now })).toEqual([]);
  });

  it('enriches routeName and headsign from the supplied maps', () => {
    const feed = decodeTripUpdates(buildTripUpdatesFixture());
    const [first] = extractArrivals(feed, FIXTURE_STOP_A, {
      now,
      routeNames: { '720': 'Metro Rapid 720' },
      headsigns: { 't-late': 'Commerce' },
    });
    expect(first).toMatchObject({ routeName: 'Metro Rapid 720', headsign: 'Commerce' });
  });

  it('falls back to routeId, then a placeholder, for routeName', () => {
    expect(stopA()[0]?.routeName).toBe('720');
    const noRoute = extractArrivals(
      normalizeFeed({ entity: [{ tripUpdate: { stopTimeUpdate: [{ stopId: FIXTURE_STOP_A, arrival: { delay: 5 } }] } }] }),
      FIXTURE_STOP_A,
      { now },
    );
    expect(noRoute[0]?.routeName).toBe('Unknown route');
  });
});
