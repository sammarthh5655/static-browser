import { useEffect, useMemo, useRef, useState } from 'react';
import type { GameProps } from '@/core/types';
import { audio } from '@/audio/engine';
import { clamp } from '@/core/scoring';
import RoundRunner from '../_shared/RoundRunner';
import { avg, fmt, memo, roundsResult } from '../_shared/helpers';

const UNITS = [150, 300, 450, 600];

export default function RhythmEcho({ rng, difficulty, onFinish }: GameProps) {
  const beats = memo(difficulty, 4, 6, 8);
  const targets = useMemo(() => Array.from({ length: 4 }, (_, r) => Array.from({ length: beats - 1 + (r > 1 ? 1 : 0) }, () => rng.pick(difficulty === 'easy' ? [300, 600] : UNITS))), [rng, beats, difficulty]);
  const [errs, setErrs] = useState<number[]>([]);
  return (
    <RoundRunner
      targets={targets}
      memorizeMs={(t) => 600 + t.reduce((a, b) => a + b, 0) + 700}
      maskMs={0}
      showLabel="Listen"
      renderShow={(t) => <Player intervals={t} />}
      renderInput={(t, i, submit) => <Tapper key={i} n={t.length + 1} onDone={(taps) => {
        const got = taps.slice(1).map((x, k) => x - taps[k]);
        const e = got.map((g, k) => Math.abs(g - t[k]));
        const m = avg(e);
        setErrs((a) => [...a, m]);
        submit(avg(e.map((x) => clamp(Math.exp(-((x / 75) ** 1.3))))), <span className="font-mono">Avg {fmt(m, 0)} ms off per beat</span>);
      }} />}
      onDone={(s) => onFinish(roundsResult(s, `Avg ${fmt(avg(errs), 0)} ms timing error`))}
    />
  );
}

/** Plays the pattern with synced visual beats. */
function Player({ intervals }: { intervals: number[] }) {
  const [active, setActive] = useState(-1);
  const [done, setDone] = useState(false);
  useEffect(() => {
    const times = [600];
    intervals.forEach((d) => times.push(times[times.length - 1] + d));
    const ts = times.map((t, k) => setTimeout(() => { setActive(k); audio.drum(k === 0 ? 'kick' : 'click'); }, t));
    ts.push(setTimeout(() => setDone(true), times[times.length - 1] + 500));
    return () => ts.forEach(clearTimeout);
  }, [intervals]);
  return (
    <div className="glass mx-auto max-w-xl rounded-[2rem] p-8 text-center">
      <div className="flex justify-center gap-3">
        {[0, ...intervals].map((_, k) => <span key={k} className="h-6 w-6 rounded-full transition-all duration-100" style={{ background: k === active ? 'hsl(20 95% 60%)' : k < active ? 'hsl(20 60% 40%)' : 'rgba(255,255,255,.12)', transform: k === active ? 'scale(1.5)' : 'none', boxShadow: k === active ? '0 0 30px hsl(20 95% 60%)' : 'none' }} />)}
      </div>
      <p className="mt-6 text-sm text-[var(--color-muted)]">{done ? 'Your turn…' : 'Listen closely'}</p>
    </div>
  );
}

function Tapper({ n, onDone }: { n: number; onDone: (taps: number[]) => void }) {
  const [taps, setTaps] = useState<number[]>([]);
  const [hit, setHit] = useState(0);
  const doneRef = useRef(false);
  const tap = () => {
    if (doneRef.current) return;
    const now = performance.now();
    audio.drum(taps.length === 0 ? 'kick' : 'click');
    setHit((h) => h + 1);
    setTaps((t) => {
      const nt = [...t, now];
      if (nt.length >= n && !doneRef.current) { doneRef.current = true; setTimeout(() => onDone(nt), 250); }
      return nt;
    });
  };
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.repeat || e.key === 'Tab' || e.key === 'Enter') return; e.preventDefault(); tap(); };
    addEventListener('keydown', k);
    return () => removeEventListener('keydown', k);
  });
  return (
    <div className="mx-auto max-w-xl text-center">
      <div className="mb-4 flex justify-center gap-3">{Array.from({ length: n }, (_, k) => <span key={k} className="h-4 w-4 rounded-full" style={{ background: k < taps.length ? 'hsl(20 95% 60%)' : 'rgba(255,255,255,.15)' }} />)}</div>
      <button key={hit} onPointerDown={(e) => { e.preventDefault(); tap(); }} className="tile-pop mx-auto grid aspect-square w-64 max-w-full place-items-center rounded-full font-display text-2xl font-black text-white" style={{ background: 'radial-gradient(circle at 35% 30%, hsl(20 95% 65%), hsl(350 80% 35%))', boxShadow: '0 30px 80px -20px hsl(20 95% 55%), inset 0 2px 0 rgba(255,255,255,.4)' }}>
        TAP
      </button>
      <p className="mt-3 text-sm text-[var(--color-muted)]">Tap {n} beats · pad, Space or any key</p>
      {taps.length > 0 && taps.length < n && <button className="btn btn-ghost mt-2 !py-1.5 text-xs" onClick={() => setTaps([])}>Restart taps</button>}
    </div>
  );
}
