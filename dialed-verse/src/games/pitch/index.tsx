import { useEffect, useMemo, useRef, useState } from 'react';
import type { GameProps } from '@/core/types';
import { audio, freqToNoteName } from '@/audio/engine';
import { centsBetween, pitchRoundScore } from '@/core/scoring';
import RoundRunner from '../_shared/RoundRunner';
import Knob from '../_shared/Knob';
import { avg, fmt, memo, roundsResult } from '../_shared/helpers';

const FMIN = 110, FMAX = 1320;
const toF = (v: number) => FMIN * Math.pow(FMAX / FMIN, v);

export default function PitchMemory({ rng, difficulty, onFinish }: GameProps) {
  const targets = useMemo(() => Array.from({ length: 5 }, () => toF(rng.range(0.06, 0.94))), [rng]);
  const listen = memo(difficulty, 2400, 1500, 800);
  const [cents, setCents] = useState<number[]>([]);
  return (
    <RoundRunner
      targets={targets}
      memorizeMs={listen + 500}
      maskMs={0}
      showLabel="Listen"
      renderShow={(f) => <Listen freq={f} dur={listen} />}
      renderInput={(f, i, submit) => (
        <Dial key={i} onSubmit={(g) => {
          const c = centsBetween(f, g);
          setCents((a) => [...a, c]);
          const t = freqToNoteName(f), y = freqToNoteName(g);
          submit(pitchRoundScore(c), <span className="font-mono">{Math.round(c)}¢ off · target {t.name}{t.cents >= 0 ? '+' : ''}{t.cents}¢ ({Math.round(f)} Hz) · you {y.name} ({Math.round(g)} Hz)</span>);
        }} />
      )}
      onDone={(s) => onFinish(roundsResult(s, `Avg ${fmt(avg(cents), 0)}¢ off`, cents.map((c, i) => ({ label: `Tone ${i + 1}`, value: `${Math.round(c)}¢` }))))}
    />
  );
}

function Listen({ freq, dur }: { freq: number; dur: number }) {
  useEffect(() => {
    const t = setTimeout(() => audio.tone(freq, dur / 1000, { vol: 0.28 }), 250);
    return () => clearTimeout(t);
  }, [freq, dur]);
  return <Rings playing />;
}

export function Rings({ playing, hue = 200 }: { playing: boolean; hue?: number }) {
  return (
    <div className="relative mx-auto grid aspect-square w-64 place-items-center">
      {[0, 1, 2, 3].map((k) => (
        <span key={k} className="absolute inset-0 rounded-full border-2" style={{ borderColor: `hsl(${hue + k * 25} 95% 65%)`, animation: playing ? `dvring 1.6s ${k * 0.4}s ease-out infinite` : 'none', opacity: playing ? 1 : 0.15 }} />
      ))}
      <span className="text-6xl">{playing ? '🔊' : '🔈'}</span>
      <style>{'@keyframes dvring{0%{transform:scale(.3);opacity:1}100%{transform:scale(1.1);opacity:0}}'}</style>
    </div>
  );
}

function Dial({ onSubmit }: { onSubmit: (f: number) => void }) {
  const [v, setV] = useState(0.5);
  const [preview, setPreview] = useState(false);
  const live = useRef<ReturnType<typeof audio.live> | null>(null);
  useEffect(() => {
    if (preview) { live.current = audio.live(toF(v), 0.28); }
    else { live.current?.stop(); live.current = null; }
    return () => { live.current?.stop(); live.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preview]);
  useEffect(() => { live.current?.set(toF(v)); }, [v]);
  return (
    <div className="glass mx-auto flex max-w-md flex-col items-center rounded-[2rem] p-6">
      <Knob value={v} onChange={setV} hue={200} label="Pitch" />
      <div className="mt-5 flex w-full gap-2">
        <button aria-pressed={preview} className={`btn flex-1 ${preview ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setPreview((p) => !p)}>{preview ? '■ Stop' : '▶ Preview'}</button>
        <button className="btn btn-primary flex-1" onClick={() => { setPreview(false); onSubmit(toF(v)); }}>Lock it in</button>
      </div>
    </div>
  );
}
