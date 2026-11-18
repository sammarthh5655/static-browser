import { useMemo, useRef, useState } from 'react';
import type { GameProps } from '@/core/types';
import { ratioScore } from '@/core/scoring';
import RoundRunner from '../_shared/RoundRunner';
import { Board, SubmitBar } from '../_shared/Board';
import { useDrag } from '../_shared/useDrag';
import { Slider } from '@/ui/Interactive';
import { avg, fmt, memo, roundsResult } from '../_shared/helpers';

type T = { len: number; ang: number; cx: number; cy: number; recallAng: number };
const rad = (d: number) => (d * Math.PI) / 180;

function Line({ cx, cy, len, ang, hue }: { cx: number; cy: number; len: number; ang: number; hue: number }) {
  const dx = (Math.cos(rad(ang)) * len) / 2, dy = (Math.sin(rad(ang)) * len) / 2;
  return (
    <g filter="url(#dvglow)" strokeLinecap="round">
      <line x1={cx - dx} y1={cy - dy} x2={cx + dx} y2={cy + dy} stroke={`hsl(${hue} 95% 62%)`} strokeWidth="8" />
      <circle cx={cx - dx} cy={cy - dy} r="6" fill="#fff" /><circle cx={cx + dx} cy={cy + dy} r="6" fill="#fff" />
    </g>
  );
}

export default function LengthMemory({ rng, difficulty, onFinish }: GameProps) {
  const rotate = difficulty !== 'easy';
  const targets = useMemo<T[]>(() => Array.from({ length: 5 }, () => {
    const len = rng.range(50, 250);
    const ang = rotate ? rng.range(-60, 60) : 0;
    return { len, ang, cx: rng.range(70 + len / 3, 330 - len / 3), cy: rng.range(90, 210), recallAng: rotate ? rng.range(-40, 40) + (difficulty === 'hard' ? 90 : 0) : 0 };
  }), [rng, rotate, difficulty]);
  const [errs, setErrs] = useState<number[]>([]);
  return (
    <RoundRunner
      targets={targets}
      memorizeMs={memo(difficulty, 3000, 2000, 1000)}
      renderShow={(t) => <Board hue={100}><Line {...t} hue={100} /></Board>}
      renderInput={(t, i, submit) => <Input key={i} ang={t.recallAng} onSubmit={(l) => { const e = (l - t.len) / t.len; setErrs((a) => [...a, Math.abs(e)]); submit(ratioScore(t.len, l, 0.13), <span className="font-mono">{e >= 0 ? '+' : ''}{fmt(e * 100)}% length</span>); }} />}
      onDone={(s) => onFinish(roundsResult(s, `Avg error ${fmt(avg(errs) * 100)}%`))}
    />
  );
}

function Input({ ang, onSubmit }: { ang: number; onSubmit: (l: number) => void }) {
  const [len, setLen] = useState(120);
  const ref = useRef<SVGSVGElement>(null);
  const drag = useDrag(ref, 400, 300, (x, y) => setLen(Math.max(10, Math.min(290, 2 * Math.hypot(x - 200, y - 150)))));
  return (
    <>
      <Board ref={ref} hue={160} {...drag}><Line cx={200} cy={150} len={len} ang={ang} hue={160} /></Board>
      <SubmitBar onSubmit={() => onSubmit(len)}><Slider label="Length (or drag)" min={10} max={290} step={0.5} value={len} onChange={setLen} /></SubmitBar>
    </>
  );
}
