/**
 * Runs Lighthouse (mobile) against a URL and prints category scores + key
 * metrics + transfer size. Assumes something is already serving the target
 * (e.g. `npm run serve`).
 *
 *   npm run lighthouse -- http://localhost:4173/ baseline
 *   npm run lighthouse -- http://localhost:4173/stop/80122 after
 *
 * Full JSON reports are written to `lighthouse/<label>-<page>.json`.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import * as chromeLauncher from 'chrome-launcher';
import lighthouse from 'lighthouse';

const url = process.argv[2] ?? 'http://localhost:4173/';
const label = process.argv[3] ?? 'run';

const outDir = fileURLToPath(new URL('../lighthouse/', import.meta.url));
mkdirSync(outDir, { recursive: true });

const chrome = await chromeLauncher.launch({
  chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu'],
});

try {
  const runnerResult = await lighthouse(
    url,
    { port: chrome.port, output: 'json', logLevel: 'error' },
    {
      extends: 'lighthouse:default',
      settings: {
        formFactor: 'mobile',
        screenEmulation: { mobile: true, width: 390, height: 844, deviceScaleFactor: 2, disabled: false },
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      },
    },
  );

  if (!runnerResult) throw new Error('Lighthouse returned no result');
  const { lhr } = runnerResult;

  const pageSlug = new URL(url).pathname.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'home';
  writeFileSync(`${outDir}${label}-${pageSlug}.json`, JSON.stringify(lhr, null, 2));

  const pct = (id: string): string => {
    const score = lhr.categories[id]?.score;
    return score === null || score === undefined ? '  —' : String(Math.round(score * 100)).padStart(3);
  };
  const metric = (id: string): string => lhr.audits[id]?.displayValue ?? '—';
  const transferKb = Math.round(
    ((lhr.audits['total-byte-weight']?.numericValue ?? 0) / 1024) * 10,
  ) / 10;

  console.log(`\n  Lighthouse — ${label} — ${url}`);
  console.log('  ─────────────────────────────────────────');
  console.log(`  Performance     ${pct('performance')}`);
  console.log(`  Accessibility   ${pct('accessibility')}`);
  console.log(`  Best Practices  ${pct('best-practices')}`);
  console.log(`  SEO             ${pct('seo')}`);
  console.log('  ─────────────────────────────────────────');
  console.log(`  FCP   ${metric('first-contentful-paint')}`);
  console.log(`  LCP   ${metric('largest-contentful-paint')}`);
  console.log(`  TBT   ${metric('total-blocking-time')}`);
  console.log(`  CLS   ${metric('cumulative-layout-shift')}`);
  console.log(`  SI    ${metric('speed-index')}`);
  console.log(`  Transfer  ${transferKb} KiB\n`);
} finally {
  await chrome.kill();
}
