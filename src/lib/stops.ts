/**
 * Pure stop-search over the bundled GTFS static stops snapshot. No React, no I/O.
 * `/api/stops.ts` loads the JSON and calls these; the client never sees the
 * full list.
 */
import type { StopSummary } from '../types/transit';

export const MIN_QUERY_LENGTH = 2;
export const DEFAULT_SEARCH_LIMIT = 25;

/** Lower-cased, trimmed, internal whitespace collapsed. */
export function normalizeQuery(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, ' ');
}

interface Scored {
  stop: StopSummary;
  score: number;
}

/**
 * All whitespace-separated terms must appear in the stop name (AND match).
 * Lower score sorts first: exact name and prefix matches are boosted, and
 * matches nearer the start of the name score better than matches deep inside.
 */
export function searchStops(
  stops: readonly StopSummary[],
  query: string,
  limit: number = DEFAULT_SEARCH_LIMIT,
): StopSummary[] {
  const q = normalizeQuery(query);
  if (q.length < MIN_QUERY_LENGTH) return [];

  const terms = q.split(' ');
  const results: Scored[] = [];

  for (const stop of stops) {
    const name = stop.name.toLowerCase();
    let score = 0;
    let matchedAll = true;

    for (const term of terms) {
      const at = name.indexOf(term);
      if (at === -1) {
        matchedAll = false;
        break;
      }
      score += Math.min(at, 20);
    }
    if (!matchedAll) continue;

    if (name === q) score -= 100;
    else if (name.startsWith(q)) score -= 50;
    else if (name.startsWith(`${terms[0] ?? ''} `) || name.startsWith(`${terms[0] ?? ''}/`)) score -= 10;

    results.push({ stop, score });
  }

  results.sort(
    (a, b) =>
      a.score - b.score ||
      a.stop.name.localeCompare(b.stop.name) ||
      a.stop.id.localeCompare(b.stop.id),
  );

  return results.slice(0, limit).map((r) => r.stop);
}

/** Exact `stop_id` lookup. */
export function findStopById(stops: readonly StopSummary[], id: string): StopSummary | null {
  const target = id.trim();
  if (target === '') return null;
  return stops.find((s) => s.id === target) ?? null;
}
