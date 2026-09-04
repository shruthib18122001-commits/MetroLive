import { describe, expect, it } from 'vitest';

import type { Arrival } from '../types/transit';
import {
  EMPTY_ANNOUNCE_STATE,
  computeInsights,
  describeChanges,
} from './insights';
import type { ArrivalHistory } from './insights';

const NOW = Date.UTC(2026, 0, 15, 12, 0, 0);
const iso = (offsetSeconds: number, from = NOW): string =>
  new Date(from + offsetSeconds * 1000).toISOString();

function arrival(over: Partial<Arrival> = {}): Arrival {
  return {
    routeId: '720',
    routeName: '720',
    headsign: 'Commerce',
    scheduledTime: iso(300),
    predictedTime: iso(300),
    delaySeconds: 0,
    status: 'ontime',
    tripId: 't1',
    vehicleId: 'v1',
    stopSequence: 12,
    vehicleTimestamp: iso(-15),
    ...over,
  };
}

/** Run `computeInsights` across a series of polls, threading history. */
function poll(polls: { at: number; arrivals: Arrival[]; feedTimestamp?: string | null }[]) {
  let history: ArrivalHistory = {};
  let last = computeInsights(history, [], { now: polls[0]?.at });
  for (const p of polls) {
    last = computeInsights(history, p.arrivals, { now: p.at, feedTimestamp: p.feedTimestamp });
    history = last.history;
  }
  return last;
}

describe('computeInsights — trend (#1)', () => {
  it('is unknown on the first poll and steady when the prediction holds', () => {
    const first = computeInsights({}, [arrival({ predictedTime: iso(300) })], { now: NOW });
    expect(first.insights.arrivals[0]?.trend.direction).toBe('unknown');

    const { insights } = poll([
      { at: NOW, arrivals: [arrival({ predictedTime: iso(300) })] },
      { at: NOW + 30_000, arrivals: [arrival({ predictedTime: iso(305) })] },
      { at: NOW + 60_000, arrivals: [arrival({ predictedTime: iso(300) })] },
    ]);
    expect(insights.arrivals[0]?.trend.direction).toBe('steady');
  });

  it('reports "later" when the predicted arrival slips past the threshold', () => {
    const { insights } = poll([
      { at: NOW, arrivals: [arrival({ predictedTime: iso(300) })] },
      { at: NOW + 60_000, arrivals: [arrival({ predictedTime: iso(400) })] },
    ]);
    const t = insights.arrivals[0]?.trend;
    expect(t?.direction).toBe('later');
    expect(t?.shiftSeconds).toBe(100);
  });

  it('reports "earlier" when the predicted arrival is pulled in', () => {
    const { insights } = poll([
      { at: NOW, arrivals: [arrival({ predictedTime: iso(600) })] },
      { at: NOW + 60_000, arrivals: [arrival({ predictedTime: iso(480) })] },
    ]);
    expect(insights.arrivals[0]?.trend.direction).toBe('earlier');
    expect(insights.arrivals[0]?.trend.shiftSeconds).toBe(-120);
  });
});

describe('computeInsights — ghost bus (#2)', () => {
  const stillComing = arrival({ tripId: 'ghost', predictedTime: iso(240) });

  it('flags a trip that was due and then dropped from the feed', () => {
    const { insights } = poll([
      { at: NOW, arrivals: [stillComing, arrival({ tripId: 'other', predictedTime: iso(600) })] },
      { at: NOW + 30_000, arrivals: [arrival({ tripId: 'other', predictedTime: iso(600) })] },
    ]);
    expect(insights.vanished.map((v) => v.key)).toEqual(['trip:ghost']);
    expect(insights.vanished[0]?.wasMinutesAway).toBe(4);
  });

  it('does NOT flag a trip whose predicted time had essentially arrived', () => {
    const { insights } = poll([
      { at: NOW, arrivals: [arrival({ tripId: 'departing', predictedTime: iso(20) })] },
      { at: NOW + 30_000, arrivals: [] },
    ]);
    expect(insights.vanished).toEqual([]);
  });

  it('forgets a vanished trip after the memory window', () => {
    const { insights } = poll([
      { at: NOW, arrivals: [arrival({ tripId: 'ghost', predictedTime: iso(240) })] },
      { at: NOW + 30_000, arrivals: [] },
      { at: NOW + 5 * 60_000, arrivals: [] },
    ]);
    expect(insights.vanished).toEqual([]);
  });
});

