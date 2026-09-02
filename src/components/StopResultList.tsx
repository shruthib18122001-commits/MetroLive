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
            className="group flex items-center gap-3 rounded-2xl border border-neutral-200/80 bg-white px-4 py-3 shadow-card transition-colors hover:border-brand-300 hover:bg-brand-50/50 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-100">
              <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true" fill="currentColor">
                <path d="M10 2a5 5 0 0 0-5 5c0 3.5 5 11 5 11s5-7.5 5-11a5 5 0 0 0-5-5Zm0 7a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z" />
              </svg>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[0.9375rem] font-semibold text-neutral-900">
                {stop.name}
              </span>
              <span className="block text-[0.8125rem] text-neutral-600">Stop {stop.id}</span>
            </span>
            <svg
              viewBox="0 0 20 20"
              className="h-5 w-5 shrink-0 text-neutral-300 transition-colors group-hover:text-brand-500"
              aria-hidden="true"
              fill="currentColor"
            >
              <path d="M7.21 14.77a.75.75 0 0 1 0-1.06L10.94 10 7.21 6.29a.75.75 0 0 1 1.06-1.06l4.25 4.24a.75.75 0 0 1 0 1.06l-4.25 4.24a.75.75 0 0 1-1.06 0Z" />
            </svg>
          </Link>
        </li>
      ))}
    </ul>
  );
}
