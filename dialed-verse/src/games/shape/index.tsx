import { useMemo, useRef, useState, type PointerEvent } from 'react';
import type { GameProps } from '@/core/types';
import { clamp } from '@/core/scoring';
import RoundRunner from '../_shared/RoundRunner';
import { Board, SubmitBar } from '../_shared/Board';
import { avg, fmt, memo, roundsResult } from '../_shared/helpers';

type Pt = [number, number];
const poly = (p: Pt[]) => p.map((q) => q.join(',')).join(' ');

/** Intersection-over-union of two polygons by rasterization. */
export function polygonIoU(a: Pt[], b: Pt[], w = 400, h = 300, scale = 0.5): number {
  const c = document.createElement('canvas');
  c.width = w * scale; c.height = h * scale;
  const g = c.getContext('2d', { willReadFrequently: true })!;
  const draw = (p: Pt[], col: string) => { g.beginPath(); p.forEach(([x, y], i) => (i ? g.lineTo(x * scale, y * scale) : g.moveTo(x * scale, y * scale))); g.closePath(); g.fillStyle = col; g.fill(); };
  g.globalCompositeOperation = 'lighter';
  draw(a, 'rgb(255,0,0)');
  draw(b, 'rgb(0,0,255)');
  const d = g.getImageData(0, 0, c.width, c.height).data;
  let inter = 0, uni = 0;
  for (let i = 0; i < d.length; i += 4) { const A = d[i] > 127, B = d[i + 2] > 127; if (A || B) uni++; if (A && B) inter++; }
  return uni ? inter / uni : 0;
}

export default function ShapeMemory({ rng, difficulty, onFinish }: GameProps) {
  const n = memo(difficulty, 4, 5, 7);
  const targets = useMemo(() => Array.from({ length: 4 }, () => {
    const rot = rng.range(0, Math.PI * 2);
    return Array.from({ length: n }, (_, k): Pt => { const a = rot + (k / n) * Math.PI * 2 + rng.range(-0.35, 0.35); const r = rng.range(45, 125); return [200 + Math.cos(a) * r * 1.2, 150 + Math.sin(a) * r]; });
  }), [rng, n]);
  const [ious, setIous] = useState<number[]>([]);
  return (
    <RoundRunner
      targets={targets}
      memorizeMs={memo(difficulty, 5000, 3500, 2000)}
      renderShow={(t) => <Board hue={190}><polygon points={poly(t)} fill="hsl(190 95% 55% / .8)" stroke="#fff" strokeWidth="3" strokeLinejoin="round" filter="url(#dvglow)" /></Board>}
      renderInput={(t, i, submit) => <Input key={i} n={t.length} onSubmit={(p) => {
        const iou = polygonIoU(t, p);
        setIous((a) => [...a, iou]);
        submit(clamp((iou - 0.35) / 0.57) ** 0.9, <><svg viewBox="0 0 400 300" className="mx-auto mb-1 h-28"><polygon points={poly(t)} fill="hsl(190 95% 55% / .5)" /><polygon points={poly(p)} fill="none" stroke="#ff5fd0" strokeWidth="4" /></svg><span className="font-mono">Overlap (IoU) {fmt(iou * 100)}%</span></>);
      }} />}
      onDone={(s) => onFinish(roundsResult(s, `Avg overlap ${fmt(avg(ious) * 100)}%`))}
    />
  );
}

function Input({ n, onSubmit }: { n: number; onSubmit: (p: Pt[]) => void }) {
  const [pts, setPts] = useState<Pt[]>(() => Array.from({ length: n }, (_, k) => [200 + Math.cos((k / n) * Math.PI * 2 - Math.PI / 2) * 90, 150 + Math.sin((k / n) * Math.PI * 2 - Math.PI / 2) * 90]));
  const ref = useRef<SVGSVGElement>(null);
  const dragging = useRef<number | null>(null);
  const toLocal = (e: PointerEvent): Pt => { const r = ref.current!.getBoundingClientRect(); return [Math.max(0, Math.min(400, ((e.clientX - r.left) / r.width) * 400)), Math.max(0, Math.min(300, ((e.clientY - r.top) / r.height) * 300))]; };
  return (
    <>
      <Board ref={ref} hue={210} style={{ touchAction: 'none' }}
        onPointerMove={(e) => { if (dragging.current === null) return; const p = toLocal(e); setPts((a) => a.map((q, k) => (k === dragging.current ? p : q))); }}
        onPointerUp={() => (dragging.current = null)} onPointerCancel={() => (dragging.current = null)}>
        <polygon points={poly(pts)} fill="hsl(300 90% 60% / .55)" stroke="#fff" strokeWidth="3" strokeLinejoin="round" />
        {pts.map(([x, y], k) => (
          <circle key={k} cx={x} cy={y} r="14" fill="#fff" stroke="hsl(300 90% 60%)" strokeWidth="4" className="cursor-grab"
            onPointerDown={(e) => { e.stopPropagation(); (ref.current as Element).setPointerCapture(e.pointerId); dragging.current = k; }} />
        ))}
      </Board>
      <SubmitBar onSubmit={() => onSubmit(pts)}><span className="text-sm text-[var(--color-muted)]">Drag the {n} handles to rebuild the outline.</span></SubmitBar>
    </>
  );
}
