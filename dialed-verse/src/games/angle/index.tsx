import { useMemo, useRef, useState } from 'react';
import type { GameProps } from '@/core/types';
import { clamp } from '@/core/scoring';
import RoundRunner from '../_shared/RoundRunner';
import { Board, SubmitBar } from '../_shared/Board';
import { useDrag } from '../_shared/useDrag';
import { Slider } from '@/ui/Interactive';
import { avg, fmt, memo, roundsResult } from '../_shared/helpers';

type T = { angle: number; base: number; recallBase: number };
const rad = (d: number) => (d * Math.PI) / 180;
export const angleScore = (err: number) => clamp(Math.exp(-((err / 18) ** 1.4)));

function Rays({ base, angle, hue, arm = 120 }: { base: number; angle: number; hue: number; arm?: number }) {
  const cx = 200, cy = 160;
  const p = (a: number) => [cx + Math.cos(rad(a)) * arm, cy - Math.sin(rad(a)) * arm];
  const [x1, y1] = p(base), [x2, y2] = p(base + angle);
  const large = angle > 180 ? 1 : 0;
  const ar = 38;
  const [ax1, ay1] = [cx + Math.cos(rad(base)) * ar, cy - Math.sin(rad(base)) * ar];
  const [ax2, ay2] = [cx + Math.cos(rad(base + angle)) * ar, cy - Math.sin(rad(base + angle)) * ar];
  return (
    <g filter="url(#dvglow)" strokeLinecap="round">
      <path d={`M${ax1},${ay1} A${ar},${ar} 0 ${large} 0 ${ax2},${ay2}`} fill="none" stroke={`hsl(${hue} 90% 70% / .6)`} strokeWidth="3" />
      <line x1={cx} y1={cy} x2={x1} y2={y1} stroke="#fff" strokeWidth="6" />
      <line x1={cx} y1={cy} x2={x2} y2={y2} stroke={`hsl(${hue} 95% 62%)`} strokeWidth="6" />
      <circle cx={cx} cy={cy} r="7" fill="#fff" />
      <circle cx={x2} cy={y2} r="10" fill={`hsl(${hue} 95% 62%)`} />
    </g>
  );
}

export default function AngleMemory({ rng, difficulty, onFinish }: GameProps) {
  const targets = useMemo<T[]>(() => Array.from({ length: 5 }, () => ({ angle: rng.range(12, 340), base: rng.range(0, 360), recallBase: rng.range(0, 360) })), [rng]);
  const [errs, setErrs] = useState<number[]>([]);
  return (
    <RoundRunner
      targets={targets}
      memorizeMs={memo(difficulty, 3500, 2200, 1100)}
      renderShow={(t) => <Board hue={60}><Rays base={t.base} angle={t.angle} hue={60} /></Board>}
      renderInput={(t, i, submit) => <Input key={i} base={difficulty === 'easy' ? t.base : t.recallBase} onSubmit={(a) => { const e = Math.abs(a - t.angle); setErrs((x) => [...x, e]); submit(angleScore(e), <span className="font-mono">Target {fmt(t.angle, 0)}° · you {fmt(a, 0)}° · {fmt(e)}° off</span>); }} />}
      onDone={(s) => onFinish(roundsResult(s, `Avg ${fmt(avg(errs))}° off`))}
    />
  );
}

function Input({ base, onSubmit }: { base: number; onSubmit: (a: number) => void }) {
  const [a, setA] = useState(90);
  const ref = useRef<SVGSVGElement>(null);
  const drag = useDrag(ref, 400, 300, (x, y) => {
    let ang = (Math.atan2(160 - y, x - 200) * 180) / Math.PI - base;
    ang = ((ang % 360) + 360) % 360;
    setA(Math.max(1, Math.min(359, ang)));
  });
  return (
    <>
      <Board ref={ref} hue={100} {...drag}><Rays base={base} angle={a} hue={100} /></Board>
      <SubmitBar onSubmit={() => onSubmit(a)}><Slider label="Angle (or drag the arm)" min={1} max={359} step={0.5} value={a} onChange={setA} /></SubmitBar>
    </>
  );
}
