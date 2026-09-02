import { describe, expect, it } from 'vitest';

import type { Arrival } from '../types/transit';
import {
  arrivalSummary,
  delayLabel,
  formatAge,
  formatCountdown,
  minutesUntil,
  statusLabel,
} from './format';

const NOW = Date.UTC(2026, 0, 15, 12, 0, 0);
const iso = (offsetSeconds: number): string => new Date(NOW + offsetSeconds * 1000).toISOString();

describe('minutesUntil', () => {
  it('rounds to whole minutes', () => {
    expect(minutesUntil(iso(300), NOW)).toBe(5);
    expect(minutesUntil(iso(89), NOW)).toBe(1);
    expect(minutesUntil(iso(91), NOW)).toBe(2);
  });

  it('is negative for the past and null for no estimate', () => {
    expect(minutesUntil(iso(-600), NOW)).toBe(-10);
    expect(minutesUntil(null, NOW)).toBeNull();
    expect(minutesUntil('not-a-date', NOW)).toBeNull();
  });
});

describe('formatCountdown', () => {
  it('renders Due / 1 min / N min / No estimate', () => {
    expect(formatCountdown(iso(-30), NOW)).toBe('Due');
    expect(formatCountdown(iso(0), NOW)).toBe('Due');
    expect(formatCountdown(iso(60), NOW)).toBe('1 min');
    expect(formatCountdown(iso(465), NOW)).toBe('8 min');
    expect(formatCountdown(null, NOW)).toBe('No estimate');
  });
});

describe('statusLabel', () => {
  it('maps each status', () => {
    expect(statusLabel('early')).toBe('Early');
    expect(statusLabel('ontime')).toBe('On time');
    expect(statusLabel('late')).toBe('Late');
    expect(statusLabel('unknown')).toBe('No data');
  });
});

describe('delayLabel', () => {
  it('summarises the delay in minutes', () => {
    expect(delayLabel({ status: 'ontime', delaySeconds: 10 })).toBe('On time');
    expect(delayLabel({ status: 'unknown', delaySeconds: 0 })).toBe('No data');
    expect(delayLabel({ status: 'late', delaySeconds: 240 })).toBe('4 min late');
    expect(delayLabel({ status: 'early', delaySeconds: -150 })).toBe('3 min early');
    expect(delayLabel({ status: 'late', delaySeconds: 20 })).toBe('1 min late');
  });
});

describe('formatAge', () => {
  it('describes freshness', () => {
    expect(formatAge(NOW, NOW)).toBe('just now');
    expect(formatAge(NOW - 20_000, NOW)).toBe('20s ago');
    expect(formatAge(NOW - 180_000, NOW)).toBe('3m ago');
  });
});

describe('arrivalSummary', () => {
  it('builds a screen-reader sentence', () => {
    const arrival: Arrival = {
      routeId: '720',
      routeName: '720',
      headsign: 'Commerce',
      predictedTime: iso(300),
      scheduledTime: iso(60),
      delaySeconds: 240,
      status: 'late',
    };
    expect(arrivalSummary(arrival, NOW)).toBe('Route 720 to Commerce. 5 min. 4 min late.');
  });

  it('handles missing headsign', () => {
    const arrival: Arrival = {
      routeId: '2',
      routeName: '',
      headsign: '',
      predictedTime: null,
      scheduledTime: null,
      delaySeconds: 0,
      status: 'unknown',
    };
    expect(arrivalSummary(arrival, NOW)).toBe(
      'Route 2 to destination unavailable. No estimate. No data.',
    );
  });
});
