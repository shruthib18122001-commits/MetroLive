import { Spinner } from './Spinner';

/** Suspense fallback for lazily-loaded routes. */
export function RouteFallback() {
  return (
    <div className="flex justify-center py-20 text-brand-600">
      <Spinner label="Loading page" className="h-7 w-7" />
    </div>
  );
}
