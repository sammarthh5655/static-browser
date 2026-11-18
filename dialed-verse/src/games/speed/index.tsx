import { useEffect, useMemo, useRef, useState } from 'react';
import type { GameProps } from '@/core/types';
import { ratioScore } from '@/core/scoring';
import RoundRunner from '../_shared/RoundRunner';
import { Board, SubmitBar } from '../_shared/Board';
import { Slider } from '@/ui/Interactive';
import { avg, fmt, memo, roundsResult } from '../_shared/helpers';

/** Orb crossing the 400-wide board at `speed` units/sec, `passes` times. */
function Mover({ speed, passes, y = 150, hue = 140 }: { speed: number; passes: number; y?: number; hue?: number }) {
  const [x, setX] = useState(-20);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const span = 440;
    const f = () => {
      const d = ((performance.now() - start) / 1000) * speed;
      const pass = Math.floor(d / span);
      if (pass >= passes) { setX(-40); return; }
      setX((d % span) - 20);
      raf = requestAnimationFrame(f);
    };
    f();
    return () => cancelAnimationFrame(raf);
  }, [speed, passes]);
  return (
    <g filter="url(#dvglow)">
      <line x1={x - 60} y1={y} x2={x} y2={y} stroke={`hsl(${hue} 95% 60% / .5)`} strokeWidth="10" strokeLinecap="round" />
      <circle cx={x} cy={y} r="14" fill={`hsl(${hue} 95% 62%)`} />
    </g>
  );
}

export default function SpeedMemory({ rng, difficulty, onFinish }: GameProps) {
  const passes = memo(difficulty, 3, 2, 1);
  const targets = useMemo(() => Array.from({ length: 5 }, () => Math.round(rng.range(90, 620))), [rng]);
  const [errs, setErrs] = useState<number[]>([]);
  return (
    <RoundRunner
      targets={targets}
      memorizeMs={(s) => (440 / s) * passes * 1000 + 300}
      showLabel="Watch the speed"
      renderShow={(s) => <Board hue={140}><Mover speed={s} passes={passes} /></Board>}
      renderInput={(s, i, submit) => <Input key={i} onSubmit={(g) => { const e = (g - s) / s; setErrs((a) => [...a, Math.abs(e)]); submit(ratioScore(s, g, 0.12), <span className="font-mono">{e >= 0 ? '+' : ''}{fmt(e * 100)}% speed</span>); }} />}
      onDone={(s) => onFinish(roundsResult(s, `Avg ${fmt(avg(errs) * 100)}% off`))}
    />
  );
}

function Input({ onSubmit }: { onSubmit: (s: number) => void }) {
  const [v, setV] = useState(300);
  const [run, setRun] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => { clearTimeout(timer.current); timer.current = setTimeout(() => setRun((r) => r + 1), 250); return () => clearTimeout(timer.current); }, [v]);
  return (
    <>
      <Board hue={170}><Mover key={run} speed={v} passes={1} hue={190} /></Board>
      <SubmitBar onSubmit={() => onSubmit(v)}>
        <Slider label="Speed" min={50} max={800} value={v} onChange={setV} track="linear-gradient(90deg,hsl(190 60% 30%),hsl(140 95% 55%),hsl(60 95% 60%))" />
        <button className="mt-2 text-xs font-bold text-[var(--color-accent2)] underline" onClick={() => setRun((r) => r + 1)}>▶ Replay preview</button>
      </SubmitBar>
    </>
  );
}
