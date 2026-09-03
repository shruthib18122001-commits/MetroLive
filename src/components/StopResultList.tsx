import { Link } from 'react-router-dom';

import type { StopSummary } from '../types/transit';

interface StopResultListProps {
  stops: StopSummary[];
  labelledBy?: string;
}

/** Rotating tints for the pin marker — purely decorative colour variety. */
const PIN_TINTS = [
  'bg-brand-100 text-brand-700 group-hover:bg-brand-200',
  'bg-sky-100 text-sky-700 group-hover:bg-sky-200',
  'bg-violet-100 text-violet-700 group-hover:bg-violet-200',
  'bg-amber-100 text-amber-700 group-hover:bg-amber-200',
  'bg-rose-100 text-rose-700 group-hover:bg-rose-200',
  'bg-teal-100 text-teal-700 group-hover:bg-teal-200',
];

export function StopResultList({ stops, labelledBy }: StopResultListProps) {
  return (
    <ul role="list" aria-labelledby={labelledBy} className="flex flex-col gap-2">
      {stops.map((stop, index) => (
        <li
          key={stop.id}
          className="animate-rise"
          style={{ animationDelay: `${Math.min(index, 10) * 35}ms` }}
        >
          <Link
            to={`/stop/${encodeURIComponent(stop.id)}`}
            className="group flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3 shadow-card transition-all hover:-translate-y-px hover:border-brand-300 hover:shadow-card-hover active:translate-y-0 active:shadow-card focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
          >
            <span
              className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl transition-colors ${
                PIN_TINTS[index % PIN_TINTS.length] ?? 'bg-brand-100 text-brand-700'
              }`}
            >
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
              className="h-5 w-5 shrink-0 text-neutral-300 transition-all group-hover:translate-x-0.5 group-hover:text-brand-500"
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
