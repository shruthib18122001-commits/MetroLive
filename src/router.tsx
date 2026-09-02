import { Suspense, lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';

import { RouteFallback } from './components/RouteFallback';
import { NotFoundRoute } from './routes/NotFoundRoute';
import { RootLayout } from './routes/RootLayout';
import { SearchRoute } from './routes/SearchRoute';

// Lazy-loaded so the search screen's initial bundle stays lean.
const StopRoute = lazy(() =>
  import('./routes/StopRoute').then((module) => ({ default: module.StopRoute })),
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <SearchRoute /> },
      {
        path: 'stop/:stopId',
        element: (
          <Suspense fallback={<RouteFallback />}>
            <StopRoute />
          </Suspense>
        ),
      },
      { path: '*', element: <NotFoundRoute /> },
    ],
  },
]);
