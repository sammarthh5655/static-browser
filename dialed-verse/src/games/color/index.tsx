import { useMemo, useState } from 'react';
import type { GameProps } from '@/core/types';
import { deltaEHsb, hsbCss, randomHsb, type HSB } from '@/core/color';
import { colorRoundScore } from '@/core/scoring';
import RoundRunner from '../_shared/RoundRunner';
import ColorPicker, { CompareSwatches } from '../_shared/ColorPicker';
import { avg, fmt, memo, roundsResult } from '../_shared/helpers';

export default function ColorMemory({ rng, difficulty, onFinish }: GameProps) {
  const targets = useMemo(() => Array.from({ length: 5 }, () => randomHsb(rng.next)), [rng]);
  const [des, setDes] = useState<number[]>([]);
  return (
    <RoundRunner
      targets={targets}
      memorizeMs={memo(difficulty, 5000, 3000, 1500)}
      renderShow={(t) => <div className="mx-auto aspect-[4/3] max-h-[52vh] w-full max-w-xl rounded-[2rem] shadow-2xl" style={{ background: hsbCss(t), boxShadow: `0 40px 120px -30px ${hsbCss(t)}` }} />}
      renderInput={(t, i, submit) => (
        <Input key={i} onSubmit={(g) => {
          const de = deltaEHsb(t, g);
          setDes((d) => [...d, de]);
          submit(colorRoundScore(de), <><CompareSwatches target={hsbCss(t)} guess={hsbCss(g)} /><span className="font-mono">ΔE₀₀ {fmt(de)}</span></>);
        }} />
      )}
      onDone={(s) => onFinish(roundsResult(s, `Avg ΔE ${fmt(avg(des))}`, des.map((d, i) => ({ label: `Color ${i + 1}`, value: `ΔE ${fmt(d)}` }))))}
    />
  );
}

function Input({ onSubmit }: { onSubmit: (c: HSB) => void }) {
  const [c, setC] = useState<HSB>({ h: 180, s: 50, b: 60 });
  return <ColorPicker value={c} onChange={setC} onSubmit={() => onSubmit(c)} />;
}
