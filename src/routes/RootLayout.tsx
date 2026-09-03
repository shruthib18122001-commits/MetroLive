import { Link, Outlet } from 'react-router-dom';

function LogoMark() {
  return (
    <span
      aria-hidden="true"
      className="grid h-8 w-8 place-items-center rounded-xl bg-white/12 text-white ring-1 ring-white/20"
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
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-80" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-300" />
      <span className="sr-only">live</span>
    </span>
  );
}

export function RootLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-page">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-30 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-brand-900"
      >
        Skip to content
      </a>

      <header className="safe-t sticky top-0 z-20 bg-brand-900">
        <div className="mx-auto flex w-full max-w-md items-center px-4 py-3">
          <Link
            to="/"
            className="flex items-center gap-2.5 rounded-lg focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-900"
          >
            <LogoMark />
            <span className="flex items-center text-[1.0625rem] font-extrabold tracking-tight text-white">
              MetroLive
              <LiveDot />
            </span>
          </Link>
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-md flex-1 px-4 py-5">
        <Outlet />
      </main>

      <footer className="safe-b mx-auto w-full max-w-md px-4 pb-6 pt-2 text-center text-xs text-neutral-600">
        Live arrivals from LA Metro GTFS-realtime · not affiliated with LACMTA
      </footer>
    </div>
  );
}
