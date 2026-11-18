import { GAMES } from '@/games/registry';
import { computeStreak, type Play } from './store';
import { dateKey } from './rng';

export interface Achievement {
  id: string;
  name: string;
  desc: string;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold' | 'mythic';
  check: (ctx: Ctx) => boolean;
}

interface Ctx {
  plays: Play[];
  daily: Record<string, Play>;
}

const countGames = (plays: Play[]) => new Set(plays.map((p) => p.game)).size;
const cat = (c: string) => GAMES.filter((g) => g.category === c).map((g) => g.id);
const todayDailies = (ctx: Ctx) => Object.values(ctx.daily).filter((p) => p.date === dateKey());

const general: Achievement[] = [
  { id: 'first-play', name: 'Power On', desc: 'Finish your first game.', icon: '🔌', tier: 'bronze', check: (c) => c.plays.length >= 1 },
  { id: 'plays-10', name: 'Warming Up', desc: 'Finish 10 games.', icon: '🔥', tier: 'bronze', check: (c) => c.plays.length >= 10 },
  { id: 'plays-50', name: 'Regular', desc: 'Finish 50 games.', icon: '🎮', tier: 'silver', check: (c) => c.plays.length >= 50 },
  { id: 'plays-200', name: 'Devoted', desc: 'Finish 200 games.', icon: '🕹️', tier: 'gold', check: (c) => c.plays.length >= 200 },
  { id: 'plays-1000', name: 'Machine', desc: 'Finish 1000 games.', icon: '🤖', tier: 'mythic', check: (c) => c.plays.length >= 1000 },
  { id: 'streak-3', name: 'Spark', desc: '3-day daily streak.', icon: '✨', tier: 'bronze', check: (c) => computeStreak(c.daily).best >= 3 },
  { id: 'streak-7', name: 'Week of Fire', desc: '7-day daily streak.', icon: '🔥', tier: 'silver', check: (c) => computeStreak(c.daily).best >= 7 },
  { id: 'streak-30', name: 'Monthly Ritual', desc: '30-day daily streak.', icon: '🌙', tier: 'gold', check: (c) => computeStreak(c.daily).best >= 30 },
  { id: 'streak-100', name: 'Centurion', desc: '100-day daily streak.', icon: '💯', tier: 'mythic', check: (c) => computeStreak(c.daily).best >= 100 },
  { id: 'score-800', name: 'Razor', desc: 'Score 800+ in any game.', icon: '⚡', tier: 'bronze', check: (c) => c.plays.some((p) => p.score >= 800) },
  { id: 'score-950', name: 'Transcend', desc: 'Score 950+ in any game.', icon: '🌌', tier: 'silver', check: (c) => c.plays.some((p) => p.score >= 950) },
  { id: 'score-1000', name: 'Flawless', desc: 'Score a perfect 1000.', icon: '💎', tier: 'mythic', check: (c) => c.plays.some((p) => p.score >= 1000) },
  { id: 'explorer-5', name: 'Explorer', desc: 'Try 5 different games.', icon: '🧭', tier: 'bronze', check: (c) => countGames(c.plays) >= 5 },
  { id: 'explorer-20', name: 'Globetrotter', desc: 'Try 20 different games.', icon: '🗺️', tier: 'silver', check: (c) => countGames(c.plays) >= 20 },
  { id: 'explorer-all', name: 'Completionist', desc: 'Try every game.', icon: '🏆', tier: 'gold', check: (c) => countGames(c.plays) >= GAMES.length },
  { id: 'daily-5', name: 'Morning Routine', desc: 'Play 5 dailies in one day.', icon: '☕', tier: 'bronze', check: (c) => todayDailies(c).length >= 5 },
  { id: 'daily-15', name: 'Daily Grinder', desc: 'Play 15 dailies in one day.', icon: '📅', tier: 'silver', check: (c) => todayDailies(c).length >= 15 },
  { id: 'daily-all', name: 'Full Sweep', desc: 'Play every daily in one day.', icon: '🧹', tier: 'mythic', check: (c) => todayDailies(c).length >= GAMES.length },
  { id: 'sensory-all', name: 'Sixth Sense', desc: 'Play every sensory game.', icon: '👁️', tier: 'silver', check: (c) => cat('sensory').every((g) => c.plays.some((p) => p.game === g)) },
  { id: 'puzzle-all', name: 'Puzzler', desc: 'Play every puzzle.', icon: '🧩', tier: 'silver', check: (c) => cat('puzzle').every((g) => c.plays.some((p) => p.game === g)) },
  { id: 'skill-all', name: 'Reflex Fiend', desc: 'Play every skill game.', icon: '🏃', tier: 'silver', check: (c) => cat('skill').every((g) => c.plays.some((p) => p.game === g)) },
  { id: 'hard-900', name: 'Hard Mode Hero', desc: 'Score 900+ on Hard.', icon: '🛡️', tier: 'gold', check: (c) => c.plays.some((p) => p.difficulty === 'hard' && p.score >= 900) },
  { id: 'comeback', name: 'Comeback', desc: 'Beat a sub-400 score with 800+ in the same game.', icon: '🔁', tier: 'silver', check: (c) => GAMES.some((g) => { const s = c.plays.filter((p) => p.game === g.id).map((p) => p.score); const lo = s.findIndex((x) => x < 400); return lo >= 0 && s.slice(lo).some((x) => x >= 800); }) },
  { id: 'night-owl', name: 'Night Owl', desc: 'Finish a game between 00:00 and 04:00.', icon: '🦉', tier: 'bronze', check: (c) => c.plays.some((p) => { const h = new Date(p.ts).getHours(); return h < 4; }) },
  { id: 'avg-700', name: 'Consistent', desc: 'Average 700+ over your last 20 games.', icon: '📈', tier: 'gold', check: (c) => c.plays.length >= 20 && c.plays.slice(-20).reduce((a, p) => a + p.score, 0) / 20 >= 700 },
];

const perGame: Achievement[] = GAMES.flatMap((g) => [
  { id: `master-${g.id}`, name: `${g.name} Master`, desc: `Score 900+ in ${g.name}.`, icon: g.emoji, tier: 'gold' as const, check: (c: Ctx) => c.plays.some((p) => p.game === g.id && p.score >= 900) },
]);

export const ACHIEVEMENTS: Achievement[] = [...general, ...perGame];

export function evaluateAchievements(ctx: Ctx, unlocked: Record<string, number>): Achievement[] {
  return ACHIEVEMENTS.filter((a) => !unlocked[a.id] && a.check(ctx));
}
