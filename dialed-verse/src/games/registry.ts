import catalog from './catalog.json';
import type { GameMeta, GameModule } from '@/core/types';

export const GAMES = catalog as GameMeta[];

// Every folder in src/games/<id>/index.tsx is picked up automatically and code-split.
const modules = import.meta.glob<GameModule>('./*/index.tsx');

export function loadGame(id: string): () => Promise<GameModule> {
  const loader = modules[`./${id}/index.tsx`];
  if (!loader) throw new Error(`Unknown game: ${id}`);
  return loader;
}

export const gameById = (id: string) => GAMES.find((g) => g.id === id);

export const CATEGORIES = [
  { id: 'sensory', name: 'Sensory Memory', blurb: 'Memorize a stimulus. Recreate it.' },
  { id: 'puzzle', name: 'Daily Puzzles', blurb: 'One puzzle for the whole world.' },
  { id: 'skill', name: 'Reflex & Skill', blurb: 'Hands, eyes, nerves.' },
] as const;
