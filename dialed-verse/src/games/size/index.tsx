import { useMemo, useRef, useState } from 'react';
import type { GameProps } from '@/core/types';
import { ratioScore } from '@/core/scoring';
import RoundRunner from '../_shared/RoundRunner';
import { Board, SubmitBar } from '../_shared/Board';
import { useDrag } from '../_shared/useDrag';
import { Slider } from '@/ui/Interactive';
import { avg, fmt, memo, roundsResult } from '../_shared/helpers';

type T = { r: number; x: number; y: number; hue: number };

export default function SizeMemory({ rng, difficulty, onFinish }: GameProps) {
  const targets = useMemo<T[]>(() => Array.from({ length: 5 }, () => { const r = rng.range(18, 120); return { r, x: rng.range(r + 10, 400 - r - 10), y: rng.range(Math.min(r + 10, 150), Math.max(300 - r - 10, 150)), hue: rng.int(0, 359) }; }), [rng]);
  const [errs, setErrs] = useState<number[]>([]);
  return (
    <RoundRunner
      targets={targets}
      memorizeMs={memo(difficulty, 3500, 2200, 1100)}
      renderShow={(t) => <Board hue={t.hue}><circle cx={t.x} cy={t.y} r={t.r} fill={`hsl(${t.hue} 90% 60%)`} filter="url(#dvglow)" /></Board>}
      renderInput={(t, i, submit) => <Input key={i} hue={(t.hue + 150) % 360} onSubmit={(r) => { const e = (r - t.r) / t.r; setErrs((a) => [...a, Math.abs(e)]); submit(ratioScore(t.r, r, 0.16), <span className="font-mono">{e >= 0 ? '+' : ''}{fmt(e * 100)}% radius</span>); }} />}
      onDone={(s) => onFinish(roundsResult(s, `Avg error ${fmt(avg(errs) * 100)}%`))}
    />
  );
}

function Input({ onSubmit, hue }: { onSubmit: (r: number) => void; hue: number }) {
  const [r, setR] = useState(60);
  const ref = useRef<SVGSVGElement>(null);
  const drag = useDrag(ref, 400, 300, (x, y) => setR(Math.max(5, Math.min(145, Math.hypot(x - 200, y - 150)))));
  return (
    <>
      <Board ref={ref} hue={hue} {...drag} className="cursor-crosshair">
        <circle cx={200} cy={150} r={r} fill={`hsl(${hue} 90% 60% / .85)`} filter="url(#dvglow)" />
        <circle cx={200 + r} cy={150} r={8} fill="#fff" />
      </Board>
      <SubmitBar onSubmit={() => onSubmit(r)}><Slider label="Radius (or drag the board)" min={5} max={145} step={0.5} value={r} onChange={setR} /></SubmitBar>
    </>
  );
}
