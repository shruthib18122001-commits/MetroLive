import { describe, expect, it } from 'vitest';

import { synthesizeArrivals } from './demo';

const NOW = Date.UTC(2026, 5, 1, 17, 30, 0);
const VALID_STATUSES = new Set(['early', 'ontime', 'late', 'unknown']);

describe('synthesizeArrivals', () => {
  it('is deterministic per stop id', () => {
    expect(synthesizeArrivals('80122', NOW)).toEqual(synthesizeArrivals('80122', NOW));
  });

  it('varies by stop id', () => {
    expect(synthesizeArrivals('80122', NOW)).not.toEqual(synthesizeArrivals('5307', NOW));
  });

  it('always returns 3–6 future arrivals, ascending by predicted time', () => {
    for (const id of ['1', '80122', 'abc', '13123', '5307', 'zzz-999']) {
      const arrivals = synthesizeArrivals(id, NOW);
      expect(arrivals.length).toBeGreaterThanOrEqual(3);
      expect(arrivals.length).toBeLessThanOrEqual(6);

      const times = arrivals.map((a) => Date.parse(a.predictedTime ?? ''));
      expect(times.every((t) => t > NOW)).toBe(true);
      expect([...times].sort((a, b) => a - b)).toEqual(times);
    }
  });

  it('produces well-formed arrivals whose status matches the delay', () => {
    for (const arrival of synthesizeArrivals('union', NOW)) {
      expect(VALID_STATUSES.has(arrival.status)).toBe(true);
      expect(typeof arrival.routeName).toBe('string');
      expect(arrival.headsign.length).toBeGreaterThan(0);
      const predicted = Date.parse(arrival.predictedTime ?? '');
      const scheduled = Date.parse(arrival.scheduledTime ?? '');
      expect(Math.round((predicted - scheduled) / 1000)).toBe(arrival.delaySeconds);
    }
  });
});
