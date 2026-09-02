/**
 * Deterministic synthetic arrivals for demo mode — used by `/api/arrivals` when
 * no `SWIFTLY_API_KEY` is configured, so the whole app is explorable without a
 * Swiftly credential. Pure; same output shape as the live path.
 */
import type { Arrival } from '../types/transit';
import { classifyDelay } from './transit';

interface DemoRoute {
  routeId: string;
  routeName: string;
  headsign: string;
}

const DEMO_ROUTES: readonly DemoRoute[] = [
  { routeId: '720', routeName: '720', headsign: 'Commerce / Montebello' },
  { routeId: '2', routeName: '2', headsign: 'Downtown LA' },
  { routeId: '4', routeName: '4', headsign: 'Downtown LA' },
  { routeId: '733', routeName: '733', headsign: 'Venice / Downtown' },
  { routeId: '801', routeName: 'A Line', headsign: 'APU / Citrus College' },
  { routeId: '802', routeName: 'B Line', headsign: 'North Hollywood' },
  { routeId: '910', routeName: 'J Line', headsign: 'San Pedro' },
];

const DELAY_CHOICES = [-240, -90, -60, 0, 0, 30, 75, 150, 300] as const;

/** FNV-1a — small, stable string hash so a stop always shows the same board. */
function hash(input: string): number {
  let h = 2_166_136_261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16_777_619);
  }
  return h >>> 0;
}

function pick<T>(list: readonly T[], index: number): T {
  const item = list[((index % list.length) + list.length) % list.length];
  // list is non-empty by construction
  return item as T;
}

export function synthesizeArrivals(stopId: string, now: number = Date.now()): Arrival[] {
  const seed = hash(stopId);
  const count = 3 + (seed % 4); // 3..6 arrivals
  const arrivals: Arrival[] = [];
  let offsetMs = 60_000 + (seed % 5) * 45_000;

  for (let i = 0; i < count; i += 1) {
    const route = pick(DEMO_ROUTES, seed + i * 3);
    offsetMs += 150_000 + ((seed >>> (i + 1)) % 9) * 60_000;
    const predictedMs = now + offsetMs;
    const delaySeconds = pick(DELAY_CHOICES, seed + i * 5);

    arrivals.push({
      routeId: route.routeId,
      routeName: route.routeName,
      headsign: route.headsign,
      predictedTime: new Date(predictedMs).toISOString(),
      scheduledTime: new Date(predictedMs - delaySeconds * 1_000).toISOString(),
      delaySeconds,
      status: classifyDelay(delaySeconds),
    });
  }

  return arrivals;
}
