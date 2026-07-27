/**
 * Post-build prerender.
 *
 * WHY THIS EXISTS
 * ---------------
 * Before this script, https://thequantumdistillery.com/ served 1,413 bytes of
 * HTML containing an empty <div id="root"></div>. Every word of the landing page
 * was produced by JavaScript at runtime.
 *
 * Googlebot executes JavaScript and would eventually see that content. AI
 * crawlers — GPTBot, ClaudeBot, PerplexityBot, Google-Extended — do not. They
 * fetch HTML, parse it, and move on. So the site was fully invisible to every
 * answer engine: nothing to read, nothing to cite.
 *
 * This script boots the built site in headless Chromium, waits for React to
 * render, and writes the resulting DOM back into dist/index.html. The browser
 * still boots React exactly as before; a crawler now receives real HTML.
 *
 * Runs automatically after `vite build` via the `build` script in package.json.
 * Idempotent — safe to re-run.
 */

import http from 'node:http';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const PORT = 4183;

// Mirrors vite.config.ts exactly: Netlify builds serve from root, local builds
// keep the legacy GitHub Pages subpath. Getting this wrong means every asset
// 404s during prerender and the page renders empty.
const BASE = process.env.NETLIFY ? '/' : '/quantum-distillery-www/';

/**
 * Routes to prerender.
 *
 * Concept slugs are read from src/lib/concepts.ts rather than duplicated here,
 * so adding a concept automatically gives it a prerendered page and a sitemap
 * entry. A regex is enough — the file is a plain literal array and this avoids
 * pulling a TypeScript loader into the build.
 *
 * /instructor is deliberately absent: it is a dashboard, not content, and is
 * Disallowed in robots.txt.
 */
function conceptSlugs() {
  const src = fs.readFileSync(path.join(ROOT, 'src/lib/concepts.ts'), 'utf8');
  const slugs = [...src.matchAll(/^\s{4}slug:\s*"([^"]+)"/gm)].map((m) => m[1]);
  if (slugs.length === 0) throw new Error('no concept slugs found in src/lib/concepts.ts');
  return slugs;
}

const ROUTES = ['/', '/sim', ...conceptSlugs().map((s) => `/concepts/${s}`)];

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
};

if (!fs.existsSync(path.join(DIST, 'index.html'))) {
  console.error('[prerender] dist/index.html not found — run `vite build` first.');
  process.exit(1);
}

const server = http.createServer((req, res) => {
  let urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);

  // Strip the configured base so both '/' and '/quantum-distillery-www/' resolve.
  if (BASE !== '/' && urlPath.startsWith(BASE)) urlPath = '/' + urlPath.slice(BASE.length);

  let filePath = path.join(DIST, urlPath);

  // Block traversal outside dist.
  if (!filePath.startsWith(DIST)) {
    res.writeHead(403).end('Forbidden');
    return;
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  // SPA fallback, matching public/_redirects.
  if (!fs.existsSync(filePath)) filePath = path.join(DIST, 'index.html');

  res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] ?? 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
});

await new Promise((resolve) => server.listen(PORT, resolve));

// Normally Playwright resolves its own downloaded Chromium (Netlify runs
// `npx playwright install chromium` before the build). Some CI images ship a
// preinstalled browser at a different version; PLAYWRIGHT_CHROMIUM_EXECUTABLE
// lets those environments point at it instead of forcing a second download.
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined;

const browser = await chromium.launch({
  executablePath,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
let failed = null;

try {
  for (const route of ROUTES) {
    const page = await browser.newPage();

    // Surface real client errors rather than silently shipping a blank page.
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));

    const target = `http://localhost:${PORT}${BASE}${route.replace(/^\//, '')}`;
    await page.goto(target, { waitUntil: 'networkidle', timeout: 60_000 });

    // /sim and /instructor are lazy chunks behind a Suspense fallback. Snapshot
    // too early and the page is the words "Loading simulator…" — which would
    // pass a naive length check while shipping nothing. Wait for the fallback
    // to clear before measuring.
    await page
      .waitForFunction(() => !document.body.innerText.includes('Loading simulator'), {
        timeout: 30_000,
      })
      .catch(() => {
        /* not every route has a fallback; carry on and let the guard decide */
      });

    // Let post-mount effects and i18n initialization settle.
    await page.waitForTimeout(2500);

    // Guard: never overwrite a working build with an empty snapshot. If the app
    // failed to render, fail the build loudly instead of silently publishing a
    // blank page — that would be worse than the problem this script fixes.
    const wordCount = await page.evaluate(() => {
      const root = document.getElementById('root');
      const text = root?.innerText?.trim() ?? '';
      return text ? text.split(/\s+/).length : 0;
    });

    // The simulator is a control surface rather than prose, so it legitimately
    // carries fewer words than a content page. Everything else should be
    // substantial or something has gone wrong.
    const minWords = route === '/sim' ? 40 : 100;
    if (wordCount < minWords) {
      throw new Error(
        `${route} rendered only ${wordCount} words (expected ${minWords}+). ` +
          `Refusing to write.${errors.length ? ` Page errors: ${errors.join(' | ')}` : ''}`
      );
    }

    const html = await page.content();
    const outPath =
      route === '/' ? path.join(DIST, 'index.html') : path.join(DIST, route, 'index.html');

    await fsp.mkdir(path.dirname(outPath), { recursive: true });
    await fsp.writeFile(outPath, html, 'utf8');

    console.log(
      `[prerender] ${route} -> ${path.relative(ROOT, outPath)} ` +
        `(${wordCount} words, ${(Buffer.byteLength(html) / 1024).toFixed(1)} KB)`
    );

    await page.close();
  }
} catch (err) {
  failed = err;
} finally {
  await browser.close();
  server.close();
}

if (failed) {
  console.error(`[prerender] FAILED: ${failed.message}`);
  process.exit(1);
}

/**
 * Generate the sitemap from the same route list that was just prerendered, so
 * the two cannot drift. A hand-maintained sitemap listing a route that no
 * longer prerenders — or omitting one that does — is a silent problem.
 */
const SITE = 'https://thequantumdistillery.com';
const today = process.env.SITEMAP_DATE || new Date().toISOString().slice(0, 10);

const priority = (route) => (route === '/' ? '1.0' : route === '/sim' ? '0.9' : '0.8');
const changefreq = (route) => (route === '/' ? 'weekly' : 'monthly');

const sitemap =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<!-- Generated by scripts/prerender.mjs from the prerendered route list. Do not hand-edit. -->\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  ROUTES.map(
    (r) =>
      `  <url>\n` +
      `    <loc>${SITE}${r === '/' ? '/' : r}</loc>\n` +
      `    <lastmod>${today}</lastmod>\n` +
      `    <changefreq>${changefreq(r)}</changefreq>\n` +
      `    <priority>${priority(r)}</priority>\n` +
      `  </url>\n`
  ).join('') +
  `</urlset>\n`;

await fsp.writeFile(path.join(DIST, 'sitemap.xml'), sitemap, 'utf8');
console.log(`[prerender] sitemap.xml -> ${ROUTES.length} URLs`);

console.log('[prerender] done.');
