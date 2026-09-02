import { describe, expect, it } from 'vitest';

import type { StopSummary } from '../types/transit';
import { findStopById, normalizeQuery, searchStops } from './stops';

const STOPS: StopSummary[] = [
  { id: '80122', name: '7th Street / Metro Center Station - Metro A & E Lines', lat: 34.04861, lon: -118.25882 },
  { id: '80211', name: '7th Street / Metro Center Station - Metro B & D Lines', lat: 34.04863, lon: -118.25868 },
  { id: '3', name: 'Jefferson / 10th', lat: 34.02547, lon: -118.3284 },
  { id: '5307', name: 'Long Beach / 10th', lat: 33.9, lon: -118.1 },
  { id: '80409', name: 'Union Station - Metro A-Line', lat: 34.05606, lon: -118.23476 },
  { id: '999', name: 'Vermont / Sunset', lat: 34.09, lon: -118.29 },
];

describe('normalizeQuery', () => {
  it('trims, lower-cases, and collapses whitespace', () => {
    expect(normalizeQuery('  Union   STATION ')).toBe('union station');
  });
});

describe('searchStops', () => {
  it('returns nothing for queries shorter than two characters', () => {
    expect(searchStops(STOPS, '')).toEqual([]);
    expect(searchStops(STOPS, 'u')).toEqual([]);
    expect(searchStops(STOPS, '  ')).toEqual([]);
  });

  it('requires every term to appear in the name (AND match)', () => {
    expect(searchStops(STOPS, 'metro center').map((s) => s.id)).toEqual(['80122', '80211']);
    expect(searchStops(STOPS, 'metro nonexistent')).toEqual([]);
  });

  it('ranks exact and prefix matches ahead of interior matches', () => {
    const ids = searchStops(STOPS, '10th').map((s) => s.id);
    expect(ids).toContain('3');
    expect(ids).toContain('5307');

    const jefferson = searchStops(STOPS, 'jefferson');
    expect(jefferson[0]?.id).toBe('3');
  });

  it('is case-insensitive', () => {
    expect(searchStops(STOPS, 'UNION station').map((s) => s.id)).toEqual(['80409']);
  });

  it('honours the result limit', () => {
    expect(searchStops(STOPS, 'metro', 1)).toHaveLength(1);
  });
});

describe('findStopById', () => {
  it('finds an exact id or returns null', () => {
    expect(findStopById(STOPS, '3')?.name).toBe('Jefferson / 10th');
    expect(findStopById(STOPS, ' 3 ')?.id).toBe('3');
    expect(findStopById(STOPS, 'nope')).toBeNull();
    expect(findStopById(STOPS, '')).toBeNull();
  });
});
