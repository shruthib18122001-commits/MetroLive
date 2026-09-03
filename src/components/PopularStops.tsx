import { Link } from 'react-router-dom';

import { POPULAR_STOPS } from '../lib/popularStops';

const TINTS = [
  'bg-brand-200 text-brand-900 hover:bg-brand-300',
  'bg-sky-200 text-sky-900 hover:bg-sky-300',
  'bg-violet-200 text-violet-900 hover:bg-violet-300',
  'bg-amber-200 text-amber-900 hover:bg-amber-300',
  'bg-rose-200 text-rose-900 hover:bg-rose-300',
  'bg-teal-200 text-teal-900 hover:bg-teal-300',
];

export function PopularStops() {
  return (
    <nav aria-label="Popular stops" className="flex flex-col gap-2">
      <h2 className="px-1 text-[0.6875rem] font-bold uppercase tracking-wider text-brand-700">
        Popular stops
      </h2>
      <ul className="flex flex-wrap gap-2">
        {POPULAR_STOPS.map((stop, index) => (
          <li key={stop.id} className="animate-rise" style={{ animationDelay: `${index * 35}ms` }}>
            <Link
              to={`/stop/${stop.id}`}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.8125rem] font-bold transition-colors active:scale-95 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 ${
                TINTS[index % TINTS.length] ?? 'bg-brand-200 text-brand-900'
              }`}
            >
              <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" aria-hidden="true" fill="currentColor">
                <path d="M10 2a5 5 0 0 0-5 5c0 3.5 5 11 5 11s5-7.5 5-11a5 5 0 0 0-5-5Zm0 7a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z" />
              </svg>
              {stop.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
