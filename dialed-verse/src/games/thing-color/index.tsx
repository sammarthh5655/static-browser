import { useMemo, useState } from 'react';
import type { GameProps } from '@/core/types';
import { deltaEHsb, hsbCss, hexToRgb, rgbToHsb, type HSB } from '@/core/color';
import { colorRoundScore } from '@/core/scoring';
import RoundRunner from '../_shared/RoundRunner';
import ColorPicker, { CompareSwatches } from '../_shared/ColorPicker';
import { avg, fmt, roundsResult } from '../_shared/helpers';

/** Typical colors of everyday things (reference swatches chosen by eye; original data). */
const THINGS: [string, string, string][] = [
  ['A ripe lemon', '🍋', '#F7E03C'], ['A ripe tomato', '🍅', '#D9301F'], ['A fresh lime', '🟢', '#7BC043'], ['A carrot', '🥕', '#F08A24'],
  ['A school bus', '🚌', '#F5B31C'], ['A fire truck', '🚒', '#C8102E'], ['A clear noon sky', '☁️', '#6CB4EE'], ['Fresh grass', '🌱', '#5DAE36'],
  ['Milk chocolate', '🍫', '#7B4A2D'], ['An eggplant', '🍆', '#4B2A5C'], ['A flamingo', '🦩', '#F49AC1'], ['A ripe banana', '🍌', '#F3D54E'],
  ['A tangerine', '🍊', '#F49A1A'], ['A blueberry', '🫐', '#45507E'], ['Fresh mint leaves', '🌿', '#3EB489'], ['A red brick', '🧱', '#A4472E'],
  ['Dried lavender', '💜', '#9A85C4'], ['Wet sand', '🏖️', '#BFA27A'], ['A pumpkin', '🎃', '#E66E1D'], ['A cherry', '🍒', '#9E1030'],
  ['An avocado (inside)', '🥑', '#C9D86A'], ['Pine needles', '🌲', '#2E5E3A'], ['Cooked salmon', '🍣', '#F08A6B'], ['A tennis ball', '🎾', '#D7E84B'],
  ['Copper pipe', '🔧', '#B8733A'], ['Butter', '🧈', '#F6E39A'], ['Cocoa powder', '☕', '#5A3825'], ['A strawberry', '🍓', '#D3263A'],
  ['A glacier lake', '🏔️', '#3FB6C9'], ['Rose petals', '🌹', '#C21E4B'], ['Olive', '🫒', '#7C7A2E'], ['A lilac flower', '🌸', '#C8A2C8'],
  ['A traffic cone', '🚧', '#FF6A13'], ['A gold coin', '🪙', '#D9A92E'], ['Night sky (dusk)', '🌌', '#2B2F6B'], ['Watermelon flesh', '🍉', '#F1525C'],
  ['A kiwi (inside)', '🥝', '#8DBA3F'], ['Terracotta pot', '🪴', '#C3653F'], ['Denim jeans', '👖', '#3B5B8C'], ['A peach', '🍑', '#F8B88B'],
];

export default function ColorOfThings({ rng, onFinish }: GameProps) {
  const targets = useMemo(() => rng.sample(THINGS, 5).map(([name, emoji, hex]) => ({ name, emoji, c: rgbToHsb(hexToRgb(hex)) })), [rng]);
  const [des, setDes] = useState<number[]>([]);
  return (
    <RoundRunner
      targets={targets}
      memorizeMs={1800}
      maskMs={0}
      showLabel="Imagine its color"
      renderShow={(t) => <div className="glass mx-auto grid max-w-xl place-items-center rounded-[2rem] p-10 text-center"><div className="text-7xl">{t.emoji}</div><div className="mt-4 font-display text-3xl font-black">{t.name}</div></div>}
      renderInput={(t, i, submit) => <Input key={i} name={`${t.emoji} ${t.name}`} onSubmit={(g) => { const de = deltaEHsb(t.c, g); setDes((d) => [...d, de]); submit(colorRoundScore(de * 0.75), <><CompareSwatches target={hsbCss(t.c)} guess={hsbCss(g)} /><span className="font-mono">ΔE {fmt(de)}</span></>); }} />}
      onDone={(s) => onFinish(roundsResult(s, `Avg ΔE ${fmt(avg(des))}`))}
    />
  );
}

function Input({ name, onSubmit }: { name: string; onSubmit: (c: HSB) => void }) {
  const [c, setC] = useState<HSB>({ h: 180, s: 40, b: 60 });
  return <div><div className="mb-3 text-center font-display text-xl font-bold">{name}</div><ColorPicker value={c} onChange={setC} onSubmit={() => onSubmit(c)} /></div>;
}