describe('computeInsights — feed & vehicle staleness (#3)', () => {
  it('computes feed age and flags a stale feed', () => {
    const fresh = computeInsights({}, [arrival()], { now: NOW, feedTimestamp: iso(-30) });
    expect(fresh.insights.feedAgeSeconds).toBe(30);
    expect(fresh.insights.feedStale).toBe(false);

    const stale = computeInsights({}, [arrival()], { now: NOW, feedTimestamp: iso(-200) });
    expect(stale.insights.feedStale).toBe(true);
  });

  it('flags a vehicle that has not reported in over five minutes', () => {
    const { insights } = computeInsights(
      {},
      [
        arrival({ tripId: 'fresh', vehicleTimestamp: iso(-20) }),
        arrival({ tripId: 'dark', vehicleTimestamp: iso(-400) }),
      ],
      { now: NOW },
    );
    const byTrip = Object.fromEntries(insights.arrivals.map((a) => [a.tripId, a]));
    expect(byTrip.fresh?.vehicleStale).toBe(false);
    expect(byTrip.dark?.vehicleStale).toBe(true);
    expect(byTrip.dark?.vehicleAgeSeconds).toBe(400);
  });
});

describe('computeInsights — bunching & gaps (#5)', () => {
  it('marks a same-route pair that arrives close together', () => {
    const { insights } = computeInsights(
      {},
      [
        arrival({ tripId: 'a', routeId: '4', routeName: '4', predictedTime: iso(180) }),
        arrival({ tripId: 'b', routeId: '4', routeName: '4', predictedTime: iso(270) }),
        arrival({ tripId: 'c', routeId: '2', routeName: '2', predictedTime: iso(900) }),
      ],
      { now: NOW },
    );
    expect(insights.arrivals[0]?.bunchedWithNext).toBe(true);
    expect(insights.arrivals[1]?.bunchedWithPrev).toBe(true);
    expect(insights.arrivals[2]?.bunchedWithNext).toBe(false);
  });

  it('flags a long gap after a soon-ish arrival', () => {
    const { insights } = computeInsights(
      {},
      [
        arrival({ tripId: 'a', predictedTime: iso(300) }),
        arrival({ tripId: 'b', predictedTime: iso(300 + 25 * 60) }),
      ],
      { now: NOW },
    );
    expect(insights.arrivals[0]?.longGapAfterMinutes).toBe(25);
    expect(insights.arrivals[1]?.longGapAfterMinutes).toBeNull();
  });
});

describe('describeChanges (#6)', () => {
  it('says nothing on the first run', () => {
    const { insights } = computeInsights({}, [arrival()], { now: NOW });
    const { text } = describeChanges(EMPTY_ANNOUNCE_STATE, insights, NOW);
    expect(text).toBeNull();
  });

  it('announces a big slip and a dropped trip, but stays quiet on small moves', () => {
    const p1 = computeInsights(
      {},
      [
        arrival({ tripId: 'slip', headsign: 'Commerce', predictedTime: iso(180) }),
        arrival({ tripId: 'gone', routeName: '4', headsign: 'Downtown', predictedTime: iso(240) }),
        arrival({ tripId: 'calm', routeName: '2', headsign: 'Elsewhere', predictedTime: iso(600) }),
      ],
      { now: NOW },
    );
    const seed = describeChanges(EMPTY_ANNOUNCE_STATE, p1.insights, NOW);

    const p2 = computeInsights(
      p1.history,
      [
        arrival({ tripId: 'slip', headsign: 'Commerce', predictedTime: iso(360) }), // +3 min
        arrival({ tripId: 'calm', routeName: '2', headsign: 'Elsewhere', predictedTime: iso(630) }), // +30s
      ],
      { now: NOW + 30_000 },
    );
    const { text } = describeChanges(seed.state, p2.insights, NOW + 30_000);

    expect(text).toContain('720 to Commerce now');
    expect(text).toContain('4 to Downtown is no longer listed');
    expect(text).not.toContain('2 to Elsewhere');
  });
});
