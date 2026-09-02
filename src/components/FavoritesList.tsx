import { Link } from 'react-router-dom';

import { useFavoritesStore } from '../store/favorites';

export function FavoritesList() {
  const favorites = useFavoritesStore((state) => state.favorites);
  const remove = useFavoritesStore((state) => state.remove);

  if (favorites.length === 0) {
    return (
      <section aria-labelledby="favorites-heading" className="rounded-xl border border-dashed border-neutral-300 bg-white px-4 py-5 text-center">
        <h2 id="favorites-heading" className="text-sm font-semibold text-neutral-800">
          No favourites yet
        </h2>
        <p className="mt-1 text-xs text-neutral-500">
          Open a stop and tap “Favourite” to pin it here for quick access.
        </p>
      </section>
    );
  }

  return (
    <section aria-labelledby="favorites-heading" className="flex flex-col gap-2">
      <h2 id="favorites-heading" className="text-sm font-semibold text-neutral-800">
        Favourites
      </h2>
      <ul role="list" className="flex flex-col gap-2">
        {favorites.map((favorite) => (
          <li key={favorite.id} className="flex items-stretch gap-2">
            <Link
              to={`/stop/${encodeURIComponent(favorite.id)}`}
              className="tap-target flex flex-1 items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 hover:border-brand-500 hover:bg-brand-50 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0 text-amber-500" aria-hidden="true" fill="currentColor">
                <path d="m10 2.5 2.36 4.78 5.28.77-3.82 3.72.9 5.26L10 14.9l-4.72 2.48.9-5.26L2.36 8.4l5.28-.77L10 2.5Z" />
              </svg>
              <span className="truncate text-sm font-semibold text-neutral-900">{favorite.name}</span>
            </Link>
            <button
              type="button"
              onClick={() => remove(favorite.id)}
              aria-label={`Remove ${favorite.name} from favourites`}
              className="tap-target rounded-xl border border-neutral-300 bg-white px-3 text-neutral-500 hover:bg-neutral-50 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true" fill="currentColor">
                <path d="M6.28 6.28a.75.75 0 0 1 1.06 0L10 8.94l2.66-2.66a.75.75 0 1 1 1.06 1.06L11.06 10l2.66 2.66a.75.75 0 1 1-1.06 1.06L10 11.06l-2.66 2.66a.75.75 0 0 1-1.06-1.06L8.94 10 6.28 7.34a.75.75 0 0 1 0-1.06Z" />
              </svg>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
