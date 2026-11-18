import { useRef, type KeyboardEvent, type PointerEvent } from 'react';
import { audio } from '@/audio/engine';

/** Rotary knob, 0..1. Drag in a circle or up/down; arrow keys for fine control. */
export default function Knob({ value, onChange, size = 220, hue = 200, label, display }: { value: number; onChange: (v: number) => void; size?: number; hue?: number; label: string; display?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{ y: number; v: number } | null>(null);
  const START = -135, SWEEP = 270;
  const angle = START + value * SWEEP;
  const set = (v: number) => {
    const c = Math.max(0, Math.min(1, v));
    if (Math.abs(c - value) > 0.0005) audio.slide(c);
    onChange(c);
  };
  const down = (e: PointerEvent) => {
    (e.target as Element).setPointerCapture(e.pointerId);
    drag.current = { y: e.clientY, v: value };
  };
  const move = (e: PointerEvent) => {
    if (!drag.current) return;
    const dy = drag.current.y - e.clientY;
    const fine = e.shiftKey ? 0.15 : 1;
    set(drag.current.v + (dy / 320) * fine);
  };
  const up = () => { drag.current = null; };
  const key = (e: KeyboardEvent) => {
    const step = e.shiftKey ? 0.05 : 0.004;
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') { e.preventDefault(); set(value + step); }
    if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') { e.preventDefault(); set(value - step); }
  };
  const ticks = Array.from({ length: 41 }, (_, i) => i / 40);
  return (
    <div className="flex flex-col items-center">
      <div
        ref={ref}
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(value * 100)}
        aria-valuetext={display}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onKeyDown={key}
        className="relative cursor-ns-resize touch-none select-none rounded-full"
        style={{ width: size, height: size }}
      >
        <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full">
          {ticks.map((t) => {
            const a = ((START + t * SWEEP - 90) * Math.PI) / 180;
            const on = t <= value + 1e-6;
            const r1 = 92, r2 = t % 0.25 < 0.001 ? 80 : 85;
            return <line key={t} x1={100 + Math.cos(a) * r1} y1={100 + Math.sin(a) * r1} x2={100 + Math.cos(a) * r2} y2={100 + Math.sin(a) * r2} stroke={on ? `hsl(${hue + t * 80} 95% 65%)` : 'rgba(255,255,255,.18)'} strokeWidth="2.5" strokeLinecap="round" />;
          })}
        </svg>
        <div className="absolute inset-[16%] rounded-full" style={{ background: `radial-gradient(circle at 35% 30%, hsl(${hue} 30% 32%), hsl(${hue} 40% 8%))`, boxShadow: `0 20px 50px -10px rgba(0,0,0,.8), inset 0 2px 1px rgba(255,255,255,.2), 0 0 60px -10px hsl(${hue} 90% 55% / .6)` }}>
          <div className="absolute inset-0" style={{ transform: `rotate(${angle}deg)` }}>
            <div className="absolute left-1/2 top-[8%] h-[22%] w-2 -translate-x-1/2 rounded-full" style={{ background: `hsl(${hue} 95% 70%)`, boxShadow: `0 0 12px hsl(${hue} 95% 60%)` }} />
          </div>
        </div>
      </div>
      {display && <div className="mt-2 font-mono text-sm text-[var(--color-muted)]">{display}</div>}
      <div className="mt-1 text-[11px] text-[var(--color-muted)]">Drag up/down · Shift = fine · Arrow keys</div>
    </div>
  );
}
