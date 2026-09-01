/**
 * Writes the GTFS-realtime fixtures to `.pb` files next to `feed.ts`.
 * Run with `npm run fixtures`.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  FIXTURE_CASES,
  FIXTURE_NOW_MS,
  FIXTURE_STOP_A,
  FIXTURE_STOP_B,
  NOT_PROTOBUF_BYTES,
  buildEmptyFixture,
  buildTripUpdatesFixture,
} from '../src/lib/__fixtures__/feed';

const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'lib', '__fixtures__');
mkdirSync(outDir, { recursive: true });

writeFileSync(join(outDir, 'trip-updates.pb'), buildTripUpdatesFixture());
writeFileSync(join(outDir, 'empty.pb'), buildEmptyFixture());
writeFileSync(join(outDir, 'not-protobuf.bin'), NOT_PROTOBUF_BYTES);
writeFileSync(
  join(outDir, 'meta.json'),
  `${JSON.stringify(
    {
      fixtureNowIso: new Date(FIXTURE_NOW_MS).toISOString(),
      stopA: FIXTURE_STOP_A,
      stopB: FIXTURE_STOP_B,
      cases: FIXTURE_CASES,
    },
    null,
    2,
  )}\n`,
);

console.log(`Wrote trip-updates.pb, empty.pb, not-protobuf.bin, meta.json to ${outDir}`);
