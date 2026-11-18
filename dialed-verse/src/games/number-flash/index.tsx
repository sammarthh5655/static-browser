import { useEffect, useRef, useState } from 'react';
import type { GameProps } from '@/core/types';
import { audio } from '@/audio/engine';
import { useUi } from '@/ui/fx';
import { Hud, hearts } from '../_shared/Hud';
import { memo } from '../_shared/helpers';

export default function NumberFlash({ rng, difficulty, onFinish }: GameProps) {
  const per = memo(difficulty, 700, 450, 280);
  const [digits, setDigits] = useState(4);
  const [num, setNum] = useState(() => Array.from({ length: 4 }, () => rng.int(0, 9)).join(''));
  const [phase, setPhase] = useState<'show' | 'input' | 'feedback'>('show');
  const [val, setVal] = useState('');
  const [lives, setLives] = useState(2);
  const [best, setBest] = useState(3);
  const [last, setLast] = useState<{ ok: boolean; num: string; val: string } | null>(null);
  const [hist, setHist] = useState<boolean[]>([]);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (phase !== 'show') return;
    const t = setTimeout(() => { setPhase('input'); setVal(''); setTimeout(() => input.current?.focus(), 30); }, 600 + digits * per);
    return () => clearTimeout(t);
  }, [phase, digits, per]);

  const next = (d: number) => { setDigits(d); setNum(Array.from({ length: d }, () => rng.int(0, 9)).join('')); setPhase('show'); };

  const submit = () => {
    const ok = val === num;
    setLast({ ok, num, val });
    const h = [...hist, ok];
    setHist(h);
    setPhase('feedback');
    if (ok) {
      audio.combo(digits);
      const b = Math.max(best, digits);
      setBest(b);
      setTimeout(() => next(digits + 1), 900);
    } else {
      audio.fail();
      useUi.getState().flash();
      if (lives <= 1) {
        setLives(0);
        setTimeout(() => onFinish({ score: Math.round(Math.min(1, (best - 3) / 12) * 1000), summary: `Recalled ${best} digits`, grid: h.map((x) => (x ? '🟩' : '🟥')).join(''), details: [{ label: 'Max digits', value: String(best) }] }), 1100);
      } else { setLives(lives - 1); setTimeout(() => next(digits), 1100); }
    }
  };

  return (
    <div className="mx-auto max-w-2xl text-center">
      <Hud items={[{ label: 'Digits', value: digits }, { label: 'Best', value: best }, { label: 'Lives', value: hearts(lives, 2) }]} />
      <div className="glass grid min-h-[12rem] place-items-center rounded-[2rem] p-6">
        {phase === 'show' && <div className="tile-pop break-all font-mono text-5xl font-bold tracking-[0.2em] sm:text-6xl">{num}</div>}
        {phase === 'input' && (
          <form onSubmit={(e) => { e.preventDefault(); if (val) submit(); }} className="w-full">
            <input ref={input} inputMode="numeric" pattern="[0-9]*" autoComplete="off" aria-label="Your answer" value={val} onChange={(e) => setVal(e.target.value.replace(/\D/g, '').slice(0, 30))} className="w-full bg-transparent text-center font-mono text-5xl font-bold tracking-[0.2em] outline-none" placeholder="…" />
            <button className="btn btn-primary mt-4" disabled={!val}>Submit</button>
          </form>
        )}
        {phase === 'feedback' && last && (
          <div>
            <div className="font-display text-4xl font-black" style={{ color: last.ok ? 'var(--color-good)' : 'var(--color-bad)' }}>{last.ok ? 'Correct!' : 'Not quite'}</div>
            <div className="mt-2 font-mono text-lg">{last.num.split('').map((d, k) => <span key={k} style={{ color: last.val[k] === d ? 'var(--color-good)' : 'var(--color-bad)' }}>{d}</span>)}</div>
          </div>
        )}
      </div>
    </div>
  );
}
