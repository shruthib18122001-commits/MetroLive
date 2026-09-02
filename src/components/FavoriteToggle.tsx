import { useFavoritesStore, useIsFavorite } from '../store/favorites';
import type { FavoriteStop } from '../store/favorites';

interface FavoriteToggleProps {
  stop: FavoriteStop;
  className?: string;
}

export function FavoriteToggle({ stop, className = '' }: FavoriteToggleProps) {
  const isFavorite = useIsFavorite(stop.id);
  const toggle = useFavoritesStore((state) => state.toggle);

  return (
    <button
      type="button"
      aria-pressed={isFavorite}
      aria-label={isFavorite ? `Remove ${stop.name} from favourites` : `Add ${stop.name} to favourites`}
      onClick={() => toggle(stop)}
      className={`tap-target inline-flex items-center gap-1.5 rounded-lg border px-3 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 ${
        isFavorite
          ? 'border-amber-300 bg-amber-50 text-amber-800'
          : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50'
      } ${className}`}
    >
      <svg
        viewBox="0 0 20 20"
        className="h-4 w-4"
        aria-hidden="true"
        fill={isFavorite ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="m10 2.5 2.36 4.78 5.28.77-3.82 3.72.9 5.26L10 14.9l-4.72 2.48.9-5.26L2.36 8.4l5.28-.77L10 2.5Z" />
      </svg>
      {isFavorite ? 'Favourited' : 'Favourite'}
    </button>
  );
}
