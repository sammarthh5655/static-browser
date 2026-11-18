import { useEffect, useState } from 'react';
import { audio } from '@/audio/engine';
import { isReduced } from './fx';

/** Slot-machine style score reveal: each digit spins then locks left-to-right. */
export default function SlotScore({ value, onDone, className = '' }: { value: number; onDone?: () => void; className?: string }) {
  const digits = String(Math.round(value)).padStart(4, ' ').split('');
  const [locked, setLocked] = useState(isReduced() ? 4 : 0);
  const [spin, setSpin] = useState(0);
  useEffect(() => {
    if (isReduced()) { onDone?.(); return; }
    let i = 0;
    const iv = setInterval(() => { setSpin((s) => s + 1); audio.roll(i++); }, 55);
    const timers = [0, 1, 2, 3].map((k) => setTimeout(() => { setLocked(k + 1); audio.tick(k === 3); if (k === 3) { clearInterval(iv); onDone?.(); } }, 500 + k * 380));
    return () => { clearInterval(iv); timers.forEach(clearTimeout); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return (
    <div className={`flex font-display font-black tabular-nums ${className}`} aria-label={`Score ${value}`}>
      {digits.map((d, i) => {
        const isLocked = i < locked;
        const shown = d === ' ' ? (isLocked ? '' : String((spin + i * 3) % 10)) : isLocked ? d : String((spin * (i + 1) + i * 7) % 10);
        return (
          <span key={i} className={`inline-block min-w-[0.62em] text-center transition-all duration-150 ${isLocked ? 'chroma' : 'opacity-50 blur-[1px]'}`} style={{ transform: isLocked ? 'none' : 'translateY(-4px)' }}>
            {shown}
          </span>
        );
      })}
    </div>
  );
}

/** Simple count-up number. */
export function CountUp({ to, ms = 900 }: { to: number; ms?: number }) {
  const [v, setV] = useState(isReduced() ? to : 0);
  useEffect(() => {
    if (isReduced()) { setV(to); return; }
    const s = performance.now();
    let raf = 0;
    const f = () => { const t = Math.min(1, (performance.now() - s) / ms); setV(Math.round(to * (1 - Math.pow(1 - t, 3)))); if (t < 1) raf = requestAnimationFrame(f); };
    f();
    return () => cancelAnimationFrame(raf);
  }, [to, ms]);
  return <>{v}</>;
}
