/**
 * Runs the Phase 1 pure pipeline against the committed `.pb` fixture so you can
 * see the shape of `GET /api/arrivals` without a Swiftly key.
 *
 *   npm run demo:arrivals            # stop 80122
 *   npm run demo:arrivals -- 5307    # another stop
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { FIXTURE_NOW_MS, FIXTURE_STOP_A } from '../src/lib/__fixtures__/feed';
import { decodeTripUpdates, extractArrivals, readFeedTimestamp } from '../src/lib/transit';

const stopId = process.argv[2] ?? FIXTURE_STOP_A;
const pbPath = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'src',
  'lib',
  '__fixtures__',
  'trip-updates.pb',
);

const feed = decodeTripUpdates(new Uint8Array(readFileSync(pbPath)));
const arrivals = extractArrivals(feed, stopId, { now: FIXTURE_NOW_MS });

console.log(`feed timestamp : ${readFeedTimestamp(feed) ?? '(none)'}`);
console.log(`stopId         : ${stopId}`);
console.log(`arrivals       : ${arrivals.length}`);
console.log(JSON.stringify(arrivals, null, 2));
