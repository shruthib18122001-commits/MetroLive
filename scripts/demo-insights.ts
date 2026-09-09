/**
 * Simulates ~12 successive `/api/arrivals` polls of demo data through the real
 * `computeInsights` pipeline and prints what each realtime feature detects —
 * so you can see trend / ghost-bus / staleness / bunching / announcer working
 * without watching the browser for several minutes.
 *
 *   npm run demo:insights            # stop 80122, 40s between polls
 *   npm run demo:insights -- 5307 30 # another stop, 30s cadence
 */
import { synthesizeArrivals } from '../src/lib/demo';
import {
  EMPTY_ANNOUNCE_STATE,
  computeInsights,
  describeChanges,
} from '../src/lib/insights';
import type { ArrivalHistory } from '../src/lib/insights';

const stopId = process.argv[2] ?? '80122';
const cadenceSeconds = Number(process.argv[3] ?? 40);
const start = Date.UTC(2026, 8, 8, 17, 30, 7);

let history: ArrivalHistory = {};
let announce = EMPTY_ANNOUNCE_STATE;

console.log(`stop ${stopId} — ${cadenceSeconds}s between polls\n`);

for (let poll = 0; poll < 12; poll += 1) {
  const now = start + poll * cadenceSeconds * 1000;
  const arrivals = synthesizeArrivals(stopId, now);
  const feedTimestamp = new Date(now - 4_000).toISOString();

  const { history: nextHistory, insights } = computeInsights(history, arrivals, {
    now,
    feedTimestamp,
  });
  history = nextHistory;

  const spoken = describeChanges(announce, insights, now);
  announce = spoken.state;

  const trend = insights.arrivals
    .filter((a) => a.trend.direction === 'later' || a.trend.direction === 'earlier')
    .map((a) => `${a.routeName} ${a.trend.direction} ${Math.round(a.trend.shiftSeconds / 60)}m`);
  const stale = insights.arrivals
    .filter((a) => a.vehicleStale)
    .map((a) => `${a.routeName} (${a.vehicleAgeSeconds}s)`);
  const bunched = insights.arrivals.filter((a) => a.bunchedWithNext).map((a) => a.routeName);
  const gap = insights.arrivals
    .filter((a) => a.longGapAfterMinutes !== null)
    .map((a) => `${a.routeName} +${a.longGapAfterMinutes}m`);

  console.log(`poll ${String(poll).padStart(2)}  (+${poll * cadenceSeconds}s)  ${insights.arrivals.length} arrivals`);
  console.log(`  #3 feed        : ${insights.feedAgeSeconds}s old${insights.feedStale ? '  ⚠ STALE' : ''}`);
  console.log(`  #1 trend       : ${trend.length ? trend.join(', ') : '—'}`);
  console.log(`  #2 ghost-bus   : ${insights.vanished.length ? insights.vanished.map((v) => `${v.routeName} to ${v.headsign} (was ${v.wasMinutesAway}m out)`).join(', ') : '—'}`);
  console.log(`  #3 no-signal   : ${stale.length ? stale.join(', ') : '—'}`);
  console.log(`  #5 bunching    : ${bunched.length ? bunched.join(', ') : '—'}`);
  console.log(`  #5 long gap    : ${gap.length ? gap.join(', ') : '—'}`);
  console.log(`  #6 announcer   : ${spoken.text ? `"${spoken.text}"` : '(nothing new)'}`);
  console.log('');
}
