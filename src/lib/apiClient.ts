/**
 * Thin browser-side wrappers around the BFF endpoints. No React; used by the
 * React Query hooks in `src/hooks`.
 */
import type {
  Arrival,
  ArrivalsDataSource,
  ArrivalsErrorBody,
  StopSummary,
} from '../types/transit';

export class ApiError extends Error {
  readonly code: string;
  readonly httpStatus: number;

  constructor(message: string, code: string, httpStatus: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

async function throwApiError(res: Response, fallbackMessage: string): Promise<never> {
  let code = 'UNKNOWN';
  let message = fallbackMessage;
  try {
    const body = (await res.json()) as Partial<ArrivalsErrorBody>;
    if (body.error) {
      code = body.error.code ?? code;
      message = body.error.message ?? message;
    }
  } catch {
    // response wasn't JSON — keep the fallback
  }
  throw new ApiError(message, code, res.status);
}

export interface ArrivalsResult {
  arrivals: Arrival[];
  source: ArrivalsDataSource;
  feedTimestamp: string | null;
}

export async function fetchArrivals(stopId: string, signal?: AbortSignal): Promise<ArrivalsResult> {
  const res = await fetch(`/api/arrivals?stopId=${encodeURIComponent(stopId)}`, { signal });
  if (!res.ok) return throwApiError(res, 'Could not load arrivals for this stop.');
  const arrivals = (await res.json()) as Arrival[];
  const source = res.headers.get('X-Data-Source') === 'demo' ? 'demo' : 'live';
  return { arrivals, source, feedTimestamp: res.headers.get('X-Feed-Timestamp') };
}

export async function searchStops(query: string, signal?: AbortSignal): Promise<StopSummary[]> {
  const res = await fetch(`/api/stops?q=${encodeURIComponent(query)}`, { signal });
  if (!res.ok) return throwApiError(res, 'Could not search stops.');
  return (await res.json()) as StopSummary[];
}

export async function fetchStopById(stopId: string, signal?: AbortSignal): Promise<StopSummary | null> {
  const res = await fetch(`/api/stops?id=${encodeURIComponent(stopId)}`, { signal });
  if (!res.ok) return throwApiError(res, 'Could not load this stop.');
  const [stop] = (await res.json()) as StopSummary[];
  return stop ?? null;
}
