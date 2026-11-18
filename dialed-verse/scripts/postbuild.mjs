// Post-build: per-game prerendered HTML (unique title/description/OG per URL), sitemap.xml and the SW precache list.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const site = (process.env.VITE_SITE_URL || 'https://dialed-verse.vercel.app').replace(/\/$/, '');
const games = JSON.parse(readFileSync(join(root, 'src/games/catalog.json'), 'utf8'));
const html = readFileSync(join(dist, 'index.html'), 'utf8');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

function page(path, title, desc) {
  let out = html
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/(<meta name="description" content=")[^"]*/, `$1${esc(desc)}`)
    .replace(/(<meta property="og:title" content=")[^"]*/, `$1${esc(title)}`)
    .replace(/(<meta property="og:description" content=")[^"]*/, `$1${esc(desc)}`)
    .replace(/(<meta name="twitter:title" content=")[^"]*/, `$1${esc(title)}`)
    .replace(/(<meta name="twitter:description" content=")[^"]*/, `$1${esc(desc)}`)
    .replace(/(<meta property="og:url" content=")[^"]*/, `$1${site}${path}`)
    .replace(/(<link rel="canonical" href=")[^"]*/, `$1${site}${path}`)
    .replaceAll('https://dialed-verse.vercel.app/og/og.png', `${site}/og/og.png`);
  const dir = join(dist, path);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), out);
}

for (const g of games) page(`/play/${g.id}`, `${g.name} · Daily ${g.category} game · Dialed-verse`, `${g.tagline} ${g.howTo[0]} Free daily challenge, same for everyone.`);
page('/stats', 'Your stats · Dialed-verse', 'Streaks, history charts, heatmaps and 60+ achievements.');
page('/leaderboards', 'Leaderboards · Dialed-verse', 'Daily, weekly and all-time leaderboards for every game.');
page('/settings', 'Settings · Dialed-verse', 'Sound mixer, themes, motion and color-vision settings.');
page('/about', 'About · Dialed-verse', 'How Dialed-verse works: daily seeds, perceptual scoring, synthesized sound.');

const urls = ['/', '/stats', '/leaderboards', '/about', ...games.map((g) => `/play/${g.id}`)];
const today = new Date().toISOString().slice(0, 10);
writeFileSync(join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${site}${u}</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq><priority>${u === '/' ? '1.0' : '0.8'}</priority></url>`).join('\n')}\n</urlset>\n`);
writeFileSync(join(dist, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${site}/sitemap.xml\n`);

// Precache list for the service worker: every built asset (games are small, so the whole site works offline).
const assets = [];
const walk = (d) => readdirSync(d).forEach((f) => { const p = join(d, f); statSync(p).isDirectory() ? walk(p) : assets.push(p.slice(dist.length).replace(/\\/g, '/')); });
walk(join(dist, 'assets'));
// Firebase chunks are only fetched when leaderboards are configured; don't precache them.
for (let i = assets.length - 1; i >= 0; i--) if (/\.js$/.test(assets[i]) && readFileSync(join(dist, assets[i]), 'utf8').includes('@firebase/')) assets.splice(i, 1);
const precache = ['/', '/manifest.webmanifest', '/icons/icon.svg', '/icons/icon-192.png', ...assets];
const sw = readFileSync(join(dist, 'sw.js'), 'utf8')
  .replace('self.__PRECACHE__ = []', `self.__PRECACHE__ = ${JSON.stringify(precache)}`)
  .replace('__VERSION__', String(Date.now()));
writeFileSync(join(dist, 'sw.js'), sw);
console.log(`postbuild: ${games.length} game pages, sitemap (${urls.length} urls), ${precache.length} precached files`);
