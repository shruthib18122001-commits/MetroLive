import type { VercelRequest, VercelResponse } from '@vercel/node';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  FIXTURE_NOW_MS,
  FIXTURE_STOP_A,
  buildTripUpdatesFixture,
} from '../src/lib/__fixtures__/feed';
import type { ArrivalsErrorBody, ArrivalsResponse } from '../src/types/transit';
import handler, { readFeedConfig } from './arrivals';

interface CapturedResponse {
  statusCode: number;
  body: unknown;
  headers: Map<string, string>;
}

function fakeReqRes(req: Partial<VercelRequest>): { req: VercelRequest; res: VercelResponse; out: CapturedResponse } {
  const out: CapturedResponse = { statusCode: 0, body: undefined, headers: new Map() };
  const res = {
    status(code: number) {
      out.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      out.body = payload;
      return this;
    },
    setHeader(name: string, value: string) {
      out.headers.set(name.toLowerCase(), value);
      return this;
    },
    getHeader(name: string) {
      return out.headers.get(name.toLowerCase());
    },
    end() {
      return this;
    },
  };
  return {
    req: { method: 'GET', query: {}, ...req } as VercelRequest,
    res: res as unknown as VercelResponse,
    out,
  };
}

function stubFetchOnce(response: Partial<Response> & { arrayBuffer?: () => Promise<ArrayBuffer> }): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve(response as Response)),
  );
}

function okFeedResponse(): Response {
  // Copy into a fresh, exact-length ArrayBuffer (protobuf's Buffer output can be
  // a pooled view, and Buffer#slice would hand back the whole pool).
  const bytes = new Uint8Array(buildTripUpdatesFixture());
  return {
    ok: true,
    status: 200,
    arrayBuffer: () => Promise.resolve(bytes.buffer),
  } as unknown as Response;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('readFeedConfig', () => {
  it('returns null without an API key', () => {
    expect(readFeedConfig({} as NodeJS.ProcessEnv)).toBeNull();
    expect(readFeedConfig({ SWIFTLY_API_KEY: '   ' } as NodeJS.ProcessEnv)).toBeNull();
  });

  it('defaults the feed URL to the LA Metro bus TripUpdates endpoint', () => {
    expect(readFeedConfig({ SWIFTLY_API_KEY: 'k' } as NodeJS.ProcessEnv)).toEqual({
      apiKey: 'k',
      url: 'https://api.goswift.ly/real-time/lametro/gtfs-rt-trip-updates',
    });
  });

  it('honours a METRO_TRIP_UPDATES_URL override', () => {
    expect(
      readFeedConfig({ SWIFTLY_API_KEY: 'k', METRO_TRIP_UPDATES_URL: 'https://example/rail' } as NodeJS.ProcessEnv),
    ).toEqual({ apiKey: 'k', url: 'https://example/rail' });
  });
});

describe('GET /api/arrivals', () => {
  it('rejects non-GET methods with 405', async () => {
    const { req, res, out } = fakeReqRes({ method: 'POST' });
    await handler(req, res);
    expect(out.statusCode).toBe(405);
    expect((out.body as ArrivalsErrorBody).error.code).toBe('METHOD_NOT_ALLOWED');
    expect(out.headers.get('allow')).toBe('GET');
  });

  it('requires a stopId', async () => {
    vi.stubEnv('SWIFTLY_API_KEY', 'test-key');
    const { req, res, out } = fakeReqRes({ query: {} });
    await handler(req, res);
    expect(out.statusCode).toBe(400);
    expect((out.body as ArrivalsErrorBody).error.code).toBe('MISSING_STOP_ID');
  });

  it('serves demo arrivals (X-Data-Source: demo) when no API key is configured', async () => {
    vi.stubEnv('SWIFTLY_API_KEY', '');
    vi.stubEnv('ARRIVALS_DEMO', '');
    const { req, res, out } = fakeReqRes({ query: { stopId: FIXTURE_STOP_A } });
    await handler(req, res);
    expect(out.statusCode).toBe(200);
    expect(out.headers.get('x-data-source')).toBe('demo');
    const body = out.body as ArrivalsResponse;
    expect(body.length).toBeGreaterThan(0);
    expect(body.every((a) => a.predictedTime !== null)).toBe(true);
  });

  it('returns 500 NOT_CONFIGURED when no key and ARRIVALS_DEMO=0', async () => {
    vi.stubEnv('SWIFTLY_API_KEY', '');
    vi.stubEnv('ARRIVALS_DEMO', '0');
    const { req, res, out } = fakeReqRes({ query: { stopId: FIXTURE_STOP_A } });
    await handler(req, res);
    expect(out.statusCode).toBe(500);
    expect((out.body as ArrivalsErrorBody).error.code).toBe('NOT_CONFIGURED');
  });

  it('fetches, decodes, filters, and returns a typed arrivals array', async () => {
    vi.stubEnv('SWIFTLY_API_KEY', 'test-key');
    stubFetchOnce(okFeedResponse());
    const { req, res, out } = fakeReqRes({ query: { stopId: FIXTURE_STOP_A } });

    await handler(req, res);

    expect(out.statusCode).toBe(200);
    const body = out.body as ArrivalsResponse;
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
    expect(body.every((a) => typeof a.routeId === 'string' && typeof a.status === 'string')).toBe(true);
    expect(out.headers.get('cache-control')).toContain('s-maxage=20');
    expect(out.headers.get('x-data-source')).toBe('live');
    expect(out.headers.get('x-feed-timestamp')).toBe(new Date(FIXTURE_NOW_MS).toISOString());

    const fetchMock = vi.mocked(fetch);
    expect(fetchMock).toHaveBeenCalledOnce();
    const [, init] = fetchMock.mock.calls[0] ?? [];
    expect((init?.headers as Record<string, string>).Authorization).toBe('test-key');
  });

  it('maps an upstream non-2xx to 502 UPSTREAM_ERROR', async () => {
    vi.stubEnv('SWIFTLY_API_KEY', 'test-key');
    stubFetchOnce({ ok: false, status: 503, arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)) });
    const { req, res, out } = fakeReqRes({ query: { stopId: FIXTURE_STOP_A } });
    await handler(req, res);
    expect(out.statusCode).toBe(502);
    expect((out.body as ArrivalsErrorBody).error.code).toBe('UPSTREAM_ERROR');
    expect(out.headers.get('cache-control')).toBe('no-store');
  });

  it('maps an upstream network failure to 504 UPSTREAM_UNAVAILABLE', async () => {
    vi.stubEnv('SWIFTLY_API_KEY', 'test-key');
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('ECONNRESET'))),
    );
    const { req, res, out } = fakeReqRes({ query: { stopId: FIXTURE_STOP_A } });
    await handler(req, res);
    expect(out.statusCode).toBe(504);
    expect((out.body as ArrivalsErrorBody).error.code).toBe('UPSTREAM_UNAVAILABLE');
  });

  it('maps undecodable upstream bytes to 502 DECODE_FAILED', async () => {
    vi.stubEnv('SWIFTLY_API_KEY', 'test-key');
    stubFetchOnce({
      ok: true,
      status: 200,
      arrayBuffer: () => Promise.resolve(new Uint8Array([0xff, 0xff, 0xff, 0xff, 0xff]).buffer),
    });
    const { req, res, out } = fakeReqRes({ query: { stopId: FIXTURE_STOP_A } });
    await handler(req, res);
    expect(out.statusCode).toBe(502);
    expect((out.body as ArrivalsErrorBody).error.code).toBe('DECODE_FAILED');
  });
});
