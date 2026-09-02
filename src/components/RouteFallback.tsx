import { Spinner } from './Spinner';

/** Suspense fallback for lazily-loaded routes. */
export function RouteFallback() {
  return (
    <div className="flex justify-center py-16">
      <Spinner label="Loading page" className="h-8 w-8" />
    </div>
  );
}
