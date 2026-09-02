/**
 * Dev-only: serve the Vercel serverless functions under `/api/*` from the Vite
 * dev server, so `npm run dev` is a complete app without `vercel dev`.
 * Production uses the real Vercel runtime; `npm run serve` mirrors it locally.
 */
import type { Plugin } from 'vite';

import { augment } from './api/_adapter';

const ROUTES: Record<string, string> = {
  '/api/arrivals': '/api/arrivals.ts',
  '/api/stops': '/api/stops.ts',
};

export function devApiPlugin(): Plugin {
  return {
    name: 'metrolive-dev-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const rawUrl = req.url ?? '';
        const questionMark = rawUrl.indexOf('?');
        const pathname = questionMark === -1 ? rawUrl : rawUrl.slice(0, questionMark);
        const search = questionMark === -1 ? '' : rawUrl.slice(questionMark + 1);
        const modulePath = ROUTES[pathname];
        if (!modulePath) {
          next();
          return;
        }

        const { req: vReq, res: vRes } = augment(req, res, search);

        void server
          .ssrLoadModule(modulePath)
          .then((mod: Record<string, unknown>) => {
            const handler = mod.default as (rq: unknown, rs: unknown) => unknown;
            return handler(vReq, vRes);
          })
          .catch((err: unknown) => {
            server.config.logger.error(
              `[dev-api] ${modulePath} failed: ${err instanceof Error ? (err.stack ?? err.message) : String(err)}`,
            );
            if (!res.headersSent) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
            }
            res.end(JSON.stringify({ error: { code: 'INTERNAL', message: 'Dev API handler threw.' } }));
          });
      });
    },
  };
}
