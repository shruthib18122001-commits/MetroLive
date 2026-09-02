import { Link } from 'react-router-dom';

import type { StopSummary } from '../types/transit';

interface StopResultListProps {
  stops: StopSummary[];
  labelledBy?: string;
}

export function StopResultList({ stops, labelledBy }: StopResultListProps) {
  return (
    <ul role="list" aria-labelledby={labelledBy} className="flex flex-col gap-2">
      {stops.map((stop) => (
        <li key={stop.id}>
          <Link
            to={`/stop/${encodeURIComponent(stop.id)}`}
            className="tap-target flex items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white px-3 py-3 hover:border-brand-500 hover:bg-brand-50 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
          >
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-neutral-900">
                {stop.name}
              </span>
              <span className="block text-xs text-neutral-600">Stop {stop.id}</span>
            </span>
            <svg viewBox="0 0 20 20" className="h-5 w-5 shrink-0 text-neutral-400" aria-hidden="true" fill="currentColor">
              <path d="M7.21 14.77a.75.75 0 0 1 0-1.06L10.94 10 7.21 6.29a.75.75 0 0 1 1.06-1.06l4.25 4.24a.75.75 0 0 1 0 1.06l-4.25 4.24a.75.75 0 0 1-1.06 0Z" />
            </svg>
          </Link>
        </li>
      ))}
    </ul>
  );
}
