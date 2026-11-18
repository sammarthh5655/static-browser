import { useMemo, useState } from 'react';
import type { GameProps } from '@/core/types';
import { colorRoundScore } from '@/core/scoring';
import RoundRunner from '../_shared/RoundRunner';
import { CompareSwatches } from '../_shared/ColorPicker';
import { Slider } from '@/ui/Interactive';
import { avg, fmt, memo, roundsResult } from '../_shared/helpers';

/** CIE L* (0-100) -> sRGB gray css */
export function grayFromL(L: number) {
  const Y = L > 8 ? ((L + 16) / 116) ** 3 : L / 903.3;
  const s = Y <= 0.0031308 ? 12.92 * Y : 1.055 * Y ** (1 / 2.4) - 0.055;
  const v = Math.round(Math.max(0, Math.min(1, s)) * 255);
  return `rgb(${v},${v},${v})`;
}

export default function ShadeMatch({ rng, difficulty, onFinish }: GameProps) {
  const targets = useMemo(() => Array.from({ length: 5 }, () => Math.round(rng.range(6, 96))), [rng]);
  const [errs, setErrs] = useState<number[]>([]);
  const surround = 'radial-gradient(circle, #1a1a22, #0a0a10)';
  return (
    <RoundRunner
      targets={targets}
      memorizeMs={memo(difficulty, 4000, 2500, 1200)}
      renderShow={(L) => <div className="mx-auto grid aspect-[4/3] w-full max-w-xl place-items-center rounded-[2rem] p-10" style={{ background: surround }}><div className="h-full w-full rounded-3xl" style={{ background: grayFromL(L) }} /></div>}
      renderInput={(L, i, submit) => <Input key={i} surround={surround} onSubmit={(g) => { const d = Math.abs(g - L); setErrs((e) => [...e, d]); submit(colorRoundScore(d * 1.1), <><CompareSwatches target={grayFromL(L)} guess={grayFromL(g)} /><span className="font-mono">ΔL* {fmt(d)} (target L* {L}, you {g})</span></>); }} />}
      onDone={(s) => onFinish(roundsResult(s, `Avg ΔL* ${fmt(avg(errs))}`))}
    />
  );
}

function Input({ onSubmit, surround }: { onSubmit: (L: number) => void; surround: string }) {
  const [L, setL] = useState(50);
  return (
    <div className="grid gap-5 sm:grid-cols-2 sm:items-center">
      <div className="grid aspect-square place-items-center rounded-[2rem] p-8" style={{ background: surround }}><div className="h-full w-full rounded-3xl" style={{ background: grayFromL(L) }} /></div>
      <div className="glass rounded-3xl p-5">
        <Slider label="Lightness" min={0} max={100} value={L} onChange={setL} track="linear-gradient(90deg,#000,#fff)" thumb={grayFromL(L)} />
        <button className="btn btn-primary mt-5 w-full" onClick={() => onSubmit(L)}>Lock it in</button>
      </div>
    </div>
  );
}
