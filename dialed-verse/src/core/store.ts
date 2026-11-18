import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { dateKey, previousDateKey } from './rng';
import type { Difficulty, Mode } from './types';

export type Theme = 'dark' | 'light' | 'neon' | 'retro';
export type Motion = 'system' | 'full' | 'reduced';
export type ColorVision = 'none' | 'deuteranopia' | 'protanopia' | 'tritanopia' | 'high-contrast';

export interface Settings {
  soundOn: boolean;
  masterVolume: number;
  sfxVolume: number;
  musicOn: boolean;
  musicVolume: number;
  motion: Motion;
  theme: Theme;
  colorVision: ColorVision;
  cursorTrail: boolean;
  language: string;
}

export interface Play {
  game: string;
  score: number;
  mode: Mode;
  difficulty: Difficulty;
  date: string; // UTC date key
  ts: number;
  rounds?: number[];
  summary?: string;
}

interface State {
  settings: Settings;
  plays: Play[];
  /** `${game}|${date}` -> play index for daily lock */
  daily: Record<string, Play>;
  achievements: Record<string, number>;
  nickname: string;
  localId: string;
  setSettings: (s: Partial<Settings>) => void;
  setNickname: (n: string) => void;
  recordPlay: (p: Play) => void;
  unlock: (ids: string[]) => void;
  resetAll: () => void;
}

const defaultSettings: Settings = {
  soundOn: true,
  masterVolume: 0.8,
  sfxVolume: 0.7,
  musicOn: true,
  musicVolume: 0.22,
  motion: 'system',
  theme: 'dark',
  colorVision: 'none',
  cursorTrail: true,
  language: 'en',
};

const rid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export const useStore = create<State>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      plays: [],
      daily: {},
      achievements: {},
      nickname: '',
      localId: rid(),
      setSettings: (s) => set((st) => ({ settings: { ...st.settings, ...s } })),
      setNickname: (nickname) => set({ nickname: nickname.slice(0, 18) }),
      recordPlay: (p) =>
        set((st) => {
          const plays = [...st.plays, p].slice(-3000);
          const daily = p.mode === 'daily' ? { ...st.daily, [`${p.game}|${p.date}`]: p } : st.daily;
          return { plays, daily };
        }),
      unlock: (ids) =>
        set((st) => {
          const a = { ...st.achievements };
          ids.forEach((id) => { if (!a[id]) a[id] = Date.now(); });
          return { achievements: a };
        }),
      resetAll: () => set({ plays: [], daily: {}, achievements: {} }),
    }),
    {
      name: 'dialed-verse',
      version: 1,
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<State>;
        return { ...current, ...p, settings: { ...defaultSettings, ...(p.settings ?? {}) } };
      },
    },
  ),
);

export const dailyPlay = (daily: Record<string, Play>, game: string, date = dateKey()) => daily[`${game}|${date}`];

/** Days with at least one daily played. */
export function playedDays(daily: Record<string, Play>): Set<string> {
  return new Set(Object.keys(daily).map((k) => k.split('|')[1]));
}

export function computeStreak(daily: Record<string, Play>, today = dateKey()) {
  const days = playedDays(daily);
  let cur = 0;
  let k = days.has(today) ? today : previousDateKey(today);
  while (days.has(k)) { cur++; k = previousDateKey(k); }
  // best streak
  const sorted = [...days].sort();
  let best = 0, run = 0, prev = '';
  for (const d of sorted) {
    run = prev && previousDateKey(d) === prev ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return { current: cur, best, playedToday: days.has(today) };
}

export function bestScore(plays: Play[], game: string) {
  return plays.filter((p) => p.game === game).reduce((m, p) => Math.max(m, p.score), 0);
}
