import { Link, Outlet } from 'react-router-dom';

import { TransitBackdrop } from '../components/TransitBackdrop';

function LogoMark() {
  return (
    <span
      aria-hidden="true"
      className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-card"
    >
      <svg viewBox="0 0 32 32" className="h-5 w-5" fill="currentColor" aria-hidden="true">
        <path d="M7 23V9h4l5 8 5-8h4v14h-4v-7l-5 8-5-8v7z" />
      </svg>
    </span>
  );
}

function LiveDot() {
  return (
    <span className="relative ml-1.5 flex h-2 w-2" title="Live data">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-500" />
      <span className="sr-only">live</span>
    </span>
  );
}

export function RootLayout() {
  return (
    <div className="relative flex min-h-dvh flex-col">
      <TransitBackdrop />

      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-30 focus:rounded-lg focus:bg-brand-600 focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to content
      </a>

      <header className="safe-t sticky top-0 z-20 glass">
        <div className="mx-auto flex w-full max-w-6xl items-center px-4 py-3 md:px-8">
          <Link
            to="/"
            className="flex items-center gap-2.5 rounded-lg focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          >
            <LogoMark />
            <span className="flex items-center text-[1.0625rem] font-extrabold tracking-tight text-neutral-900">
              MetroLive
              <LiveDot />
            </span>
          </Link>
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-8 md:py-10 lg:py-14">
        <Outlet />
      </main>

      <footer className="safe-b mx-auto w-full max-w-6xl px-4 pb-8 pt-4 text-center text-xs text-neutral-600 md:px-8">
        Live arrivals from LA Metro GTFS-realtime · not affiliated with LACMTA
      </footer>
    </div>
  );
}
