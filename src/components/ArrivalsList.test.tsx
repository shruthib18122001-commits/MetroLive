import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { computeInsights } from '../lib/insights';
import type { EnrichedArrival, VanishedArrival } from '../lib/insights';
import type { Arrival } from '../types/transit';
import { renderWithProviders } from '../test/renderWithProviders';
import { ArrivalsList } from './ArrivalsList';

// jsdom has no layout, so the real virtualizer would render zero rows.
vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: (opts: { count: number }) => ({
    getTotalSize: () => opts.count * 72,
    getVirtualItems: () =>
      Array.from({ length: opts.count }, (_, index) => ({ key: index, index, start: index * 72, size: 72 })),
  }),
}));

const NOW = Date.UTC(2026, 0, 15, 12, 0, 0);

const plainArrivals: Arrival[] = [
  {
    routeId: '720',
    routeName: '720',
    headsign: 'Commerce',
    predictedTime: new Date(NOW + 300_000).toISOString(),
    scheduledTime: new Date(NOW + 60_000).toISOString(),
    delaySeconds: 240,
    status: 'late',
    tripId: 't720',
  },
  {
    routeId: '801',
    routeName: 'A Line',
    headsign: 'Azusa',
    predictedTime: new Date(NOW + 600_000).toISOString(),
    scheduledTime: new Date(NOW + 600_000).toISOString(),
    delaySeconds: 0,
    status: 'ontime',
    tripId: 't801',
  },
];

/** Enrich via the real pipeline so the row shape matches production. */
function enrich(arrivals: Arrival[], now = NOW): EnrichedArrival[] {
  return computeInsights({}, arrivals, { now }).insights.arrivals;
}

const baseProps = {
  arrivals: undefined as EnrichedArrival[] | undefined,
  vanished: [] as VanishedArrival[],
  isPending: false,
  isError: false,
  isFetching: false,
  errorMessage: null,
  now: NOW,
  onRetry: () => {},
};

describe('<ArrivalsList>', () => {
  it('shows an explicit loading state', () => {
    renderWithProviders(<ArrivalsList {...baseProps} isPending />);
    expect(screen.getByText('Loading arrivals…')).toBeInTheDocument();
  });

  it('shows an explicit error state with a working retry', async () => {
    const onRetry = vi.fn();
    renderWithProviders(
      <ArrivalsList {...baseProps} isError errorMessage="Upstream is down" onRetry={onRetry} />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Couldn’t load arrivals');
    expect(screen.getByText('Upstream is down')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('shows an explicit empty state', () => {
    renderWithProviders(<ArrivalsList {...baseProps} arrivals={[]} />);
    expect(screen.getByText('No upcoming arrivals')).toBeInTheDocument();
  });

  it('renders arrivals in a polite live region with per-row summaries', () => {
    renderWithProviders(<ArrivalsList {...baseProps} arrivals={enrich(plainArrivals)} />);
    const region = screen.getByRole('region', { name: 'Upcoming arrivals' });
    expect(region).toHaveAttribute('aria-live', 'polite');
    expect(screen.getByLabelText('Route 720 to Commerce. 5 min. 4 min late.')).toBeInTheDocument();
    expect(screen.getByLabelText('Route A Line to Azusa. 10 min. On time.')).toBeInTheDocument();
  });

  it('keeps stale rows visible with a warning when a refetch fails', () => {
    renderWithProviders(<ArrivalsList {...baseProps} arrivals={enrich(plainArrivals)} isError />);
    expect(screen.getByText(/showing the last known times/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Route 720 to Commerce/)).toBeInTheDocument();
  });

  it('shows the vanished / ghost-bus notice', () => {
    const vanished: VanishedArrival[] = [
      {
        key: 'trip:ghost',
        routeId: '4',
        routeName: '4',
        headsign: 'Downtown',
        lastPredictedTime: new Date(NOW + 120_000).toISOString(),
        lastSeenAt: NOW - 45_000,
        wasMinutesAway: 3,
      },
    ];
    renderWithProviders(<ArrivalsList {...baseProps} arrivals={enrich(plainArrivals)} vanished={vanished} />);
    expect(screen.getByRole('region', { name: 'Recently dropped from the feed' })).toBeInTheDocument();
    expect(screen.getByText(/left the feed/i)).toHaveTextContent('4 to Downtown');
  });

  it('surfaces a "slipping later" trend chip', () => {
    const later = computeInsights(
      computeInsights({}, plainArrivals, { now: NOW - 60_000 }).history,
      plainArrivals.map((a) =>
        a.tripId === 't720'
          ? { ...a, predictedTime: new Date(NOW + 300_000 + 150_000).toISOString() }
          : a,
      ),
      { now: NOW },
    ).insights.arrivals;
    renderWithProviders(<ArrivalsList {...baseProps} arrivals={later} />);
    expect(screen.getByText(/later/)).toBeInTheDocument();
  });
});
