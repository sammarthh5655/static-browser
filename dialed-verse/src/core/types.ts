import type { ComponentType } from 'react';
import type { Rng } from './rng';

export type Difficulty = 'easy' | 'normal' | 'hard';
export type Mode = 'daily' | 'practice';
export type Category = 'sensory' | 'puzzle' | 'skill';

export interface GameMeta {
  id: string;
  name: string;
  category: Category;
  emoji: string;
  hue: number;
  tagline: string;
  howTo: string[];
  /** Game relies on audio: background music is muted while playing. */
  audio?: boolean;
}

export interface GameResult {
  /** 0-1000 */
  score: number;
  /** Per-round accuracy 0-1, rendered as emoji squares on the share card. */
  rounds?: number[];
  /** One short line, e.g. "Avg ΔE 3.1". */
  summary: string;
  /** Optional custom share grid (overrides rounds squares). */
  grid?: string;
  details?: { label: string; value: string }[];
}

export interface GameProps {
  seed: number;
  rng: Rng;
  difficulty: Difficulty;
  mode: Mode;
  meta: GameMeta;
  onFinish: (r: GameResult) => void;
}

/** Shape every game module default-exports. */
export type GameModule = { default: ComponentType<GameProps> };
