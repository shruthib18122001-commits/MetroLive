import { Link, Outlet } from 'react-router-dom';

function LogoMark() {
  return (
    <span
      aria-hidden="true"
      className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-brand-700 to-brand-900 text-white shadow-card"
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
    <div className="relative flex min-h-dvh flex-col bg-page">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-80 bg-[radial-gradient(42rem_20rem_at_50%_-7rem,rgba(37,107,82,0.12),transparent_72%)]" />
        <div className="absolute -left-20 -top-24 h-64 w-64 rounded-full bg-brand-300/25 blur-3xl" />
        <div className="absolute -right-24 top-2 h-56 w-56 rounded-full bg-amber-200/30 blur-3xl" />
        <div className="absolute right-1/3 top-24 h-40 w-40 rounded-full bg-sky-200/25 blur-3xl" />
      </div>

      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-30 focus:rounded-lg focus:bg-brand-900 focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to content
      </a>

      <header className="safe-t sticky top-0 z-20 border-b border-neutral-200/70 bg-gradient-to-b from-white/85 to-page/70 shadow-header backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-md items-center px-4 py-3">
          <Link
            to="/"
            className="flex items-center gap-2.5 rounded-lg focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
          >
            <LogoMark />
            <span className="flex items-center text-[1.0625rem] font-extrabold tracking-tight text-brand-900">
              MetroLive
              <LiveDot />
            </span>
          </Link>
        </div>
      </header>

      <main id="main" className="relative z-10 mx-auto w-full max-w-md flex-1 px-4 py-5">
        <Outlet />
      </main>

      <footer className="safe-b mx-auto w-full max-w-md px-4 pb-6 pt-2 text-center text-xs text-neutral-600">
        Live arrivals from LA Metro GTFS-realtime · not affiliated with LACMTA
      </footer>
    </div>
  );
}
