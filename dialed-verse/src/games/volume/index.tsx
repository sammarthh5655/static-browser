import { useEffect, useMemo, useState } from 'react';
import type { GameProps } from '@/core/types';
import { audio } from '@/audio/engine';
import { clamp } from '@/core/scoring';
import RoundRunner from '../_shared/RoundRunner';
import { Rings } from '../pitch/index';
import { Slider } from '@/ui/Interactive';
import { avg, fmt, memo, roundsResult } from '../_shared/helpers';

const gainOf = (db: number) => 0.6 * Math.pow(10, db / 20);
type T = { db: number; freq: number };

export default function VolumeMemory({ rng, difficulty, onFinish }: GameProps) {
  const targets = useMemo<T[]>(() => Array.from({ length: 5 }, () => ({ db: Math.round(rng.range(-32, -2) * 2) / 2, freq: rng.pick([220, 330, 392, 440, 523, 659]) })), [rng]);
  const dur = memo(difficulty, 2, 1.4, 0.8);
  const [errs, setErrs] = useState<number[]>([]);
  return (
    <RoundRunner
      targets={targets}
      memorizeMs={dur * 1000 + 600}
      maskMs={0}
      showLabel="Listen to the loudness"
      renderShow={(t) => <Play t={t} dur={dur} />}
      renderInput={(t, i, submit) => <Input key={i} freq={t.freq} dur={dur} onSubmit={(g) => { const e = Math.abs(g - t.db); setErrs((a) => [...a, e]); submit(clamp(Math.exp(-((e / 4.5) ** 1.3))), <span className="font-mono">Target {t.db} dB · you {g} dB · {fmt(e)} dB off</span>); }} />}
      onDone={(s) => onFinish(roundsResult(s, `Avg ${fmt(avg(errs))} dB off`))}
    />
  );
}

function Play({ t, dur }: { t: T; dur: number }) {
  useEffect(() => { const x = setTimeout(() => audio.tone(t.freq, dur, { vol: gainOf(t.db), type: 'triangle' }), 200); return () => clearTimeout(x); }, [t, dur]);
  return <Rings playing hue={160} />;
}

function Input({ freq, dur, onSubmit }: { freq: number; dur: number; onSubmit: (db: number) => void }) {
  const [db, setDb] = useState(-18);
  return (
    <div className="glass mx-auto max-w-md rounded-[2rem] p-6">
      <div className="mb-6 flex h-40 items-end justify-center gap-1.5">
        {Array.from({ length: 20 }, (_, k) => { const th = -40 + k * 2; const on = db >= th; return <span key={k} className="w-3 rounded-sm transition-colors" style={{ height: `${20 + k * 4}%`, background: on ? `hsl(${150 - k * 7} 90% 55%)` : 'rgba(255,255,255,.1)' }} />; })}
      </div>
      <Slider label="Fader" min={-40} max={0} step={0.5} value={db} onChange={setDb} track="linear-gradient(90deg,#123,hsl(150 90% 50%),hsl(10 90% 55%))" />
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button className="btn btn-ghost" onClick={() => audio.tone(freq, dur, { vol: gainOf(db), type: 'triangle' })}>▶ Preview</button>
        <button className="btn btn-primary" onClick={() => onSubmit(db)}>Lock it in</button>
      </div>
      <p className="mt-2 text-center text-xs text-[var(--color-muted)]">Keep your device volume fixed during a run.</p>
    </div>
  );
}
