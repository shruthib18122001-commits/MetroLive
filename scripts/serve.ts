/**
 * Production-like local server: serves the built `dist/` and runs the `/api/*`
 * handlers, mirroring how Vercel would. Used by `npm run serve`, the Playwright
 * `webServer`, and the Lighthouse runs.
 *
 *   npm run build && npm run serve      # http://localhost:4173
 */
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

import { augment } from '../api/_adapter';
import arrivalsHandler from '../api/arrivals';
import stopsHandler from '../api/stops';

type AnyApiHandler = (req: never, res: never) => void | Promise<void>;

const DIST_DIR = fileURLToPath(new URL('../dist/', import.meta.url));
const PORT = Number(process.env.PORT ?? 4173);

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json',
  '.txt': 'text/plain; charset=utf-8',
};

const API: Record<string, AnyApiHandler> = {
  '/api/arrivals': arrivalsHandler,
  '/api/stops': stopsHandler,
};

const server = createServer((req, res) => {
  const rawUrl = req.url ?? '/';
  const questionMark = rawUrl.indexOf('?');
  const pathname = questionMark === -1 ? rawUrl : rawUrl.slice(0, questionMark);
  const search = questionMark === -1 ? '' : rawUrl.slice(questionMark + 1);

  const handler = API[pathname];
  if (handler) {
    const { req: vReq, res: vRes } = augment(req, res, search);
    Promise.resolve(handler(vReq as never, vRes as never)).catch((err: unknown) => {
      if (!res.headersSent) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
      }
      res.end(JSON.stringify({ error: { code: 'INTERNAL', message: String(err) } }));
    });
    return;
  }

  const safePath = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, '');
  let filePath = join(DIST_DIR, safePath);
  if (!filePath.startsWith(DIST_DIR) || !existsSync(filePath) || statSync(filePath).isDirectory()) {
    filePath = join(DIST_DIR, 'index.html'); // SPA fallback
  }

  res.setHeader('Content-Type', MIME[extname(filePath)] ?? 'application/octet-stream');
  createReadStream(filePath).pipe(res);
});

server.listen(PORT, () => {
  console.log(`serve: dist/ + /api on http://localhost:${PORT}`);
});
