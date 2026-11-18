/** Deterministic RNG + daily seed system. Same UTC date => same seed for everyone. */

export function hashString(str: string): number {
  // cyrb53-style 32-bit hash, stable across platforms
  let h1 = 0xdeadbeef ^ str.length;
  let h2 = 0x41c6ce57 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h1 ^ h2) >>> 0;
}

export interface Rng {
  /** float in [0,1) */
  next(): number;
  /** float in [min,max) */
  range(min: number, max: number): number;
  /** integer in [min,max] inclusive */
  int(min: number, max: number): number;
  pick<T>(arr: readonly T[]): T;
  shuffle<T>(arr: readonly T[]): T[];
  /** pick n distinct items */
  sample<T>(arr: readonly T[], n: number): T[];
  bool(p?: number): boolean;
  seed: number;
}

/** mulberry32 */
export function createRng(seed: number): Rng {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const rng: Rng = {
    seed,
    next,
    range: (min, max) => min + next() * (max - min),
    int: (min, max) => Math.floor(min + next() * (max - min + 1)),
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    shuffle: (arr) => {
      const out = arr.slice();
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
      }
      return out;
    },
    sample: (arr, n) => rng.shuffle(arr).slice(0, Math.min(n, arr.length)),
    bool: (p = 0.5) => next() < p,
  };
  return rng;
}

/** YYYY-MM-DD in UTC */
export function dateKey(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

/** Days since 2025-01-01 UTC (puzzle number). */
export function dayNumber(d: Date = new Date()): number {
  const start = Date.UTC(2025, 0, 1);
  const now = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  return Math.floor((now - start) / 86400000) + 1;
}

/** ISO week key like 2026-W47 (UTC). */
export function weekKey(d: Date = new Date()): string {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const yearStart = Date.UTC(t.getUTCFullYear(), 0, 1);
  const week = Math.ceil(((t.getTime() - yearStart) / 86400000 + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

/** Seed for a given game on a given UTC date. */
export function dailySeed(gameId: string, key: string = dateKey()): number {
  return hashString(`dialed-verse|${gameId}|${key}`);
}

export function randomSeed(): number {
  return (Math.random() * 2 ** 32) >>> 0;
}

/** ms until next UTC midnight */
export function msUntilReset(now: Date = new Date()): number {
  const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
  return next - now.getTime();
}

export function previousDateKey(key: string): string {
  const d = new Date(key + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() - 1);
  return dateKey(d);
}
