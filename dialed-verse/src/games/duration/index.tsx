import { useEffect, useMemo, useRef, useState } from 'react';
import type { GameProps } from '@/core/types';
import { audio } from '@/audio/engine';
import { ratioScore } from '@/core/scoring';
import RoundRunner from '../_shared/RoundRunner';
import { avg, fmt, roundsResult } from '../_shared/helpers';

export default function DurationMemory({ rng, difficulty, onFinish }: GameProps) {
  const targets = useMemo(() => Array.from({ length: 5 }, () => Math.round(rng.range(0.6, 4.8) * 100) / 100), [rng]);
  const [errs, setErrs] = useState<number[]>([]);
  const withTone = difficulty !== 'hard';
  return (
    <RoundRunner
      targets={targets}
      memorizeMs={(d) => d * 1000 + 900}
      maskMs={0}
      showLabel="Feel the duration"
      renderShow={(d) => <Glow seconds={d} tone={withTone} />}
      renderInput={(d, i, submit) => <Hold key={i} onSubmit={(g) => { const e = (g - d) / d; setErrs((a) => [...a, Math.abs(e)]); submit(ratioScore(d, g, 0.1), <span className="font-mono">Target {fmt(d, 2)}s · you {fmt(g, 2)}s</span>); }} />}
      onDone={(s) => onFinish(roundsResult(s, `Avg ${fmt(avg(errs) * 100)}% off`))}
    />
  );
}

function Glow({ seconds, tone }: { seconds: number; tone: boolean }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const a = setTimeout(() => { setOn(true); if (tone) audio.tone(392, seconds, { vol: 0.18, type: 'triangle' }); }, 400);
    const b = setTimeout(() => setOn(false), 400 + seconds * 1000);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, [seconds, tone]);
  return (
    <div className="grid place-items-center py-8">
      <div className="h-56 w-56 rounded-full transition-all duration-75" style={{ background: on ? 'radial-gradient(circle, hsl(45 100% 75%), hsl(30 100% 50%))' : 'rgba(255,255,255,.06)', boxShadow: on ? '0 0 120px hsl(45 100% 60%)' : 'none' }} />
    </div>
  );
}

function Hold({ onSubmit }: { onSubmit: (s: number) => void }) {
  const [held, setHeld] = useState(false);
  const t0 = useRef(0);
  const stop = useRef<() => void>(() => {});
  const done = useRef(false);
  const down = () => { if (done.current || held) return; t0.current = performance.now(); setHeld(true); stop.current = audio.tone(392, 30, { vol: 0.14, type: 'triangle' }); };
  const up = () => { if (!held || done.current) return; done.current = true; setHeld(false); stop.current(); onSubmit((performance.now() - t0.current) / 1000); };
  useEffect(() => {
    const kd = (e: KeyboardEvent) => { if (e.key === ' ' && !e.repeat) { e.preventDefault(); down(); } };
    const ku = (e: KeyboardEvent) => { if (e.key === ' ') { e.preventDefault(); up(); } };
    addEventListener('keydown', kd); addEventListener('keyup', ku);
    return () => { removeEventListener('keydown', kd); removeEventListener('keyup', ku); stop.current(); };
  });
  return (
    <div className="grid place-items-center py-4">
      <button onPointerDown={(e) => { e.preventDefault(); (e.target as Element).setPointerCapture?.(e.pointerId); down(); }} onPointerUp={up} onPointerCancel={up} onContextMenu={(e) => e.preventDefault()} className="grid h-56 w-56 touch-none select-none place-items-center rounded-full font-display text-xl font-black transition-all" style={{ background: held ? 'radial-gradient(circle, hsl(45 100% 75%), hsl(30 100% 50%))' : 'radial-gradient(circle at 35% 30%, hsl(45 60% 40%), hsl(30 60% 15%))', boxShadow: held ? '0 0 120px hsl(45 100% 60%)' : '0 20px 60px -20px #000', transform: held ? 'scale(.96)' : 'none', color: held ? '#3a1a00' : '#fff' }}>
        {held ? 'HOLDING…' : 'PRESS & HOLD'}
      </button>
      <p className="mt-3 text-sm text-[var(--color-muted)]">Hold the button (or Space) for the same duration.</p>
    </div>
  );
}
