import type { Difficulty, GameResult } from '@/core/types';
import { totalFromRounds } from '@/core/scoring';

export const memo = <V,>(d: Difficulty, easy: V, normal: V, hard: V): V => (d === 'easy' ? easy : d === 'hard' ? hard : normal);

export function roundsResult(scores: number[], summary: string, details?: GameResult['details']): GameResult {
  return { score: totalFromRounds(scores), rounds: scores, summary, details };
}

export const avg = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
export const fmt = (n: number, d = 1) => (Math.round(n * 10 ** d) / 10 ** d).toFixed(d);
