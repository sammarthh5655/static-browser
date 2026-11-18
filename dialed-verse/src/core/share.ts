import type { GameMeta, GameResult, Mode } from './types';
import { rankFor, roundEmoji } from './scoring';
import { dayNumber } from './rng';

export const SITE_URL = (import.meta.env.VITE_SITE_URL as string) || (typeof location !== 'undefined' ? location.origin : 'https://dialed-verse.vercel.app');

export function shareText(meta: GameMeta, r: GameResult, mode: Mode): string {
  const rank = rankFor(r.score);
  const grid = r.grid ?? (r.rounds?.length ? r.rounds.map(roundEmoji).join('') : '');
  const head = mode === 'daily' ? `${meta.emoji} ${meta.name} #${dayNumber()}` : `${meta.emoji} ${meta.name} (practice)`;
  return [head, `${r.score}/1000 · ${rank.emoji} ${rank.title}`, grid, r.summary, `${SITE_URL.replace(/^https?:\/\//, '')}/play/${meta.id}`]
    .filter(Boolean)
    .join('\n');
}

/** Draws a 1200x630 share card. */
export async function drawShareCard(meta: GameMeta, r: GameResult, mode: Mode): Promise<HTMLCanvasElement> {
  const W = 1200, H = 630;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d')!;
  try { await document.fonts?.ready; } catch { /* ignore */ }
  const hue = meta.hue;
  // background
  const bg = g.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, `hsl(${hue} 70% 10%)`);
  bg.addColorStop(0.55, '#07060f');
  bg.addColorStop(1, `hsl(${(hue + 80) % 360} 80% 14%)`);
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  // aurora blobs
  const blob = (x: number, y: number, rad: number, col: string) => {
    const gr = g.createRadialGradient(x, y, 0, x, y, rad);
    gr.addColorStop(0, col); gr.addColorStop(1, 'transparent');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
  };
  blob(980, 120, 420, `hsla(${hue} 95% 60% / 0.45)`);
  blob(160, 560, 380, `hsla(${(hue + 140) % 360} 95% 60% / 0.35)`);
  // grid lines
  g.strokeStyle = 'rgba(255,255,255,0.05)'; g.lineWidth = 1;
  for (let x = 0; x < W; x += 40) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
  for (let y = 0; y < H; y += 40) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  // glass panel
  g.fillStyle = 'rgba(255,255,255,0.06)';
  g.strokeStyle = 'rgba(255,255,255,0.18)'; g.lineWidth = 2;
  roundRect(g, 60, 60, W - 120, H - 120, 36); g.fill(); g.stroke();

  const rank = rankFor(r.score);
  g.fillStyle = 'rgba(255,255,255,0.7)';
  g.font = '600 28px Manrope, system-ui, sans-serif';
  g.fillText(mode === 'daily' ? `DAILY #${dayNumber()}` : 'PRACTICE', 110, 130);
  g.font = '800 64px Unbounded, system-ui, sans-serif';
  g.fillStyle = '#fff';
  g.fillText(`${meta.emoji} ${meta.name}`, 110, 210);

  // score with chromatic aberration
  g.font = '900 190px Unbounded, system-ui, sans-serif';
  const sx = 110, sy = 420;
  g.globalCompositeOperation = 'lighter';
  g.fillStyle = 'rgba(255,40,120,0.75)'; g.fillText(String(r.score), sx - 5, sy);
  g.fillStyle = 'rgba(40,220,255,0.75)'; g.fillText(String(r.score), sx + 5, sy);
  g.globalCompositeOperation = 'source-over';
  g.fillStyle = '#fff'; g.fillText(String(r.score), sx, sy);
  const sw = g.measureText(String(r.score)).width;
  g.font = '700 40px Manrope, system-ui, sans-serif';
  g.fillStyle = 'rgba(255,255,255,0.55)';
  g.fillText('/1000', sx + sw + 16, sy);

  g.font = '800 44px Unbounded, system-ui, sans-serif';
  g.fillStyle = rank.color;
  g.fillText(`${rank.emoji} ${rank.title}`, 110, 500);

  // rounds bars
  const rounds = r.rounds ?? [];
  if (rounds.length) {
    const bw = Math.min(56, 380 / rounds.length - 10);
    rounds.forEach((v, i) => {
      const x = 720 + i * (bw + 10), h = 30 + v * 190;
      const gr = g.createLinearGradient(0, 470 - h, 0, 470);
      gr.addColorStop(0, `hsl(${(hue + i * 25) % 360} 95% 65%)`);
      gr.addColorStop(1, `hsla(${(hue + i * 25) % 360} 95% 50% / 0.3)`);
      g.fillStyle = gr;
      roundRect(g, x, 470 - h, bw, h, 10); g.fill();
    });
  }
  g.font = '600 26px Manrope, system-ui, sans-serif';
  g.fillStyle = 'rgba(255,255,255,0.75)';
  g.fillText(r.summary.slice(0, 48), 720, 520);
  g.fillStyle = 'rgba(255,255,255,0.5)';
  g.font = '700 24px Manrope, system-ui, sans-serif';
  g.fillText(`${SITE_URL.replace(/^https?:\/\//, '')}/play/${meta.id}`, 110, 545);
  g.textAlign = 'right';
  g.font = '900 30px Unbounded, system-ui, sans-serif';
  g.fillStyle = '#fff';
  g.fillText('DIALED·VERSE', W - 110, 130);
  return c;
}

function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta); ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
}
