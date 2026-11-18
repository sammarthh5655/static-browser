import { useEffect, useMemo, useState } from 'react';
import type { GameProps } from '@/core/types';
import { audio } from '@/audio/engine';
import { useUi } from '@/ui/fx';
import { Hud, hearts } from '../_shared/Hud';
import { memo } from '../_shared/helpers';

const MAX_LEVEL = 16;

export default function GridFlash({ rng, difficulty, onFinish }: GameProps) {
  const showMs = memo(difficulty, 1500, 1000, 650);
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(3);
  const [phase, setPhase] = useState<'show' | 'input' | 'between'>('show');
  const [picked, setPicked] = useState<number[]>([]);
  const [wrong, setWrong] = useState<number[]>([]);
  const [history, setHistory] = useState<boolean[]>([]);
  const [attempt, setAttempt] = useState(0);
  const count = level + 2;
  const size = count <= 5 ? 4 : count <= 9 ? 5 : 6;
  const cells = useMemo(() => rng.sample(Array.from({ length: size * size }, (_, k) => k), count), [rng, level, attempt, size, count]);

  useEffect(() => {
    if (phase !== 'show') return;
    audio.whoosh();
    const t = setTimeout(() => setPhase('input'), showMs + 300);
    return () => clearTimeout(t);
  }, [phase, showMs, cells]);

  const end = (lv: number, hist: boolean[]) => {
    const passed = lv - 1;
    onFinish({ score: Math.round(Math.min(1, passed / (MAX_LEVEL - 1)) * 1000), summary: `Reached ${passed + 2} cells (level ${lv})`, grid: hist.map((h) => (h ? '🟩' : '🟥')).join(''), details: [{ label: 'Best pattern', value: `${passed + 2} cells` }] });
  };

  const click = (k: number) => {
    if (phase !== 'input' || picked.includes(k) || wrong.includes(k)) return;
    if (cells.includes(k)) {
      const np = [...picked, k];
      setPicked(np);
      audio.combo(np.length + level);
      if (np.length === cells.length) {
        audio.success(1);
        const h = [...history, true];
        setHistory(h);
        if (level >= MAX_LEVEL) return end(level + 1, h);
        setPhase('between');
        setTimeout(() => { setLevel((l) => l + 1); setPicked([]); setWrong([]); setPhase('show'); }, 700);
      }
    } else {
      const nw = [...wrong, k];
      setWrong(nw);
      audio.fail();
      useUi.getState().flash();
      if (nw.length >= 3) {
        const h = [...history, false];
        setHistory(h);
        const nl = lives - 1;
        setLives(nl);
        setPhase('between');
        if (nl <= 0) { setTimeout(() => end(level, h), 900); return; }
        setTimeout(() => { setAttempt((a) => a + 1); setPicked([]); setWrong([]); setPhase('show'); }, 900);
      }
    }
  };

  return (
    <div>
      <Hud items={[{ label: 'Level', value: level }, { label: 'Cells', value: count }, { label: 'Lives', value: hearts(lives, 3) }]} />
      <div className="mx-auto grid aspect-square w-full max-w-md gap-2" style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}>
        {Array.from({ length: size * size }, (_, k) => {
          const lit = (phase === 'show' && cells.includes(k)) || picked.includes(k) || (phase === 'between' && cells.includes(k));
          const bad = wrong.includes(k);
          return (
            <button key={k} aria-label={`Cell ${k + 1}`} onClick={() => click(k)} disabled={phase !== 'input'} className="rounded-xl transition-all duration-200" style={{ background: bad ? 'var(--color-bad)' : lit ? 'linear-gradient(135deg, hsl(210 95% 65%), hsl(260 90% 65%))' : 'rgba(255,255,255,.07)', boxShadow: lit ? '0 0 24px hsl(220 95% 60% / .7)' : 'inset 0 0 0 1px rgba(255,255,255,.08)', transform: lit ? 'scale(1.03)' : 'none' }} />
          );
        })}
      </div>
      <p className="mt-4 text-center text-sm text-[var(--color-muted)]">{phase === 'show' ? 'Memorize…' : phase === 'input' ? `Tap the ${count} lit cells · ${3 - wrong.length} misses left` : ' '}</p>
    </div>
  );
}
