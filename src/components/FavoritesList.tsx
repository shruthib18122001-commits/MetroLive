import { Link } from 'react-router-dom';

import { useFavoritesStore } from '../store/favorites';

function StarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true" fill="currentColor">
      <path d="m10 2.5 2.36 4.78 5.28.77-3.82 3.72.9 5.26L10 14.9l-4.72 2.48.9-5.26L2.36 8.4l5.28-.77L10 2.5Z" />
    </svg>
  );
}

export function FavoritesList() {
  const favorites = useFavoritesStore((state) => state.favorites);
  const remove = useFavoritesStore((state) => state.remove);

  if (favorites.length === 0) {
    return (
      <section
        aria-labelledby="favorites-heading"
        className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-neutral-300 bg-white/60 px-6 py-7 text-center"
      >
        <span className="grid h-10 w-10 place-items-center rounded-full bg-amber-50 text-amber-400">
          <StarIcon className="h-5 w-5" />
        </span>
        <h2 id="favorites-heading" className="text-sm font-semibold text-neutral-800">
          No favourites yet
        </h2>
        <p className="max-w-[15rem] text-xs leading-relaxed text-neutral-600">
          Open a stop and tap “Favourite” to pin it here for one-tap access.
        </p>
      </section>
    );
  }

  return (
    <section aria-labelledby="favorites-heading" className="flex flex-col gap-2">
      <h2
        id="favorites-heading"
        className="px-1 text-[0.6875rem] font-bold uppercase tracking-wider text-neutral-600"
      >
        Favourites
      </h2>
      <ul role="list" className="flex flex-col gap-2">
        {favorites.map((favorite, index) => (
          <li
            key={favorite.id}
            className="flex animate-rise items-stretch gap-2"
            style={{ animationDelay: `${Math.min(index, 8) * 35}ms` }}
          >
            <Link
              to={`/stop/${encodeURIComponent(favorite.id)}`}
              className="flex flex-1 items-center gap-2.5 rounded-2xl border border-neutral-200/80 bg-white px-3.5 py-3 shadow-card transition-all hover:-translate-y-px hover:border-brand-300 hover:shadow-card-hover active:translate-y-0 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
            >
              <StarIcon className="h-4 w-4 shrink-0 text-amber-400" />
              <span className="truncate text-[0.9375rem] font-semibold text-neutral-900">
                {favorite.name}
              </span>
            </Link>
            <button
              type="button"
              onClick={() => remove(favorite.id)}
              aria-label={`Remove ${favorite.name} from favourites`}
              className="grid w-11 shrink-0 place-items-center rounded-2xl border border-neutral-200/80 bg-white text-neutral-600 shadow-card transition-colors hover:bg-neutral-50 hover:text-neutral-800 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true" fill="currentColor">
                <path d="M10 8.94l3.72-3.72a.75.75 0 1 1 1.06 1.06L11.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06L10 11.06l-3.72 3.72a.75.75 0 0 1-1.06-1.06L8.94 10 5.22 6.28a.75.75 0 0 1 1.06-1.06L10 8.94Z" />
              </svg>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
