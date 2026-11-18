import { useEffect, useState } from 'react';
import { fetchBoard, firebaseEnabled, type Board, type Entry } from '@/core/leaderboard';
import { audio } from '@/audio/engine';

const TABS: { id: Board; label: string }[] = [
  { id: 'daily', label: 'Today' },
  { id: 'weekly', label: 'Week' },
  { id: 'alltime', label: 'All-time' },
];

export default function LeaderboardPanel({ game, compact = false }: { game: string; compact?: boolean }) {
  const [board, setBoard] = useState<Board>('daily');
  const [data, setData] = useState<{ source: string; entries: Entry[] } | null>(null);
  useEffect(() => {
    let alive = true;
    setData(null);
    fetchBoard(game, board).then((d) => alive && setData(d));
    return () => { alive = false; };
  }, [game, board]);
  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="font-display font-bold">Leaderboard</h3>
        <div className="flex rounded-full border border-[var(--color-line)] p-0.5 text-xs font-bold" role="tablist">
          {TABS.map((t) => (
            <button key={t.id} role="tab" aria-selected={board === t.id} onClick={() => { audio.toggle(true); setBoard(t.id); }} className={`rounded-full px-3 py-1 transition ${board === t.id ? 'bg-[var(--color-fg)] text-[var(--color-bg)]' : 'text-[var(--color-muted)]'}`}>{t.label}</button>
          ))}
        </div>
      </div>
      {!data ? (
        <div className="space-y-2">{Array.from({ length: 4 }, (_, i) => <div key={i} className="h-9 animate-pulse rounded-xl bg-white/5" />)}</div>
      ) : data.entries.length === 0 ? (
        <p className="py-6 text-center text-sm text-[var(--color-muted)]">No scores yet. Be the first.</p>
      ) : (
        <ol className={`space-y-1.5 overflow-auto pr-1 ${compact ? 'max-h-64' : ''}`}>
          {data.entries.map((e, i) => (
            <li key={i} className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm ${e.you ? 'bg-[var(--color-accent)]/15 ring-1 ring-[var(--color-accent)]/40' : 'bg-white/[0.03]'}`}>
              <span className="w-6 text-center font-display font-black">{i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}</span>
              <span className="min-w-0 flex-1 truncate font-semibold">{e.name}</span>
              <span className="text-xs text-[var(--color-muted)]">{e.date}</span>
              <span className="font-mono font-bold">{e.score}</span>
            </li>
          ))}
        </ol>
      )}
      {data && data.source === 'local' && (
        <p className="mt-3 text-[11px] text-[var(--color-muted)]">{firebaseEnabled ? 'Offline: showing this device only.' : 'Local leaderboard (this device). Add Firebase keys for global boards.'}</p>
      )}
    </div>
  );
}
