import type { HSB } from '@/core/color';
import { hsbCss } from '@/core/color';
import { Slider } from '@/ui/Interactive';

const HUE_TRACK = 'linear-gradient(90deg, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)';

export function HsbSliders({ value, onChange, showHex = false }: { value: HSB; onChange: (c: HSB) => void; showHex?: boolean }) {
  const { h, s, b } = value;
  return (
    <div className="space-y-3">
      <Slider label="Hue" min={0} max={359} value={h} onChange={(v) => onChange({ ...value, h: v })} track={HUE_TRACK} thumb={hsbCss({ h, s: 100, b: 100 })} format={showHex ? (v) => `${v}°` : undefined} />
      <Slider label="Saturation" min={0} max={100} value={s} onChange={(v) => onChange({ ...value, s: v })} track={`linear-gradient(90deg, ${hsbCss({ h, s: 0, b })}, ${hsbCss({ h, s: 100, b })})`} thumb={hsbCss(value)} format={showHex ? (v) => `${v}%` : undefined} />
      <Slider label="Brightness" min={0} max={100} value={b} onChange={(v) => onChange({ ...value, b: v })} track={`linear-gradient(90deg, #000, ${hsbCss({ h, s, b: 100 })})`} thumb={hsbCss(value)} format={showHex ? (v) => `${v}%` : undefined} />
    </div>
  );
}

/** Large swatch + HSB sliders. */
export default function ColorPicker({ value, onChange, onSubmit, label = 'Lock it in' }: { value: HSB; onChange: (c: HSB) => void; onSubmit: () => void; label?: string }) {
  return (
    <div className="grid gap-5 sm:grid-cols-[1fr_1fr] sm:items-center">
      <div className="aspect-square w-full rounded-[2rem] shadow-2xl ring-1 ring-white/15 transition-colors duration-75" style={{ background: hsbCss(value), boxShadow: `0 30px 80px -20px ${hsbCss(value)}` }} />
      <div className="glass rounded-3xl p-5">
        <HsbSliders value={value} onChange={onChange} />
        <button className="btn btn-primary mt-5 w-full" onClick={onSubmit}>{label}</button>
      </div>
    </div>
  );
}

export function CompareSwatches({ target, guess }: { target: string; guess: string }) {
  return (
    <div className="mx-auto mb-1 flex max-w-xs overflow-hidden rounded-2xl ring-1 ring-white/15">
      <div className="h-16 flex-1" style={{ background: target }}><span className="m-1 inline-block rounded bg-black/40 px-1.5 text-[10px] font-bold text-white">TARGET</span></div>
      <div className="h-16 flex-1" style={{ background: guess }}><span className="m-1 inline-block rounded bg-black/40 px-1.5 text-[10px] font-bold text-white">YOU</span></div>
    </div>
  );
}
