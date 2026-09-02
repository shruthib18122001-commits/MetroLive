import { vi } from 'vitest';

interface FakeResponseInit {
  status?: number;
  headers?: Record<string, string>;
}

/** Minimal `Response` stand-in — enough for `src/lib/apiClient.ts`. */
export function jsonResponse(body: unknown, init: FakeResponseInit = {}): Response {
  const status = init.status ?? 200;
  const headerEntries = Object.entries(init.headers ?? {}).map(
    ([k, v]) => [k.toLowerCase(), v] as const,
  );
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get: (name: string) => headerEntries.find(([k]) => k === name.toLowerCase())?.[1] ?? null,
    },
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  } as unknown as Response;
}

type Route = (url: string) => Response | Promise<Response>;

/** Installs a `fetch` stub that dispatches by pathname. Unmatched paths reject. */
export function mockFetch(routes: Record<string, Route>): ReturnType<typeof vi.fn> {
  const fn = vi.fn((input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input.toString();
    const pathname = url.split('?')[0] ?? url;
    const route = routes[pathname];
    if (!route) return Promise.reject(new Error(`Unmocked fetch: ${url}`));
    return Promise.resolve(route(url));
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}
