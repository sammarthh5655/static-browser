import { create } from 'zustand';
import { useStore } from '@/core/store';
import { useEffect, useState } from 'react';

interface UiState {
  hue: number;
  energy: number; // 0..1 drives background intensity (reactive to score/streak)
  flashKey: number;
  flashColor: string;
  shakeKey: number;
  setHue: (h: number) => void;
  setEnergy: (e: number) => void;
  flash: (color?: string) => void;
  shake: () => void;
}

export const useUi = create<UiState>((set) => ({
  hue: 300,
  energy: 0.3,
  flashKey: 0,
  flashColor: 'var(--color-bad)',
  shakeKey: 0,
  setHue: (hue) => set({ hue }),
  setEnergy: (energy) => set({ energy }),
  flash: (flashColor = 'var(--color-bad)') => set((s) => ({ flashKey: s.flashKey + 1, flashColor })),
  shake: () => set((s) => ({ shakeKey: s.shakeKey + 1 })),
}));

function systemReduced() {
  return typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function useReducedMotion(): boolean {
  const motion = useStore((s) => s.settings.motion);
  const [sys, setSys] = useState(systemReduced);
  useEffect(() => {
    if (typeof matchMedia === 'undefined') return;
    const mq = matchMedia('(prefers-reduced-motion: reduce)');
    const fn = () => setSys(mq.matches);
    mq.addEventListener?.('change', fn);
    return () => mq.removeEventListener?.('change', fn);
  }, []);
  return motion === 'reduced' || (motion === 'system' && sys);
}

export const isReduced = () => {
  const m = useStore.getState().settings.motion;
  return m === 'reduced' || (m === 'system' && systemReduced());
};

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
