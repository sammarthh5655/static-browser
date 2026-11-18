import { useEffect, useState } from 'react';
import type { GameProps } from '@/core/types';
import { audio } from '@/audio/engine';
import { useUi } from '@/ui/fx';
import { Hud, hearts } from '../_shared/Hud';
import { memo } from '../_shared/helpers';

const PADS = [
  { f: 329.63, h: 140 },
  { f: 415.3, h: 50 },
  { f: 554.37, h: 330 },
  { f: 659.25, h: 210 },
];
const MAX = 25;

export default function EchoPads({ rng, difficulty, onFinish }: GameProps) {
  const [seq] = useState(() => Array.from({ length: MAX }, () => rng.int(0, 3)));
  const speed = memo(difficulty, 650, 480, 330);
  const [len, setLen] = useState(1);
  const [pos, setPos] = useState(0);
  const [lit, setLit] = useState(-1);
  const [phase, setPhase] = useState<'show' | 'input' | 'wait'>('wait');
  const [lives, setLives] = useState(memo(difficulty, 2, 1, 1));

  useEffect(() => {
    if (phase !== 'wait') return;
    const t = setTimeout(() => setPhase('show'), 700);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'show') return;
    const ts: ReturnType<typeof setTimeout>[] = [];
    for (let k = 0; k < len; k++) {
      ts.push(setTimeout(() => { setLit(seq[k]); audio.note(PADS[seq[k]].f, speed / 1000, 0, 0.22); }, k * speed));
      ts.push(setTimeout(() => setLit(-1), k * speed + speed * 0.7));
    }
    ts.push(setTimeout(() => { setPos(0); setPhase('input'); }, len * speed));
    return () => ts.forEach(clearTimeout);
  }, [phase, len, seq, speed]);

  const finish = (reached: number) => onFinish({ score: Math.round(Math.min(1, reached / 18) * 1000), summary: `Longest sequence: ${reached}`, grid: '🟪'.repeat(Math.min(reached, 20)), details: [{ label: 'Sequence', value: String(reached) }] });

  const press = (p: number) => {
    if (phase !== 'input') return;
    setLit(p);
    setTimeout(() => setLit(-1), 180);
    if (seq[pos] === p) {
      audio.note(PADS[p].f, 0.3, 0, 0.22);
      if (pos + 1 === len) {
        if (len >= MAX) return finish(MAX);
        audio.combo(len);
        setLen(len + 1);
        setPhase('wait');
      } else setPos(pos + 1);
    } else {
      audio.fail();
      useUi.getState().flash();
      if (lives - 1 <= 0) { setPhase('wait'); setTimeout(() => finish(len - 1), 600); setLives(0); return; }
      setLives(lives - 1);
      setPhase('wait');
    }
  };

  useEffect(() => {
    const k = (e: KeyboardEvent) => { const i = ['1', '2', '3', '4'].indexOf(e.key); if (i >= 0) press(i); };
    addEventListener('keydown', k);
    return () => removeEventListener('keydown', k);
  });

  return (
    <div>
      <Hud items={[{ label: 'Length', value: len }, { label: 'Step', value: phase === 'input' ? `${pos + 1}/${len}` : '—' }, { label: 'Lives', value: hearts(lives, memo(difficulty, 2, 1, 1)) }]} />
      <div className="mx-auto grid aspect-square w-full max-w-sm grid-cols-2 gap-3 rounded-full p-3" style={{ background: 'radial-gradient(circle, #1b1530, #07060f)' }}>
        {PADS.map((p, k) => (
          <button key={k} aria-label={`Pad ${k + 1}`} onPointerDown={(e) => { e.preventDefault(); press(k); }} className="transition-all duration-100" style={{ borderRadius: ['100% 12px 12px 12px', '12px 100% 12px 12px', '12px 12px 12px 100%', '12px 12px 100% 12px'][k], background: `hsl(${p.h} ${lit === k ? '100% 62%' : '55% 28%'})`, boxShadow: lit === k ? `0 0 60px hsl(${p.h} 100% 60%), inset 0 0 30px #fff8` : 'inset 0 -6px 0 rgba(0,0,0,.3)', transform: lit === k ? 'scale(.97)' : 'none' }} />
        ))}
      </div>
      <p className="mt-4 text-center text-sm text-[var(--color-muted)]">{phase === 'show' ? 'Watch & listen…' : phase === 'input' ? 'Your turn (keys 1-4 work too)' : 'Get ready…'}</p>
    </div>
  );
}
