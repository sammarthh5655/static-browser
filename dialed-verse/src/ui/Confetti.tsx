import { useEffect, useRef } from 'react';
import { isReduced } from './fx';

type Particle = { x: number; y: number; vx: number; vy: number; rot: number; vr: number; life: number; color: string; size: number; shape: number };
let particles: Particle[] = [];
let kick: (() => void) | null = null;

const PALETTE = ['#ff3fb4', '#36e6ff', '#b388ff', '#ffd23f', '#43f0a0', '#ffffff'];

/** Fire a confetti/particle burst from a point (viewport coords). */
export function burst(x = innerWidth / 2, y = innerHeight / 3, opts: { count?: number; spread?: number; power?: number; colors?: string[] } = {}) {
  if (isReduced()) return;
  const { count = 120, spread = Math.PI * 2, power = 12, colors = PALETTE } = opts;
  for (let i = 0; i < count; i++) {
    const a = -Math.PI / 2 + (Math.random() - 0.5) * spread;
    const v = power * (0.4 + Math.random() * 0.8);
    particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, life: 1, color: colors[i % colors.length], size: 5 + Math.random() * 7, shape: Math.random() < 0.5 ? 0 : 1 });
  }
  kick?.();
}

export function rain() {
  if (isReduced()) return;
  for (let i = 0; i < 6; i++) setTimeout(() => burst(Math.random() * innerWidth, -20, { count: 40, spread: 1.2, power: 4 }), i * 120);
}

export default function ConfettiLayer() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!;
    const g = c.getContext('2d')!;
    let raf = 0;
    const dpr = Math.min(2, devicePixelRatio || 1);
    const resize = () => { c.width = innerWidth * dpr; c.height = innerHeight * dpr; };
    resize();
    addEventListener('resize', resize);
    const loop = () => {
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, innerWidth, innerHeight);
      particles = particles.filter((p) => p.life > 0 && p.y < innerHeight + 40);
      for (const p of particles) {
        p.vy += 0.32; p.vx *= 0.985; p.vy *= 0.985; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life -= 0.006;
        g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.globalAlpha = Math.min(1, p.life * 2);
        g.fillStyle = p.color;
        if (p.shape) g.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        else { g.beginPath(); g.arc(0, 0, p.size / 2.6, 0, Math.PI * 2); g.fill(); }
        g.restore();
      }
      raf = particles.length ? requestAnimationFrame(loop) : 0;
      if (!raf) g.clearRect(0, 0, innerWidth, innerHeight);
    };
    kick = () => { if (!raf) raf = requestAnimationFrame(loop); };
    return () => { kick = null; cancelAnimationFrame(raf); removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-[80] h-full w-full" />;
}
