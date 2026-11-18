import { useMemo, useRef, useState } from 'react';
import type { GameProps } from '@/core/types';
import { clamp } from '@/core/scoring';
import RoundRunner from '../_shared/RoundRunner';
import { Board, SubmitBar } from '../_shared/Board';
import { useDrag } from '../_shared/useDrag';
import { avg, fmt, memo, roundsResult } from '../_shared/helpers';

type T = { x: number; y: number; decoys: { x: number; y: number }[] };

export default function PositionMemory({ rng, difficulty, onFinish }: GameProps) {
  const nDecoys = memo(difficulty, 0, 2, 5);
  const targets = useMemo<T[]>(() => Array.from({ length: 5 }, () => ({ x: rng.range(20, 380), y: rng.range(20, 280), decoys: Array.from({ length: nDecoys }, () => ({ x: rng.range(15, 385), y: rng.range(15, 285) })) })), [rng, nDecoys]);
  const [errs, setErrs] = useState<number[]>([]);
  return (
    <RoundRunner
      targets={targets}
      memorizeMs={memo(difficulty, 2500, 1600, 900)}
      showLabel="Remember the glowing dot"
      renderShow={(t) => (
        <Board hue={340}>
          {t.decoys.map((d, k) => <rect key={k} x={d.x - 6} y={d.y - 6} width="12" height="12" fill="rgba(255,255,255,.35)" transform={`rotate(45 ${d.x} ${d.y})`} />)}
          <circle cx={t.x} cy={t.y} r="9" fill="hsl(340 95% 62%)" filter="url(#dvglow)" />
        </Board>
      )}
      renderInput={(t, i, submit) => <Input key={i} onSubmit={(x, y) => {
        const d = Math.hypot(x - t.x, y - t.y) / 4; // percent of width
        setErrs((e) => [...e, d]);
        submit(clamp(Math.exp(-((d / 7) ** 1.3))), <span className="font-mono">{fmt(d)}% of the board away</span>);
      }} />}
      onDone={(s) => onFinish(roundsResult(s, `Avg ${fmt(avg(errs))}% off`))}
    />
  );
}

function Input({ onSubmit }: { onSubmit: (x: number, y: number) => void }) {
  const [p, setP] = useState<{ x: number; y: number } | null>(null);
  const ref = useRef<SVGSVGElement>(null);
  const drag = useDrag(ref, 400, 300, (x, y) => setP({ x: Math.max(0, Math.min(400, x)), y: Math.max(0, Math.min(300, y)) }));
  return (
    <>
      <Board ref={ref} hue={300} {...drag} className="cursor-crosshair">
        {p && <><line x1={p.x} y1={0} x2={p.x} y2={300} stroke="rgba(255,255,255,.15)" /><line x1={0} y1={p.y} x2={400} y2={p.y} stroke="rgba(255,255,255,.15)" /><circle cx={p.x} cy={p.y} r="9" fill="hsl(190 95% 60%)" filter="url(#dvglow)" /></>}
        {!p && <text x="200" y="155" textAnchor="middle" fill="rgba(255,255,255,.4)" fontSize="16" fontWeight="700">Tap where the dot was</text>}
      </Board>
      <SubmitBar onSubmit={() => p && onSubmit(p.x, p.y)} label={p ? 'Lock it in' : 'Place the dot'}><span className="text-sm text-[var(--color-muted)]">Drag to fine-tune.</span></SubmitBar>
    </>
  );
}
