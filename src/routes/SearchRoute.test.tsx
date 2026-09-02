import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { jsonResponse, mockFetch } from '../test/mockFetch';
import { renderWithProviders } from '../test/renderWithProviders';
import { useFavoritesStore } from '../store/favorites';
import { SearchRoute } from './SearchRoute';

const STOPS = [
  { id: '80409', name: 'Union Station - Metro A-Line', lat: 34.05, lon: -118.23 },
  { id: '80214', name: 'Union Station - Metro B & D Lines', lat: 34.05, lon: -118.23 },
];

beforeEach(() => {
  useFavoritesStore.setState({ favorites: [] });
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('<SearchRoute>', () => {
  it('shows favourites (empty state) when the query is blank', () => {
    mockFetch({});
    renderWithProviders(<SearchRoute />);
    expect(screen.getByRole('heading', { name: 'Find your stop' })).toBeInTheDocument();
    expect(screen.getByText('No favourites yet')).toBeInTheDocument();
  });

  it('lists saved favourites above the input', () => {
    useFavoritesStore.setState({ favorites: [{ id: '80409', name: 'Union Station' }] });
    mockFetch({});
    renderWithProviders(<SearchRoute />);
    expect(screen.getByRole('heading', { name: 'Favourites' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Union Station/ })).toHaveAttribute('href', '/stop/80409');
  });

  it('debounces input, then renders results', async () => {
    const fetchFn = mockFetch({
      '/api/stops': () => jsonResponse(STOPS),
    });
    renderWithProviders(<SearchRoute />);

    await userEvent.type(screen.getByLabelText('Stop name'), 'union');
    expect(fetchFn).not.toHaveBeenCalled(); // still within the 300ms debounce

    expect(await screen.findByText('2 matches for “union”')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Union Station - Metro A-Line/ })).toHaveAttribute(
      'href',
      '/stop/80409',
    );
    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(fetchFn.mock.calls[0]?.[0]).toContain('/api/stops?q=union');
  });

  it('shows an empty state when nothing matches', async () => {
    mockFetch({ '/api/stops': () => jsonResponse([]) });
    renderWithProviders(<SearchRoute />);
    await userEvent.type(screen.getByLabelText('Stop name'), 'zzzz');
    expect(await screen.findByText('No stops found')).toBeInTheDocument();
  });

  it('shows an error state with a retry when the search fails', async () => {
    mockFetch({
      '/api/stops': () =>
        jsonResponse({ error: { code: 'INTERNAL', message: 'Search is offline' } }, { status: 500 }),
    });
    renderWithProviders(<SearchRoute />);
    await userEvent.type(screen.getByLabelText('Stop name'), 'union');
    expect(await screen.findByRole('alert')).toHaveTextContent('Search failed');
    expect(screen.getByText('Search is offline')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });
});
