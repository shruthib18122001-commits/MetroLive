/**
 * Placeholder shell. The search (`/`) and stop (`/stop/:stopId`) routes land in
 * Phase 2; Phase 1 is the `/api/arrivals` backend-for-frontend only.
 */
export function App() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-3 p-6">
      <h1 className="text-xl font-semibold text-neutral-900">LA Transit Tracker</h1>
      <p className="text-sm text-neutral-600">
        Phase 1 is in place: the arrivals backend-for-frontend at{' '}
        <code className="rounded bg-neutral-200 px-1 py-0.5 text-[0.8125rem]">/api/arrivals</code>.
        The search and stop screens arrive in Phase 2.
      </p>
    </main>
  );
}
