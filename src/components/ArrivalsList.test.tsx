import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

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

const sampleArrivals: Arrival[] = [
  {
    routeId: '720',
    routeName: '720',
    headsign: 'Commerce',
    predictedTime: new Date(NOW + 300_000).toISOString(),
    scheduledTime: new Date(NOW + 60_000).toISOString(),
    delaySeconds: 240,
    status: 'late',
  },
  {
    routeId: '801',
    routeName: 'A Line',
    headsign: 'Azusa',
    predictedTime: new Date(NOW + 600_000).toISOString(),
    scheduledTime: new Date(NOW + 600_000).toISOString(),
    delaySeconds: 0,
    status: 'ontime',
  },
];

const baseProps = {
  arrivals: undefined,
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
    renderWithProviders(<ArrivalsList {...baseProps} arrivals={sampleArrivals} />);
    const region = screen.getByRole('region', { name: 'Upcoming arrivals' });
    expect(region).toHaveAttribute('aria-live', 'polite');
    expect(screen.getByLabelText('Route 720 to Commerce. 5 min. 4 min late.')).toBeInTheDocument();
    expect(screen.getByLabelText('Route A Line to Azusa. 10 min. On time.')).toBeInTheDocument();
  });

  it('keeps stale rows visible with a warning when a refetch fails', () => {
    renderWithProviders(<ArrivalsList {...baseProps} arrivals={sampleArrivals} isError />);
    expect(screen.getByText(/showing the last known times/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Route 720 to Commerce/)).toBeInTheDocument();
  });
});
