import { useEffect, useRef } from 'react';
import { useReducedMotion, useUi } from './fx';
import { useStore } from '@/core/store';

/** Glowing particle trail following fine pointers. Disabled for touch and reduced motion. */
export default function CursorTrail() {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();
  const enabled = useStore((s) => s.settings.cursorTrail);
  useEffect(() => {
    if (reduced || !enabled || !matchMedia('(pointer: fine)').matches) return;
    const c = ref.current!;
    const g = c.getContext('2d')!;
    const dpr = Math.min(2, devicePixelRatio || 1);
    const resize = () => { c.width = innerWidth * dpr; c.height = innerHeight * dpr; };
    resize();
    addEventListener('resize', resize);
    type P = { x: number; y: number; vx: number; vy: number; life: number; h: number };
    const ps: P[] = [];
    let lx = -1, ly = -1, raf = 0, idle = 0;
    const move = (e: PointerEvent) => {
      const x = e.clientX * dpr, y = e.clientY * dpr;
      if (lx < 0) { lx = x; ly = y; }
      const d = Math.hypot(x - lx, y - ly);
      const n = Math.min(4, Math.ceil(d / (14 * dpr)));
      const hue = useUi.getState().hue;
      for (let i = 0; i < n; i++) {
        const t = i / n;
        ps.push({ x: lx + (x - lx) * t, y: ly + (y - ly) * t, vx: (Math.random() - 0.5) * 0.6, vy: (Math.random() - 0.5) * 0.6 - 0.2, life: 1, h: (hue + Math.random() * 60) % 360 });
      }
      if (ps.length > 140) ps.splice(0, ps.length - 140);
      lx = x; ly = y;
      if (!raf) loop();
    };
    const loop = () => {
      g.clearRect(0, 0, c.width, c.height);
      g.globalCompositeOperation = 'lighter';
      for (let i = ps.length - 1; i >= 0; i--) {
        const p = ps[i];
        p.x += p.vx; p.y += p.vy; p.life -= 0.035;
        if (p.life <= 0) { ps.splice(i, 1); continue; }
        g.fillStyle = `hsla(${p.h} 100% 65% / ${p.life * 0.55})`;
        g.beginPath(); g.arc(p.x, p.y, 3.2 * dpr * p.life + 0.5, 0, Math.PI * 2); g.fill();
      }
      if (ps.length) { idle = 0; raf = requestAnimationFrame(loop); } else if (idle++ < 2) raf = requestAnimationFrame(loop); else raf = 0;
    };
    addEventListener('pointermove', move, { passive: true });
    return () => { removeEventListener('pointermove', move); removeEventListener('resize', resize); cancelAnimationFrame(raf); g.clearRect(0, 0, c.width, c.height); };
  }, [reduced, enabled]);
  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-[70] h-full w-full" />;
}
