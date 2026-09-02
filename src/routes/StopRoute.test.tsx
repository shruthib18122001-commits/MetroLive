import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useFavoritesStore } from '../store/favorites';
import { jsonResponse, mockFetch } from '../test/mockFetch';
import { renderWithProviders } from '../test/renderWithProviders';
import { StopRoute } from './StopRoute';

vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: (opts: { count: number }) => ({
    getTotalSize: () => opts.count * 72,
    getVirtualItems: () =>
      Array.from({ length: opts.count }, (_, index) => ({ key: index, index, start: index * 72, size: 72 })),
  }),
}));

const STOP = { id: '80122', name: '7th Street / Metro Center', lat: 34.04, lon: -118.25 };
const ARRIVALS = [
  {
    routeId: '801',
    routeName: 'A Line',
    headsign: 'APU / Citrus College',
    predictedTime: new Date(Date.now() + 300_000).toISOString(),
    scheduledTime: new Date(Date.now() + 300_000).toISOString(),
    delaySeconds: 0,
    status: 'ontime' as const,
  },
];

function renderStop() {
  return renderWithProviders(<StopRoute />, { route: '/stop/80122', path: '/stop/:stopId' });
}

beforeEach(() => {
  useFavoritesStore.setState({ favorites: [] });
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('<StopRoute>', () => {
  it('shows a loading state first', () => {
    mockFetch({
      '/api/stops': () => jsonResponse([STOP]),
      '/api/arrivals': () => new Promise(() => {}) as unknown as Response, // never resolves
    });
    renderStop();
    expect(screen.getByText('Loading arrivals…')).toBeInTheDocument();
  });

  it('renders the stop name, arrivals, and a demo banner', async () => {
    mockFetch({
      '/api/stops': () => jsonResponse([STOP]),
      '/api/arrivals': () => jsonResponse(ARRIVALS, { headers: { 'X-Data-Source': 'demo' } }),
    });
    renderStop();

    expect(await screen.findByRole('heading', { name: '7th Street / Metro Center' })).toBeInTheDocument();
    expect(await screen.findByLabelText(/Route A Line to APU \/ Citrus College/)).toBeInTheDocument();
    expect(screen.getByRole('note')).toHaveTextContent('demo data');
  });

  it('shows an explicit error state when arrivals fail', async () => {
    mockFetch({
      '/api/stops': () => jsonResponse([STOP]),
      '/api/arrivals': () =>
        jsonResponse({ error: { code: 'UPSTREAM_UNAVAILABLE', message: 'Feed unreachable' } }, { status: 504 }),
    });
    renderStop();
    expect(await screen.findByRole('alert')).toHaveTextContent('Couldn’t load arrivals');
    expect(screen.getByText('Feed unreachable')).toBeInTheDocument();
  });

  it('shows an explicit empty state when there are no arrivals', async () => {
    mockFetch({
      '/api/stops': () => jsonResponse([STOP]),
      '/api/arrivals': () => jsonResponse([]),
    });
    renderStop();
    expect(await screen.findByText('No upcoming arrivals')).toBeInTheDocument();
  });

  it('favourites the stop and persists it', async () => {
    mockFetch({
      '/api/stops': () => jsonResponse([STOP]),
      '/api/arrivals': () => jsonResponse(ARRIVALS),
    });
    renderStop();

    const toggle = await screen.findByRole('button', { name: /Add .* to favourites/ });
    await userEvent.click(toggle);

    await waitFor(() =>
      expect(useFavoritesStore.getState().favorites).toEqual([
        { id: '80122', name: '7th Street / Metro Center' },
      ]),
    );
    expect(screen.getByRole('button', { name: /Remove .* from favourites/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});
