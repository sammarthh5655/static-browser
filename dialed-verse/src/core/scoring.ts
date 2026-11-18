/** Shared scoring helpers. All game scores are 0-1000. Round scores are 0-1. */

export const clamp = (v: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));

/** Perceptual color accuracy: dE 0 => 1, dE ~2 (JND) => ~0.95, dE 10 => ~0.5, dE 40 => ~0. */
export function colorRoundScore(deltaE: number): number {
  return clamp(Math.exp(-((deltaE / 14) ** 1.35)));
}

/** Cents between two frequencies. */
export function centsBetween(f1: number, f2: number): number {
  return Math.abs(1200 * Math.log2(f2 / f1));
}

/**
 * Psychoacoustic pitch score: under ~5 cents (typical JND) is near-perfect,
 * a semitone (100c) is ~0.5, an octave scores 0.
 */
export function pitchRoundScore(cents: number): number {
  if (cents <= 5) return 1;
  return clamp(Math.exp(-(((cents - 5) / 140) ** 1.2) * 0.9));
}

/** Relative error score (e.g. size, length, tempo): 0% => 1, 10% => ~0.6, 30% => ~0.1. */
export function ratioScore(target: number, guess: number, tolerance = 0.2): number {
  if (target === 0) return guess === 0 ? 1 : 0;
  const err = Math.abs(Math.log(Math.max(guess, 1e-6) / target));
  return clamp(Math.exp(-((err / tolerance) ** 1.4) * 0.7));
}

/** Linear-error score: err 0 => 1, err >= max => 0, eased. */
export function linearScore(err: number, max: number): number {
  const x = clamp(Math.abs(err) / max);
  return clamp(1 - x ** 0.75);
}

export function totalFromRounds(rounds: number[]): number {
  if (!rounds.length) return 0;
  const avg = rounds.reduce((a, b) => a + b, 0) / rounds.length;
  return Math.round(clamp(avg) * 1000);
}

export interface Rank { title: string; min: number; emoji: string; color: string }

export const RANKS: Rank[] = [
  { min: 990, title: 'Flawless', emoji: '💎', color: '#9ef7ff' },
  { min: 940, title: 'Transcendent', emoji: '🌌', color: '#c79bff' },
  { min: 880, title: 'Locked In', emoji: '🎯', color: '#ff7ad9' },
  { min: 800, title: 'Razor Sharp', emoji: '⚡', color: '#ffd166' },
  { min: 700, title: 'Tuned', emoji: '🎛️', color: '#7cffb2' },
  { min: 580, title: 'Signal', emoji: '📡', color: '#6ee7ff' },
  { min: 440, title: 'Flicker', emoji: '🕯️', color: '#ffb36b' },
  { min: 280, title: 'Static', emoji: '📺', color: '#a3a3c2' },
  { min: 0, title: 'Noise', emoji: '🌫️', color: '#8a8aa0' },
];

export function rankFor(score: number): Rank {
  return RANKS.find((r) => score >= r.min) ?? RANKS[RANKS.length - 1];
}

export function roundEmoji(v: number): string {
  if (v >= 0.92) return '🟩';
  if (v >= 0.75) return '🟨';
  if (v >= 0.5) return '🟧';
  return '🟥';
}
