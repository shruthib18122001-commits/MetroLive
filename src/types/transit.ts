/**
 * The wire contract for `GET /api/arrivals`.
 *
 * Imported by BOTH the serverless handler (`/api/arrivals.ts`, via
 * `/src/lib/transit.ts`) and the client. Types only — no runtime code.
 */

export type ArrivalStatus = 'early' | 'ontime' | 'late' | 'unknown';

export interface Arrival {
  /** GTFS `route_id` from the realtime feed's TripDescriptor. */
  routeId: string;
  /**
   * Human-facing route label. The realtime feed carries no route names, so this
   * falls back to `routeId` unless the BFF is given a name map.
   */
  routeName: string;
  /** Trip destination. Empty string when the feed omits `trip_headsign`. */
  headsign: string;
  /**
   * ISO-8601 scheduled arrival at the requested stop, or `null` when the feed
   * provided a delay with no absolute time to anchor it to.
   */
  scheduledTime: string | null;
  /** ISO-8601 predicted arrival (or departure) at the requested stop, or `null`. */
  predictedTime: string | null;
  /** Seconds relative to schedule: positive = late, negative = early, `0` when unknown. */
  delaySeconds: number;
  status: ArrivalStatus;
}

/** Success body of `GET /api/arrivals` — a bare array, ascending by arrival time. */
export type ArrivalsResponse = Arrival[];

export type ArrivalsErrorCode =
  | 'MISSING_STOP_ID'
  | 'METHOD_NOT_ALLOWED'
  | 'NOT_CONFIGURED'
  | 'UPSTREAM_ERROR'
  | 'UPSTREAM_UNAVAILABLE'
  | 'DECODE_FAILED'
  | 'INTERNAL';

/** Non-2xx body of `GET /api/arrivals`. */
export interface ArrivalsErrorBody {
  error: {
    code: ArrivalsErrorCode;
    message: string;
  };
}

/** Which backend produced an arrivals response (also sent as the `X-Data-Source` header). */
export type ArrivalsDataSource = 'live' | 'demo';

/* -------------------------------------------------------------------------- *
 * GET /api/stops — stop reference data for the search box and stop header.
 * Backed by a bundled snapshot of LA Metro's GTFS *static* stops.txt.
 * -------------------------------------------------------------------------- */

export interface StopSummary {
  /** GTFS `stop_id` — the value `/api/arrivals?stopId=` expects. */
  id: string;
  /** GTFS `stop_name`. */
  name: string;
  lat: number;
  lon: number;
}

/** Success body of `GET /api/stops` — for both `?q=` (search) and `?id=` (lookup). */
export type StopsResponse = StopSummary[];

export type StopsErrorCode = 'MISSING_QUERY' | 'METHOD_NOT_ALLOWED' | 'INTERNAL';

/** Non-2xx body of `GET /api/stops`. */
export interface StopsErrorBody {
  error: {
    code: StopsErrorCode;
    message: string;
  };
}
