import { useRef, type PointerEvent, type RefObject } from 'react';

/** Pointer-drag on an SVG/element, reporting coordinates in 0..W/0..H viewBox units. */
export function useDrag<T extends Element>(ref: RefObject<T>, w: number, h: number, onMove: (x: number, y: number, first: boolean) => void) {
  const active = useRef(false);
  const to = (e: PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * w, ((e.clientY - r.top) / r.height) * h] as const;
  };
  return {
    onPointerDown: (e: PointerEvent) => {
      active.current = true;
      (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
      const [x, y] = to(e);
      onMove(x, y, true);
    },
    onPointerMove: (e: PointerEvent) => {
      if (!active.current) return;
      const [x, y] = to(e);
      onMove(x, y, false);
    },
    onPointerUp: () => { active.current = false; },
    onPointerCancel: () => { active.current = false; },
    style: { touchAction: 'none' as const },
  };
}
