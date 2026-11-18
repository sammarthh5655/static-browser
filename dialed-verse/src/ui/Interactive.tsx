import { useRef, type ButtonHTMLAttributes, type ReactNode, type CSSProperties, type PointerEvent as RPE } from 'react';
import { audio } from '@/audio/engine';
import { isReduced } from './fx';

/** Button that leans toward the pointer and plays UI sounds. */
export function MagneticButton({ children, className = '', strength = 0.3, onClick, onPointerEnter, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { strength?: number }) {
  const ref = useRef<HTMLButtonElement>(null);
  const move = (e: RPE<HTMLButtonElement>) => {
    if (isReduced() || e.pointerType !== 'mouse') return;
    const el = ref.current!;
    const r = el.getBoundingClientRect();
    const x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2);
    el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
  };
  const leave = () => { if (ref.current) ref.current.style.transform = ''; };
  return (
    <button
      ref={ref}
      className={`btn ${className}`}
      onPointerMove={move}
      onPointerLeave={leave}
      onPointerEnter={(e) => { audio.hover(); onPointerEnter?.(e); }}
      onClick={(e) => { audio.unlock(); audio.click(); onClick?.(e); }}
      style={{ transition: 'transform .25s cubic-bezier(.2,.8,.2,1)' }}
      {...rest}
    >
      {children}
    </button>
  );
}

/** 3D tilt-on-hover with moving glare. */
export function TiltCard({ children, className = '', style, max = 12 }: { children: ReactNode; className?: string; style?: CSSProperties; max?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const move = (e: RPE<HTMLDivElement>) => {
    if (isReduced() || e.pointerType !== 'mouse') return;
    const el = ref.current!;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    el.style.transform = `perspective(800px) rotateY(${(px - 0.5) * max}deg) rotateX(${(0.5 - py) * max}deg) translateZ(6px)`;
    el.style.setProperty('--gx', `${px * 100}%`);
    el.style.setProperty('--gy', `${py * 100}%`);
  };
  const leave = () => { if (ref.current) ref.current.style.transform = ''; };
  return (
    <div ref={ref} onPointerMove={move} onPointerLeave={leave} className={`relative transition-transform duration-200 ease-out will-change-transform [transform-style:preserve-3d] ${className}`} style={style}>
      {children}
      <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 [.group:hover_&]:opacity-100" style={{ background: 'radial-gradient(400px circle at var(--gx,50%) var(--gy,50%), rgb(255 255 255 / .16), transparent 40%)' }} />
    </div>
  );
}

/** Range slider with gradient track, detent ticks and accessible label. */
export function Slider({ label, value, min, max, step = 1, onChange, track, thumb, format, disabled }: {
  label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void; track?: string; thumb?: string; format?: (v: number) => string; disabled?: boolean;
}) {
  return (
    <label className="block select-none">
      <div className="mb-1 flex items-baseline justify-between text-xs font-bold uppercase tracking-widest text-[var(--color-muted)]">
        <span>{label}</span>
        {format && <span className="font-mono normal-case tracking-normal text-[var(--color-fg)]">{format(value)}</span>}
      </div>
      <input
        type="range"
        className="dv-range"
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        style={{ ['--track' as string]: track, ['--thumb' as string]: thumb }}
        onChange={(e) => { const v = Number(e.target.value); audio.slide((v - min) / (max - min)); onChange(v); }}
      />
    </label>
  );
}

export function Pill({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <span className={`inline-flex items-center gap-1 rounded-full border border-[var(--color-line)] bg-[var(--color-glass)] px-3 py-1 text-xs font-bold ${className}`}>{children}</span>;
}
