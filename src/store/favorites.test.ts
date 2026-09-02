import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { useFavoritesStore, useIsFavorite } from './favorites';

function reset(): void {
  useFavoritesStore.setState({ favorites: [] });
  localStorage.clear();
}

describe('favorites store', () => {
  beforeEach(reset);

  it('toggles a stop on and off', () => {
    const stop = { id: '80122', name: '7th St / Metro Center' };
    useFavoritesStore.getState().toggle(stop);
    expect(useFavoritesStore.getState().favorites).toEqual([stop]);

    useFavoritesStore.getState().toggle(stop);
    expect(useFavoritesStore.getState().favorites).toEqual([]);
  });

  it('stores only id and name, and removes by id', () => {
    useFavoritesStore.getState().toggle({ id: '3', name: 'Jefferson / 10th', extra: 'ignored' } as never);
    expect(useFavoritesStore.getState().favorites).toEqual([{ id: '3', name: 'Jefferson / 10th' }]);

    useFavoritesStore.getState().remove('3');
    expect(useFavoritesStore.getState().favorites).toEqual([]);
  });

  it('persists to localStorage under a versioned key', () => {
    useFavoritesStore.getState().toggle({ id: '5307', name: 'Long Beach / 10th' });
    const raw = localStorage.getItem('metrolive.favorites.v1');
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw ?? '{}')).toMatchObject({
      state: { favorites: [{ id: '5307', name: 'Long Beach / 10th' }] },
      version: 1,
    });
  });

  it('useIsFavorite reflects store state reactively', () => {
    const { result } = renderHook(() => useIsFavorite('80122'));
    expect(result.current).toBe(false);
    act(() => useFavoritesStore.getState().toggle({ id: '80122', name: 'x' }));
    expect(result.current).toBe(true);
  });
});
