/**
 * Backend-for-frontend: GET /api/arrivals?stopId=<id>
 *
 * Fetches LA Metro's GTFS-realtime TripUpdates feed (served via Swiftly),
 * hands the raw bytes to the pure functions in `src/lib/transit.ts`, and
 * responds with a typed `Arrival[]` (or a typed error).
 *
 * This handler owns only I/O: read the query, read config, fetch, respond.
 * All decode/filter/shape logic lives in `src/lib/transit.ts`.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

import {
  FeedDecodeError,
  decodeTripUpdates,
  extractArrivals,
  readFeedTimestamp,
} from '../src/lib/transit';
import type {
  ArrivalsErrorBody,
  ArrivalsErrorCode,
  ArrivalsResponse,
} from '../src/types/transit';

const DEFAULT_FEED_URL = 'https://api.goswift.ly/real-time/lametro/gtfs-rt-trip-updates';
const UPSTREAM_TIMEOUT_MS = 8_000;
/** Edge cache window, per spec: allow ~20s of shared caching. */
const EDGE_MAX_AGE_SECONDS = 20;

interface FeedConfig {
  url: string;
  apiKey: string;
}

/** Resolve the feed URL + credential from the environment, or `null` if unset. */
export function readFeedConfig(env: NodeJS.ProcessEnv): FeedConfig | null {
  const apiKey = env.SWIFTLY_API_KEY?.trim() ?? '';
  if (apiKey === '') return null;
  const url = env.METRO_TRIP_UPDATES_URL?.trim() || DEFAULT_FEED_URL;
  return { url, apiKey };
}

function sendError(
  res: VercelResponse,
  httpStatus: number,
  code: ArrivalsErrorCode,
  message: string,
): void {
  const body: ArrivalsErrorBody = { error: { code, message } };
  res.setHeader('Cache-Control', 'no-store');
  res.status(httpStatus).json(body);
}

async function fetchFeedBytes(config: FeedConfig): Promise<
  { ok: true; bytes: Uint8Array } | { ok: false; code: ArrivalsErrorCode; httpStatus: number; message: string }
> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
  try {
    const upstream = await fetch(config.url, {
      headers: { Authorization: config.apiKey, Accept: 'application/x-protobuf' },
      signal: controller.signal,
    });
    if (!upstream.ok) {
      return {
        ok: false,
        code: 'UPSTREAM_ERROR',
        httpStatus: 502,
        message: `LA Metro realtime feed responded with HTTP ${upstream.status}.`,
      };
    }
    const bytes = new Uint8Array(await upstream.arrayBuffer());
    return { ok: true, bytes };
  } catch {
    return {
      ok: false,
      code: 'UPSTREAM_UNAVAILABLE',
      httpStatus: 504,
      message: 'Could not reach the LA Metro realtime feed.',
    };
  } finally {
    clearTimeout(timer);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    sendError(res, 405, 'METHOD_NOT_ALLOWED', 'Only GET is supported.');
    return;
  }

  const rawStopId = req.query.stopId;
  const stopId = (Array.isArray(rawStopId) ? rawStopId[0] ?? '' : rawStopId ?? '').trim();
  if (stopId === '') {
    sendError(res, 400, 'MISSING_STOP_ID', 'Query parameter "stopId" is required.');
    return;
  }

  const config = readFeedConfig(process.env);
  if (!config) {
    sendError(
      res,
      500,
      'NOT_CONFIGURED',
      'Server is missing the SWIFTLY_API_KEY environment variable.',
    );
    return;
  }

  const fetched = await fetchFeedBytes(config);
  if (!fetched.ok) {
    sendError(res, fetched.httpStatus, fetched.code, fetched.message);
    return;
  }

  let arrivals: ArrivalsResponse;
  let feedTimestamp: string | null;
  try {
    const feed = decodeTripUpdates(fetched.bytes);
    feedTimestamp = readFeedTimestamp(feed);
    arrivals = extractArrivals(feed, stopId);
  } catch (err) {
    if (err instanceof FeedDecodeError) {
      sendError(res, 502, 'DECODE_FAILED', 'LA Metro feed did not return valid GTFS-realtime data.');
      return;
    }
    sendError(res, 500, 'INTERNAL', 'Unexpected error while building arrivals.');
    return;
  }

  res.setHeader(
    'Cache-Control',
    `public, s-maxage=${EDGE_MAX_AGE_SECONDS}, stale-while-revalidate=${EDGE_MAX_AGE_SECONDS}`,
  );
  if (feedTimestamp) res.setHeader('X-Feed-Timestamp', feedTimestamp);
  res.status(200).json(arrivals);
}
