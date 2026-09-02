/**
 * Adapts Node's raw `(req, res)` to the small slice of the Vercel function
 * signature our handlers use (`req.query`, `res.status().json()`), so the same
 * `api/*.ts` handlers can run under the Vite dev server and the standalone
 * `scripts/serve.ts` as well as on Vercel. Files prefixed `_` are not routes.
 */
import type { IncomingMessage, ServerResponse } from 'node:http';

export interface VercelLikeRequest extends IncomingMessage {
  query: Record<string, string | string[]>;
}

export interface VercelLikeResponse extends ServerResponse {
  status(code: number): VercelLikeResponse;
  json(payload: unknown): VercelLikeResponse;
  send(payload: unknown): VercelLikeResponse;
}

export type VercelLikeHandler = (
  req: VercelLikeRequest,
  res: VercelLikeResponse,
) => void | Promise<void>;

export function parseQuery(search: string): Record<string, string | string[]> {
  const params = new URLSearchParams(search);
  const query: Record<string, string | string[]> = {};
  for (const key of new Set(params.keys())) {
    const all = params.getAll(key);
    query[key] = all.length > 1 ? all : (all[0] ?? '');
  }
  return query;
}

export function augment(
  req: IncomingMessage,
  res: ServerResponse,
  search: string,
): { req: VercelLikeRequest; res: VercelLikeResponse } {
  const vReq = Object.assign(req, { query: parseQuery(search) });
  const vRes = res as VercelLikeResponse;

  vRes.status = (code: number) => {
    res.statusCode = code;
    return vRes;
  };
  vRes.json = (payload: unknown) => {
    if (!res.headersSent) res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(payload));
    return vRes;
  };
  vRes.send = (payload: unknown) => {
    res.end(typeof payload === 'string' ? payload : JSON.stringify(payload));
    return vRes;
  };

  return { req: vReq, res: vRes };
}
