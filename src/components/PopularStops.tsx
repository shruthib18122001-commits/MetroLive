import { Link } from 'react-router-dom';

import { POPULAR_STOPS } from '../lib/popularStops';

const TINTS = [
  'bg-sky-100 text-sky-800 hover:bg-sky-200',
  'bg-violet-100 text-violet-800 hover:bg-violet-200',
  'bg-amber-100 text-amber-800 hover:bg-amber-200',
  'bg-rose-100 text-rose-800 hover:bg-rose-200',
  'bg-teal-100 text-teal-800 hover:bg-teal-200',
  'bg-fuchsia-100 text-fuchsia-800 hover:bg-fuchsia-200',
];

export function PopularStops() {
  return (
    <nav aria-label="Popular stops" className="flex flex-col items-center gap-2.5">
      <h2 className="text-[0.6875rem] font-bold uppercase tracking-wider text-brand-700">
        Popular stops
      </h2>
      <ul className="flex flex-wrap justify-center gap-2">
        {POPULAR_STOPS.map((stop, index) => (
          <li key={stop.id} className="animate-rise" style={{ animationDelay: `${index * 35}ms` }}>
            <Link
              to={`/stop/${stop.id}`}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.8125rem] font-bold transition-transform active:scale-95 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 ${
                TINTS[index % TINTS.length] ?? 'bg-sky-100 text-sky-800'
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
