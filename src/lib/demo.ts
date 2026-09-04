/**
 * Deterministic synthetic arrivals for demo mode — used by `/api/arrivals` when
 * no `SWIFTLY_API_KEY` is configured. Pure and stateless: the board is anchored
 * to a 10-minute grid so predicted times stay put while the countdown ticks
 * down (which is what makes the "trend" feature meaningful).
 *
 * Roles are assigned so every realtime insight has something to show:
 *   trip 0        wobbles hard           → prediction trend (#1)
 *   trip 1        vehicle went dark       → per-vehicle staleness (#3)
 *   trip 2        appears / disappears    → ghost-bus detection (#2)
 *   trips 3 & 4   same route, ~70s apart  → bunching (#5)
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

const DELAY_CHOICES = [-240, -90, -60, 0, 0, 30, 75, 150] as const;
const GRID_MS = 600_000;

function hash(input: string): number {
  let h = 2_166_136_261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16_777_619);
  }
  return h >>> 0;
}

function pick<T>(list: readonly T[], index: number): T {
  return list[((index % list.length) + list.length) % list.length] as T;
}

export function synthesizeArrivals(stopId: string, now: number = Date.now()): Arrival[] {
  const seed = hash(stopId);
  const count = 5 + (seed % 2); // 5–6 trips
  const gridBase = Math.floor(now / GRID_MS) * GRID_MS + GRID_MS; // next 10-minute mark
  const GHOST_INDEX = 2;
  // Ghost trip is present ~1 minute in 3, gone the other 2.
  const ghostHidden = Math.floor(now / 60_000) % 3 !== 0;

  const arrivals: Arrival[] = [];
  let cumulativeOffsetMs = 40_000 + (seed % 3) * 30_000;

  for (let i = 0; i < count; i += 1) {
    // Trip 4 shares trip 3's route and sits close behind it (a bunched pair).
    const route = i === 4 ? pick(DEMO_ROUTES, seed + 3 * 3) : pick(DEMO_ROUTES, seed + i * 3);
    const gapMs =
      i === 4 ? 70_000 : i === GHOST_INDEX ? 120_000 : 90_000 + ((seed >>> (i + 1)) % 5) * 40_000;
    cumulativeOffsetMs += gapMs;

    if (i === GHOST_INDEX && ghostHidden) continue;

    // Trip 0 wobbles hard (so the trend flips early/late); the rest barely move.
    const wobbleSeconds = Math.round((i === 0 ? 150 : 25) * Math.sin(now / 90_000 + seed + i * 1.3));
    const delaySeconds = pick(DELAY_CHOICES, seed + i * 5) + wobbleSeconds;

    let predictedMs = gridBase + cumulativeOffsetMs + wobbleSeconds * 1000;
    predictedMs = Math.max(predictedMs, now + 30_000);
    const scheduledMs = predictedMs - delaySeconds * 1000;

    // Trip 1's vehicle went dark ~6.5 minutes ago; everyone else reported seconds ago.
    const vehicleReportedMs = i === 1 ? now - 392_000 : now - (10_000 + (seed % 25) * 1000);

    arrivals.push({
      routeId: route.routeId,
      routeName: route.routeName,
      headsign: route.headsign,
      predictedTime: new Date(predictedMs).toISOString(),
      scheduledTime: new Date(scheduledMs).toISOString(),
      delaySeconds,
      status: classifyDelay(delaySeconds),
      tripId: `demo-${stopId}-${i}`,
      vehicleId: `demo-veh-${stopId}-${i}`,
      stopSequence: 12 + i,
      vehicleTimestamp: new Date(vehicleReportedMs).toISOString(),
    });
  }

  arrivals.sort((a, b) => (a.predictedTime ?? '~').localeCompare(b.predictedTime ?? '~'));
  return arrivals;
}
