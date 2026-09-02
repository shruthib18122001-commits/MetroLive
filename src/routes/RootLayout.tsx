import { Link, Outlet } from 'react-router-dom';

export function RootLayout() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-10 focus:rounded-lg focus:bg-brand-700 focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-10 border-b border-neutral-200 bg-neutral-50/90 backdrop-blur">
        <div className="flex items-center gap-2 px-4 py-3">
          <Link
            to="/"
            className="flex items-center gap-2 rounded-md font-extrabold tracking-tight text-brand-700 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
          >
            <span aria-hidden="true" className="grid h-7 w-7 place-items-center rounded-md bg-brand-700 text-sm text-white">
              M
            </span>
            MetroLive
          </Link>
        </div>
      </header>

      <main id="main" className="flex-1 px-4 py-4">
        <Outlet />
      </main>

      <footer className="px-4 pb-6 pt-2 text-center text-xs text-neutral-400">
        Live arrivals from LA Metro GTFS-realtime · not affiliated with LACMTA
      </footer>
    </div>
  );
}
