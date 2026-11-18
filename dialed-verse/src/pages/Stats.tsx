import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useStore, computeStreak, bestScore } from '@/core/store';
import { GAMES, gameById } from '@/games/registry';
import { ACHIEVEMENTS } from '@/core/achievements';
import { dateKey, previousDateKey } from '@/core/rng';
import { rankFor } from '@/core/scoring';
import Flame from '@/ui/Flame';
import { CountUp } from '@/ui/SlotScore';
import { useSeo } from './seo';
import { audio } from '@/audio/engine';

const TIER = { bronze: '#d08c5a', silver: '#c9d3e6', gold: '#ffd23f', mythic: '#c79bff' } as const;

export default function Stats() {
  useSeo('Your stats · Dialed-verse', 'Streaks, best scores, history charts and achievements.');
  const plays = useStore((s) => s.plays);
  const daily = useStore((s) => s.daily);
  const unlocked = useStore((s) => s.achievements);
  const streak = computeStreak(daily);
  const avg = plays.length ? Math.round(plays.reduce((a, p) => a + p.score, 0) / plays.length) : 0;
  const played = new Set(plays.map((p) => p.game));
  const [sel, setSel] = useState<string>(() => plays[plays.length - 1]?.game ?? GAMES[0].id);
  const history = plays.filter((p) => p.game === sel).slice(-40);
  const unlockedCount = Object.keys(unlocked).length;

  // heatmap: last 18 weeks of daily average score
  const heat = useMemo(() => {
    const byDay = new Map<string, number[]>();
    plays.forEach((p) => { const a = byDay.get(p.date) ?? []; a.push(p.score); byDay.set(p.date, a); });
    const days: { key: string; avg: number | null; n: number }[] = [];
    let k = dateKey();
    for (let i = 0; i < 18 * 7; i++) {
      const a = byDay.get(k);
      days.unshift({ key: k, avg: a ? a.reduce((x, y) => x + y, 0) / a.length : null, n: a?.length ?? 0 });
      k = previousDateKey(k);
    }
    return days;
  }, [plays]);

  const tiles = [
    { label: 'Games finished', value: plays.length, icon: '🎮' },
    { label: 'Average score', value: avg, icon: '📈' },
    { label: 'Games tried', value: played.size, suffix: `/${GAMES.length}`, icon: '🧭' },
    { label: 'Achievements', value: unlockedCount, suffix: `/${ACHIEVEMENTS.length}`, icon: '🏅' },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6">
      <h1 className="chroma font-display text-4xl font-black sm:text-6xl">Your Stats</h1>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass flex items-center gap-4 rounded-3xl p-5 lg:row-span-1">
          <Flame streak={streak.current} size={52} />
          <div>
            <div className="font-display text-4xl font-black"><CountUp to={streak.current} /></div>
            <div className="text-xs font-bold uppercase tracking-widest text-[var(--color-muted)]">day streak · best {streak.best}</div>
          </div>
        </motion.div>
        {tiles.map((t, i) => (
          <motion.div key={t.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * (i + 1) }} className="glass rounded-3xl p-5">
            <div className="text-2xl">{t.icon}</div>
            <div className="mt-1 font-display text-3xl font-black"><CountUp to={t.value} />{t.suffix && <span className="text-base text-[var(--color-muted)]">{t.suffix}</span>}</div>
            <div className="text-xs font-bold uppercase tracking-widest text-[var(--color-muted)]">{t.label}</div>
          </motion.div>
        ))}
      </div>

      <section className="glass mt-6 rounded-3xl p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">Activity heatmap</h2>
          <span className="text-xs text-[var(--color-muted)]">Daily average score, last 18 weeks</span>
        </div>
        <div className="overflow-x-auto scrollbar-none">
          <div className="grid w-max grid-flow-col grid-rows-7 gap-1">
            {heat.map((d) => (
              <div key={d.key} title={`${d.key}: ${d.avg === null ? 'no games' : `${Math.round(d.avg)} avg · ${d.n} games`}`} className="h-3.5 w-3.5 rounded-[4px] sm:h-4 sm:w-4" style={{ background: d.avg === null ? 'var(--color-line)' : `hsl(${300 - (d.avg / 1000) * 140} 90% ${35 + (d.avg / 1000) * 30}%)` }} />
            ))}
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2 text-[10px] text-[var(--color-muted)]">
          Low {[0, 250, 500, 750, 1000].map((v) => <span key={v} className="h-3 w-3 rounded-[3px]" style={{ background: `hsl(${300 - (v / 1000) * 140} 90% ${35 + (v / 1000) * 30}%)` }} />)} High
        </div>
      </section>

      <section className="glass mt-6 rounded-3xl p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl font-bold">Score history</h2>
          <select value={sel} onChange={(e) => { audio.click(); setSel(e.target.value); }} aria-label="Game" className="rounded-full border border-[var(--color-line)] bg-[var(--color-bg2)] px-4 py-2 text-sm">
            {GAMES.map((g) => <option key={g.id} value={g.id}>{g.emoji} {g.name}</option>)}
          </select>
        </div>
        <HistoryChart scores={history.map((p) => p.score)} hue={gameById(sel)?.hue ?? 300} />
        <div className="mt-2 text-xs text-[var(--color-muted)]">{history.length ? `Last ${history.length} runs · best ${bestScore(plays, sel)}` : 'No runs yet.'}</div>
      </section>

      <section className="mt-6">
        <h2 className="mb-3 font-display text-xl font-bold">Best scores</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {GAMES.map((g) => {
            const b = bestScore(plays, g.id);
            const r = rankFor(b);
            return (
              <Link key={g.id} to={`/play/${g.id}`} className="glass flex items-center gap-2 rounded-2xl p-3 transition hover:scale-[1.03]">
                <span className="text-2xl">{g.emoji}</span>
                <div className="min-w-0">
                  <div className="truncate text-xs font-bold">{g.name}</div>
                  <div className="font-mono text-sm font-bold" style={{ color: b ? r.color : 'var(--color-muted)' }}>{b || '—'}</div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 font-display text-xl font-bold">Achievements <span className="text-sm text-[var(--color-muted)]">{unlockedCount}/{ACHIEVEMENTS.length}</span></h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {ACHIEVEMENTS.map((a) => {
            const got = !!unlocked[a.id];
            return (
              <div key={a.id} className={`glass relative overflow-hidden rounded-2xl p-3 ${got ? '' : 'opacity-45 grayscale'}`} title={a.desc}>
                {got && <div aria-hidden className="absolute -right-6 -top-6 h-16 w-16 rounded-full blur-xl" style={{ background: TIER[a.tier] }} />}
                <div className="relative flex items-center gap-2">
                  <span className="text-2xl">{got ? a.icon : '🔒'}</span>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold">{a.name}</div>
                    <div className="truncate text-[11px] text-[var(--color-muted)]">{a.desc}</div>
                  </div>
                </div>
                <div className="relative mt-2 text-[9px] font-black uppercase tracking-widest" style={{ color: TIER[a.tier] }}>{a.tier}</div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function HistoryChart({ scores, hue }: { scores: number[]; hue: number }) {
  const W = 800, H = 200, P = 24;
  if (scores.length < 1) return <div className="grid h-48 place-items-center rounded-2xl border border-dashed border-[var(--color-line)] text-sm text-[var(--color-muted)]">Play this game to see your trend.</div>;
  const x = (i: number) => P + (scores.length === 1 ? (W - 2 * P) / 2 : (i * (W - 2 * P)) / (scores.length - 1));
  const y = (v: number) => H - P - (v / 1000) * (H - 2 * P);
  const line = scores.map((s, i) => `${i ? 'L' : 'M'}${x(i)},${y(s)}`).join(' ');
  const area = `${line} L${x(scores.length - 1)},${H - P} L${x(0)},${H - P} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-48 w-full" role="img" aria-label="Score history chart">
      <defs>
        <linearGradient id="hc" x1="0" y1="0" x2="0" y2="1"><stop stopColor={`hsl(${hue} 90% 60%)`} stopOpacity=".5" /><stop offset="1" stopColor={`hsl(${hue} 90% 60%)`} stopOpacity="0" /></linearGradient>
      </defs>
      {[0, 250, 500, 750, 1000].map((v) => (
        <g key={v}>
          <line x1={P} x2={W - P} y1={y(v)} y2={y(v)} stroke="var(--color-line)" strokeDasharray="3 5" />
          <text x={0} y={y(v) + 4} fontSize="10" fill="var(--color-muted)">{v}</text>
        </g>
      ))}
      <path d={area} fill="url(#hc)" />
      <path d={line} fill="none" stroke={`hsl(${hue} 95% 65%)`} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 6px hsl(${hue} 95% 60%))` }} />
      {scores.map((s, i) => <circle key={i} cx={x(i)} cy={y(s)} r="4" fill="#fff"><title>{s}</title></circle>)}
    </svg>
  );
}
