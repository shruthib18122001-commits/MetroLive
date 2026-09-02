import type { VercelRequest, VercelResponse } from '@vercel/node';
import { describe, expect, it } from 'vitest';

import type { StopSummary, StopsErrorBody } from '../src/types/transit';
import handler from './stops';

interface Captured {
  statusCode: number;
  body: unknown;
  headers: Map<string, string>;
}

function invoke(query: Record<string, string | string[]>, method = 'GET'): Captured {
  const out: Captured = { statusCode: 0, body: undefined, headers: new Map() };
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
    end() {
      return this;
    },
  };
  handler({ method, query } as unknown as VercelRequest, res as unknown as VercelResponse);
  return out;
}

describe('GET /api/stops', () => {
  it('rejects non-GET methods', () => {
    const out = invoke({}, 'POST');
    expect(out.statusCode).toBe(405);
    expect((out.body as StopsErrorBody).error.code).toBe('METHOD_NOT_ALLOWED');
  });

  it('400s when ?q is missing or too short', () => {
    expect(invoke({}).statusCode).toBe(400);
    expect(invoke({ q: 'a' }).statusCode).toBe(400);
    expect((invoke({}).body as StopsErrorBody).error.code).toBe('MISSING_QUERY');
  });

  it('returns matching stops for a name query', () => {
    const out = invoke({ q: 'union station' });
    expect(out.statusCode).toBe(200);
    const stops = out.body as StopSummary[];
    expect(stops.length).toBeGreaterThan(0);
    expect(stops.length).toBeLessThanOrEqual(25);
    expect(stops.every((s) => /union station/i.test(s.name))).toBe(true);
    expect(stops[0]).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
      lat: expect.any(Number),
      lon: expect.any(Number),
    });
  });

  it('returns a single stop for an exact ?id lookup, or []', () => {
    const hit = invoke({ id: '80122' });
    expect(hit.statusCode).toBe(200);
    expect((hit.body as StopSummary[])[0]?.name).toMatch(/metro center/i);

    const miss = invoke({ id: 'definitely-not-a-real-stop' });
    expect(miss.statusCode).toBe(200);
    expect(miss.body).toEqual([]);
  });

  it('caches search and lookup responses at the edge', () => {
    expect(invoke({ q: 'vermont' }).headers.get('cache-control')).toContain('s-maxage=');
    expect(invoke({ id: '3' }).headers.get('cache-control')).toContain('s-maxage=');
  });
});
