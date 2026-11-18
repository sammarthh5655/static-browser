import { useEffect, useMemo, useRef, useState } from 'react';
import type { GameProps } from '@/core/types';
import { audio } from '@/audio/engine';
import { ratioScore } from '@/core/scoring';
import RoundRunner from '../_shared/RoundRunner';
import Knob from '../_shared/Knob';
import { avg, fmt, memo, roundsResult } from '../_shared/helpers';

const BMIN = 40, BMAX = 220;
const toB = (v: number) => BMIN + v * (BMAX - BMIN);

function useMetronome(bpm: number, on: boolean, onBeat?: (k: number) => void) {
  const bpmRef = useRef(bpm);
  bpmRef.current = bpm;
  useEffect(() => {
    if (!on) return;
    let k = 0, t: ReturnType<typeof setTimeout>;
    const step = () => { audio.drum(k % 4 === 0 ? 'kick' : 'hat'); audio.drum('click'); onBeat?.(k++); t = setTimeout(step, 60000 / bpmRef.current); };
    step();
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on]);
}

export default function TempoMemory({ rng, difficulty, onFinish }: GameProps) {
  const beats = memo(difficulty, 12, 8, 5);
  const targets = useMemo(() => Array.from({ length: 5 }, () => Math.round(rng.range(62, 184))), [rng]);
  const [errs, setErrs] = useState<number[]>([]);
  return (
    <RoundRunner
      targets={targets}
      memorizeMs={(b) => (60000 / b) * beats + 200}
      maskMs={0}
      showLabel="Feel the pulse"
      renderShow={(b) => <Pulse bpm={b} />}
      renderInput={(b, i, submit) => <Input key={i} onSubmit={(g) => { const e = (g - b) / b; setErrs((a) => [...a, Math.abs(e)]); submit(ratioScore(b, g, 0.08), <span className="font-mono">Target {b} BPM · you {Math.round(g)} BPM ({e >= 0 ? '+' : ''}{fmt(e * 100)}%)</span>); }} />}
      onDone={(s) => onFinish(roundsResult(s, `Avg ${fmt(avg(errs) * 100)}% off`))}
    />
  );
}

function Pulse({ bpm }: { bpm: number }) {
  const [k, setK] = useState(-1);
  useMetronome(bpm, true, setK);
  return (
    <div className="grid place-items-center py-6">
      <div key={k} className="tile-pop h-56 w-56 rounded-full" style={{ background: 'radial-gradient(circle at 40% 35%, hsl(40 100% 70%), hsl(20 90% 40%))', boxShadow: '0 0 80px hsl(40 100% 55% / .6)', animationDuration: `${Math.min(300, 60000 / bpm / 2)}ms` }} />
    </div>
  );
}

function Input({ onSubmit }: { onSubmit: (b: number) => void }) {
  const [v, setV] = useState(0.4);
  const [play, setPlay] = useState(false);
  const [beat, setBeat] = useState(0);
  const taps = useRef<number[]>([]);
  useMetronome(toB(v), play, setBeat);
  const tap = () => {
    const now = performance.now();
    taps.current = [...taps.current.filter((t) => now - t < 3000), now].slice(-6);
    audio.drum('click');
    if (taps.current.length >= 3) {
      const d = taps.current.slice(1).map((t, i) => t - taps.current[i]);
      const b = 60000 / avg(d);
      setV(Math.max(0, Math.min(1, (b - BMIN) / (BMAX - BMIN))));
    }
  };
  return (
    <div className="glass mx-auto flex max-w-md flex-col items-center rounded-[2rem] p-6">
      <Knob value={v} onChange={setV} hue={40} label="Tempo" display={play ? `beat ${(beat % 4) + 1}` : ' '} />
      <div className="mt-4 grid w-full grid-cols-3 gap-2">
        <button aria-pressed={play} className={`btn ${play ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setPlay((p) => !p)}>{play ? '■' : '▶'} Hear</button>
        <button className="btn btn-ghost" onPointerDown={(e) => { e.preventDefault(); tap(); }}>Tap</button>
        <button className="btn btn-primary" onClick={() => { setPlay(false); onSubmit(toB(v)); }}>Lock</button>
      </div>
      <p className="mt-2 text-xs text-[var(--color-muted)]">Turn the dial, or tap the tempo 3+ times.</p>
    </div>
  );
}
