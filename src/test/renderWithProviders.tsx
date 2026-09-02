import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

export function makeTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, refetchOnWindowFocus: false, gcTime: 0 },
    },
  });
}

interface Options {
  route?: string;
  path?: string;
}

/** Renders `ui` inside a fresh QueryClient + MemoryRouter. When `path` is given,
 * `ui` is mounted as that route's element so `useParams()` works. */
export function renderWithProviders(ui: ReactElement, { route = '/', path }: Options = {}) {
  const queryClient = makeTestQueryClient();

  const tree: ReactNode = path ? (
    <Routes>
      <Route path={path} element={ui} />
    </Routes>
  ) : (
    ui
  );

  return {
    queryClient,
    ...render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[route]}>{tree}</MemoryRouter>
      </QueryClientProvider>,
    ),
  };
}
