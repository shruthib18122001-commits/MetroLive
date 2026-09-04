import { useEffect, useRef, useState } from 'react';

import {
  EMPTY_ANNOUNCE_STATE,
  computeInsights,
  describeChanges,
} from '../lib/insights';
import type { AnnounceState, ArrivalHistory, ArrivalInsights } from '../lib/insights';
import { useArrivals } from './useArrivals';

/**
 * `useArrivals` + cross-poll analysis: folds each successful fetch into a
 * running history and derives trend / ghost-bus / staleness / bunching
 * ({@link ArrivalInsights}) plus a spoken-form summary of what changed.
 */
export function useArrivalInsights(stopId: string) {
  const query = useArrivals(stopId);
  const historyRef = useRef<ArrivalHistory>({});
  const announceRef = useRef<AnnounceState>(EMPTY_ANNOUNCE_STATE);
  const [insights, setInsights] = useState<ArrivalInsights | null>(null);
  const [announcement, setAnnouncement] = useState('');

  // Reset when the stop changes.
  useEffect(() => {
    historyRef.current = {};
    announceRef.current = EMPTY_ANNOUNCE_STATE;
    setInsights(null);
    setAnnouncement('');
  }, [stopId]);

  const updatedAt = query.dataUpdatedAt;
  const data = query.data;

  useEffect(() => {
    if (!data) return;
    const now = updatedAt || Date.now();
    const result = computeInsights(historyRef.current, data.arrivals, {
      now,
      feedTimestamp: data.feedTimestamp,
    });
    historyRef.current = result.history;
    setInsights(result.insights);

    const spoken = describeChanges(announceRef.current, result.insights, now);
    announceRef.current = spoken.state;
    if (spoken.text) setAnnouncement(spoken.text);
    // Recompute once per successful fetch; `data`'s identity also changes then.
  }, [updatedAt, data]);

  return { query, insights, announcement };
}
