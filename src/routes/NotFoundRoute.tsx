import { Link } from 'react-router-dom';

export function NotFoundRoute() {
  return (
    <div className="flex flex-col items-center gap-3 py-20 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-xl font-black text-brand-700">
        404
      </span>
      <h1 className="text-lg font-bold text-neutral-900">Page not found</h1>
      <p className="max-w-xs text-sm leading-relaxed text-neutral-600">
        That route doesn’t exist. Head back to search for a stop.
      </p>
      <Link
        to="/"
        className="mt-1 inline-flex h-11 items-center rounded-xl bg-brand-900 px-5 text-sm font-semibold text-white shadow-card transition-colors hover:bg-brand-800 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
      >
        Go to search
      </Link>
    </div>
  );
}
