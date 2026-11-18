// Smoke test: loads the hub and every game page, starts each game, and reports console errors.
// Usage: npm run build && npx vite preview --port 4173 & node scripts/smoke.mjs [baseUrl] [gameId...]
import { chromium } from 'playwright';
import { readFileSync, mkdirSync } from 'node:fs';

const base = process.argv[2] || 'http://localhost:4173';
const only = process.argv.slice(3);
const games = JSON.parse(readFileSync(new URL('../src/games/catalog.json', import.meta.url), 'utf8')).filter((g) => !only.length || only.includes(g.id));
mkdirSync('shots', { recursive: true });
const browser = await chromium.launch();
let failures = 0;
for (const vp of [{ name: 'desktop', width: 1280, height: 860 }, { name: 'phone', width: 390, height: 844 }]) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, hasTouch: vp.name === 'phone' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  await page.goto(base + '/');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `shots/${vp.name}-home.png` });
  for (const g of games) {
    errors.length = 0;
    await page.goto(`${base}/play/${g.id}`);
    await page.waitForTimeout(500);
    const start = page.getByRole('button', { name: /Start/ });
    await start.click();
    await page.waitForTimeout(3600);
    await page.screenshot({ path: `shots/${vp.name}-${g.id}.png` });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
    const glitch = await page.getByText('This game hit a glitch').count();
    if (errors.length || overflow || glitch) {
      failures++;
      console.log(`✗ ${vp.name} ${g.id}`, overflow ? '(horizontal overflow)' : '', glitch ? '(error boundary)' : '', errors.slice(0, 3));
    } else console.log(`✓ ${vp.name} ${g.id}`);
  }
  await ctx.close();
}
await browser.close();
process.exit(failures ? 1 : 0);
