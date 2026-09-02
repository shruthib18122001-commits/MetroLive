/**
 * GET /api/stops?q=<text>   -> up to 25 matching stops (name search)
 * GET /api/stops?id=<stopId> -> 0 or 1 stop (exact lookup for the stop header)
 *
 * Backed by `api/_data/stops.json`, a bundled snapshot of LA Metro's GTFS
 * *static* stops.txt (bus + rail). All matching/scoring lives in the pure
 * functions in `src/lib/stops.ts`.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { VercelRequest, VercelResponse } from '@vercel/node';

import { MIN_QUERY_LENGTH, findStopById, searchStops } from '../src/lib/stops';
import type { StopSummary, StopsErrorBody, StopsErrorCode } from '../src/types/transit';

/** Resolve `api/_data/stops.json` across Vercel, `npm run serve`, dev, and tests. */
function resolveStopsPath(): string {
  const candidates: string[] = [];
  try {
    if (import.meta.url.startsWith('file:')) {
      candidates.push(join(dirname(fileURLToPath(import.meta.url)), '_data', 'stops.json'));
    }
  } catch {
    // import.meta.url not usable in this runtime
  }
  candidates.push(join(process.cwd(), 'api', '_data', 'stops.json'));
  candidates.push(join(process.cwd(), '_data', 'stops.json'));
  return candidates.find((path) => existsSync(path)) ?? (candidates[0] ?? 'api/_data/stops.json');
}

/** Cold-start cost paid once per warm instance. */
let stopsCache: StopSummary[] | null = null;

function loadStops(): StopSummary[] {
  if (stopsCache === null) {
    stopsCache = JSON.parse(readFileSync(resolveStopsPath(), 'utf8')) as StopSummary[];
  }
  return stopsCache;
}

function firstParam(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? (value[0] ?? '') : (value ?? '')).trim();
}

function sendError(
  res: VercelResponse,
  httpStatus: number,
  code: StopsErrorCode,
  message: string,
): void {
  const body: StopsErrorBody = { error: { code, message } };
  res.setHeader('Cache-Control', 'no-store');
  res.status(httpStatus).json(body);
}

export default function handler(req: VercelRequest, res: VercelResponse): void {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    sendError(res, 405, 'METHOD_NOT_ALLOWED', 'Only GET is supported.');
    return;
  }

  let stops: StopSummary[];
  try {
    stops = loadStops();
  } catch {
    sendError(res, 500, 'INTERNAL', 'Stop reference data is unavailable.');
    return;
  }

  const id = firstParam(req.query.id);
  if (id !== '') {
    const stop = findStopById(stops, id);
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
    res.status(200).json(stop ? [stop] : []);
    return;
  }

  const query = firstParam(req.query.q);
  if (query.length < MIN_QUERY_LENGTH) {
    sendError(
      res,
      400,
      'MISSING_QUERY',
      `Provide ?q= with at least ${MIN_QUERY_LENGTH} characters, or ?id= for an exact lookup.`,
    );
    return;
  }

  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.status(200).json(searchStops(stops, query));
}
