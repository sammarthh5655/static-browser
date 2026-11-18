import { useMemo, useState } from 'react';
import type { GameProps } from '@/core/types';
import { deltaEHsb, hsbCss, type HSB } from '@/core/color';
import { colorRoundScore } from '@/core/scoring';
import RoundRunner from '../_shared/RoundRunner';
import { HsbSliders } from '../_shared/ColorPicker';
import { avg, fmt, memo, roundsResult } from '../_shared/helpers';
import type { Rng } from '@/core/rng';

const PARTS = ['skin', 'hair', 'eyes', 'shirt'] as const;
type Part = (typeof PARTS)[number];
type Palette = Record<Part, HSB>;

function palette(rng: Rng): Palette {
  const dyed = rng.bool(0.3);
  return {
    skin: { h: rng.int(12, 36), s: rng.int(22, 62), b: rng.int(38, 96) },
    hair: dyed ? { h: rng.int(0, 359), s: rng.int(55, 95), b: rng.int(55, 95) } : { h: rng.int(15, 45), s: rng.int(20, 80), b: rng.int(10, 85) },
    eyes: rng.pick([{ h: rng.int(190, 225), s: rng.int(40, 80), b: rng.int(45, 85) }, { h: rng.int(80, 140), s: rng.int(30, 70), b: rng.int(35, 70) }, { h: rng.int(20, 35), s: rng.int(50, 85), b: rng.int(20, 55) }]),
    shirt: { h: rng.int(0, 359), s: rng.int(30, 95), b: rng.int(30, 95) },
  };
}

export function Avatar({ p, style = 0, active }: { p: Palette; style?: number; active?: Part }) {
  const c = (k: Part) => hsbCss(p[k]);
  const ring = (k: Part) => (active === k ? { stroke: '#fff', strokeWidth: 3, strokeDasharray: '6 4' } : {});
  return (
    <svg viewBox="0 0 200 220" className="mx-auto h-full max-h-[46vh] w-full" aria-label="Portrait">
      <path d="M20 220c0-48 36-72 80-72s80 24 80 72z" fill={c('shirt')} {...ring('shirt')} />
      <rect x="84" y="118" width="32" height="34" rx="10" fill={c('skin')} />
      {style % 2 === 0 ? <path d="M42 96c-6-50 24-78 58-78s66 26 58 78c-8-10-12-28-14-40-20 10-56 12-88 0-2 14-6 30-14 40z" fill={c('hair')} {...ring('hair')} /> : <path d="M46 120c-14-60 10-102 54-102s70 42 54 102c-4-20-8-50-12-58-26 8-58 8-84 0-4 8-8 38-12 58z" fill={c('hair')} {...ring('hair')} />}
      <ellipse cx="100" cy="88" rx="44" ry="50" fill={c('skin')} {...ring('skin')} />
      <ellipse cx="56" cy="92" rx="8" ry="12" fill={c('skin')} />
      <ellipse cx="144" cy="92" rx="8" ry="12" fill={c('skin')} />
      {style % 2 === 0 && <path d="M58 70c10-24 30-34 52-32 20 2 30 14 34 32-18-10-42-14-86 0z" fill={c('hair')} />}
      <g {...ring('eyes')}>
        <ellipse cx="82" cy="88" rx="11" ry="8" fill="#fff" /><ellipse cx="118" cy="88" rx="11" ry="8" fill="#fff" />
        <circle cx="82" cy="88" r="6" fill={c('eyes')} /><circle cx="118" cy="88" r="6" fill={c('eyes')} />
        <circle cx="82" cy="88" r="2.4" fill="#111" /><circle cx="118" cy="88" r="2.4" fill="#111" />
      </g>
      <path d="M88 114c8 6 16 6 24 0" stroke="rgba(0,0,0,.45)" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M100 92v12h-5" stroke="rgba(0,0,0,.2)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export default function FacePaint({ rng, difficulty, onFinish }: GameProps) {
  const targets = useMemo(() => Array.from({ length: 3 }, (_, k) => ({ p: palette(rng), style: k })), [rng]);
  const [des, setDes] = useState<number[]>([]);
  return (
    <RoundRunner
      targets={targets}
      memorizeMs={memo(difficulty, 9000, 6000, 3500)}
      renderShow={(t) => <div className="glass mx-auto aspect-square max-h-[50vh] max-w-md rounded-[2rem] p-4"><Avatar p={t.p} style={t.style} /></div>}
      renderInput={(t, i, submit) => <Input key={i} style={t.style} onSubmit={(g) => {
        const d = PARTS.map((k) => deltaEHsb(t.p[k], g[k]));
        setDes((a) => [...a, ...d]);
        submit(avg(d.map(colorRoundScore)), <><div className="mx-auto mb-2 grid max-w-xs grid-cols-2 gap-2"><div className="h-28"><Avatar p={t.p} style={t.style} /></div><div className="h-28"><Avatar p={g} style={t.style} /></div></div><span className="font-mono">{PARTS.map((k, j) => `${k} ΔE ${fmt(d[j])}`).join(' · ')}</span></>);
      }} />}
      onDone={(s) => onFinish(roundsResult(s, `Avg ΔE ${fmt(avg(des))} across ${des.length} parts`))}
    />
  );
}

function Input({ style, onSubmit }: { style: number; onSubmit: (p: Palette) => void }) {
  const [p, setP] = useState<Palette>({ skin: { h: 25, s: 40, b: 70 }, hair: { h: 30, s: 50, b: 40 }, eyes: { h: 200, s: 50, b: 50 }, shirt: { h: 260, s: 50, b: 60 } });
  const [part, setPart] = useState<Part>('skin');
  return (
    <div className="grid gap-4 sm:grid-cols-2 sm:items-center">
      <div className="glass aspect-square rounded-[2rem] p-4"><Avatar p={p} style={style} active={part} /></div>
      <div className="glass rounded-3xl p-5">
        <div className="mb-4 grid grid-cols-4 gap-1.5">
          {PARTS.map((k) => (
            <button key={k} onClick={() => setPart(k)} className={`flex flex-col items-center gap-1 rounded-xl py-2 text-xs font-bold capitalize ${part === k ? 'bg-[var(--color-fg)] text-[var(--color-bg)]' : 'border border-[var(--color-line)]'}`}>
              <span className="h-4 w-4 rounded-full ring-1 ring-white/40" style={{ background: hsbCss(p[k]) }} />{k}
            </button>
          ))}
        </div>
        <HsbSliders value={p[part]} onChange={(c) => setP((x) => ({ ...x, [part]: c }))} />
        <button className="btn btn-primary mt-5 w-full" onClick={() => onSubmit(p)}>Lock portrait</button>
      </div>
    </div>
  );
}
