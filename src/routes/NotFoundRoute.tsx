import { Link } from 'react-router-dom';

export function NotFoundRoute() {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <p className="text-3xl font-black text-neutral-300">404</p>
      <h1 className="text-lg font-bold text-neutral-900">Page not found</h1>
      <p className="max-w-xs text-sm text-neutral-600">
        That route doesn’t exist. Head back to search for a stop.
      </p>
      <Link
        to="/"
        className="tap-target inline-flex items-center rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
      >
        Go to search
      </Link>
    </div>
  );
}
