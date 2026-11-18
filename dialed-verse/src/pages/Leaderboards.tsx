import { useNavigate, useParams } from 'react-router-dom';
import { GAMES, gameById } from '@/games/registry';
import LeaderboardPanel from './LeaderboardPanel';
import { useSeo } from './seo';
import { audio } from '@/audio/engine';

export default function Leaderboards() {
  const { id } = useParams();
  const nav = useNavigate();
  const game = gameById(id ?? '') ?? GAMES.find((g) => g.id === 'reaction') ?? GAMES[0];
  useSeo(`${game.name} leaderboard · Dialed-verse`, `Daily, weekly and all-time top scores for ${game.name}.`);
  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6">
      <h1 className="chroma font-display text-4xl font-black sm:text-6xl">Leaderboards</h1>
      <div className="mt-6 grid gap-5 lg:grid-cols-[280px_1fr]">
        <div className="glass max-h-[70vh] overflow-auto rounded-3xl p-2">
          {GAMES.map((g) => (
            <button key={g.id} onClick={() => { audio.click(); nav(`/leaderboards/${g.id}`); }} className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-bold transition ${g.id === game.id ? 'bg-[var(--color-fg)] text-[var(--color-bg)]' : 'hover:bg-white/5'}`}>
              <span>{g.emoji}</span> {g.name}
            </button>
          ))}
        </div>
        <div className="glass rounded-3xl p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-3">
            <span className="text-5xl">{game.emoji}</span>
            <div>
              <h2 className="font-display text-2xl font-black">{game.name}</h2>
              <p className="text-sm text-[var(--color-muted)]">{game.tagline}</p>
            </div>
          </div>
          <LeaderboardPanel key={game.id} game={game.id} />
        </div>
      </div>
    </div>
  );
}
