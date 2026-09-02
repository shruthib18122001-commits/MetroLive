/**
 * Favourite stops — CLIENT state. Persisted to localStorage, never routed
 * through React Query.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface FavoriteStop {
  id: string;
  name: string;
}

interface FavoritesState {
  favorites: FavoriteStop[];
  toggle: (stop: FavoriteStop) => void;
  remove: (id: string) => void;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set) => ({
      favorites: [],
      toggle: (stop) =>
        set((state) => {
          const exists = state.favorites.some((f) => f.id === stop.id);
          return {
            favorites: exists
              ? state.favorites.filter((f) => f.id !== stop.id)
              : [...state.favorites, { id: stop.id, name: stop.name }],
          };
        }),
      remove: (id) => set((state) => ({ favorites: state.favorites.filter((f) => f.id !== id) })),
    }),
    { name: 'metrolive.favorites.v1', version: 1 },
  ),
);

/** Selector hook: is this stop currently favourited? */
export function useIsFavorite(id: string): boolean {
  return useFavoritesStore((state) => state.favorites.some((f) => f.id === id));
}
