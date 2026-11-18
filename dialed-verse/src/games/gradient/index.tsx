import { useMemo, useState } from 'react';
import type { GameProps } from '@/core/types';
import { deltaEHsb, hsbCss, randomHsb, type HSB } from '@/core/color';
import { colorRoundScore } from '@/core/scoring';
import RoundRunner from '../_shared/RoundRunner';
import { HsbSliders } from '../_shared/ColorPicker';
import { avg, fmt, memo, roundsResult } from '../_shared/helpers';

const grad = (a: HSB, b: HSB) => `linear-gradient(90deg, ${hsbCss(a)}, ${hsbCss(b)})`;

export default function GradientRecall({ rng, difficulty, onFinish }: GameProps) {
  const targets = useMemo(() => Array.from({ length: 4 }, () => {
    const a = randomHsb(rng.next);
    const b = { ...randomHsb(rng.next), h: (a.h + rng.int(60, 200)) % 360 };
    return [a, b] as const;
  }), [rng]);
  const [des, setDes] = useState<number[]>([]);
  return (
    <RoundRunner
      targets={targets}
      memorizeMs={memo(difficulty, 6000, 4000, 2200)}
      renderShow={([a, b]) => <div className="mx-auto aspect-[16/9] w-full max-w-2xl rounded-[2rem]" style={{ background: grad(a, b), boxShadow: `0 40px 100px -30px ${hsbCss(a)}` }} />}
      renderInput={([a, b], i, submit) => <Input key={i} onSubmit={(x, y) => {
        const d1 = deltaEHsb(a, x), d2 = deltaEHsb(b, y);
        setDes((d) => [...d, (d1 + d2) / 2]);
        submit((colorRoundScore(d1) + colorRoundScore(d2)) / 2, <><div className="mx-auto mb-1 max-w-sm overflow-hidden rounded-xl"><div className="h-8" style={{ background: grad(a, b) }} /><div className="h-8" style={{ background: grad(x, y) }} /></div><span className="font-mono">Left ΔE {fmt(d1)} · Right ΔE {fmt(d2)}</span></>);
      }} />}
      onDone={(s) => onFinish(roundsResult(s, `Avg ΔE ${fmt(avg(des))}`))}
    />
  );
}

function Input({ onSubmit }: { onSubmit: (a: HSB, b: HSB) => void }) {
  const [a, setA] = useState<HSB>({ h: 0, s: 60, b: 70 });
  const [b, setB] = useState<HSB>({ h: 200, s: 60, b: 70 });
  const [tab, setTab] = useState<0 | 1>(0);
  return (
    <div>
      <div className="mx-auto mb-4 aspect-[16/7] w-full max-w-2xl overflow-hidden rounded-[2rem]" style={{ background: grad(a, b) }}>
        <div className="flex h-full">
          {[0, 1].map((k) => <button key={k} aria-label={k ? 'Edit right stop' : 'Edit left stop'} onClick={() => setTab(k as 0 | 1)} className={`flex-1 transition ${tab === k ? 'ring-4 ring-inset ring-white/80' : ''}`} />)}
        </div>
      </div>
      <div className="glass mx-auto max-w-xl rounded-3xl p-5">
        <div className="mb-4 grid grid-cols-2 gap-2">
          {(['Left stop', 'Right stop'] as const).map((l, k) => (
            <button key={l} onClick={() => setTab(k as 0 | 1)} className={`flex items-center justify-center gap-2 rounded-xl py-2 text-sm font-bold ${tab === k ? 'bg-[var(--color-fg)] text-[var(--color-bg)]' : 'border border-[var(--color-line)]'}`}>
              <span className="h-4 w-4 rounded-full ring-1 ring-white/40" style={{ background: hsbCss(k ? b : a) }} />{l}
            </button>
          ))}
        </div>
        {tab === 0 ? <HsbSliders value={a} onChange={setA} /> : <HsbSliders value={b} onChange={setB} />}
        <button className="btn btn-primary mt-5 w-full" onClick={() => onSubmit(a, b)}>Lock both in</button>
      </div>
    </div>
  );
}
