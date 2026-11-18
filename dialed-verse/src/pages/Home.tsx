import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { CATEGORIES, GAMES } from '@/games/registry';
import { bestScore, computeStreak, dailyPlay, useStore } from '@/core/store';
import { dayNumber, msUntilReset } from '@/core/rng';
import { TiltCard } from '@/ui/Interactive';
import Flame from '@/ui/Flame';
import { audio } from '@/audio/engine';
import { useReducedMotion, useUi } from '@/ui/fx';
import { useSeo } from './seo';
import { rankFor } from '@/core/scoring';

function useCountdown() {
  const [ms, setMs] = useState(msUntilReset());
  useEffect(() => { const t = setInterval(() => setMs(msUntilReset()), 1000); return () => clearInterval(t); }, []);
  const s = Math.floor(ms / 1000);
  return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((n) => String(n).padStart(2, '0')).join(':');
}

export default function Home() {
  useSeo('Dialed-verse · Daily sensory memory games', '42 daily games that test your senses: recreate colors, pitches, rhythms, shapes and more from memory.');
  const daily = useStore((s) => s.daily);
  const plays = useStore((s) => s.plays);
  const streak = computeStreak(daily);
  const countdown = useCountdown();
  const [cat, setCat] = useState<string>('all');
  const [q, setQ] = useState('');
  const reduced = useReducedMotion();
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, reduced ? 0 : 140]);
  const heroO = useTransform(scrollY, [0, 400], [1, reduced ? 1 : 0.2]);
  const doneToday = GAMES.filter((g) => dailyPlay(daily, g.id)).length;
  const pct = doneToday / GAMES.length;

  useEffect(() => { useUi.getState().setHue(300); useUi.getState().setEnergy(0.35 + Math.min(streak.current, 10) * 0.04); }, [streak.current]);

  const list = useMemo(() => GAMES.filter((g) => (cat === 'all' || g.category === cat) && (!q || (g.name + g.tagline).toLowerCase().includes(q.toLowerCase()))), [cat, q]);
  const nextUp = GAMES.find((g) => !dailyPlay(daily, g.id));

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6">
      <motion.section style={{ y: heroY, opacity: heroO }} className="relative pb-10 pt-8 text-center sm:pt-14">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] bg-[var(--color-glass)] px-4 py-1.5 text-xs font-bold uppercase tracking-[0.25em] text-[var(--color-muted)] backdrop-blur">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--color-good)]" /> Daily #{dayNumber()} · resets in <span className="font-mono text-[var(--color-fg)]">{countdown}</span>
        </motion.div>
        <h1 className="font-display text-[clamp(2.6rem,11vw,8.5rem)] font-black leading-[0.88] tracking-tight">
          {'DIALED'.split('').map((c, i) => (
            <motion.span key={i} className="chroma inline-block" initial={{ y: 80, opacity: 0, rotateX: -90 }} animate={{ y: 0, opacity: 1, rotateX: 0 }} transition={{ delay: i * 0.05, type: 'spring', stiffness: 160, damping: 14 }}>{c}</motion.span>
          ))}
          <br />
          <motion.span className="text-gradient inline-block" initial={{ opacity: 0, letterSpacing: '0.5em' }} animate={{ opacity: 1, letterSpacing: '0em' }} transition={{ delay: 0.35, duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}>·VERSE</motion.span>
        </h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mx-auto mt-5 max-w-xl text-base text-[var(--color-muted)] sm:text-lg">
          Memorize a stimulus. Recreate it. {GAMES.length} daily games for your eyes, ears and reflexes. Same seed for everyone on Earth.
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75 }} className="mx-auto mt-8 grid max-w-3xl gap-3 sm:grid-cols-3">
          <div className="glass flex items-center gap-3 rounded-3xl p-4 text-left">
            <Flame streak={streak.current} size={40} />
            <div>
              <div className="font-display text-3xl font-black leading-none">{streak.current}</div>
              <div className="text-xs font-bold uppercase tracking-widest text-[var(--color-muted)]">day streak · best {streak.best}</div>
            </div>
          </div>
          <div className="glass flex items-center gap-3 rounded-3xl p-4 text-left">
            <svg width="48" height="48" viewBox="0 0 48 48" className="-rotate-90" aria-hidden>
              <circle cx="24" cy="24" r="20" fill="none" stroke="var(--color-line)" strokeWidth="6" />
              <circle cx="24" cy="24" r="20" fill="none" stroke="url(#pg)" strokeWidth="6" strokeLinecap="round" strokeDasharray={`${pct * 125.6} 200`} style={{ transition: 'stroke-dasharray 1s' }} />
              <defs><linearGradient id="pg"><stop stopColor="var(--color-accent)" /><stop offset="1" stopColor="var(--color-accent2)" /></linearGradient></defs>
            </svg>
            <div>
              <div className="font-display text-3xl font-black leading-none">{doneToday}<span className="text-base text-[var(--color-muted)]">/{GAMES.length}</span></div>
              <div className="text-xs font-bold uppercase tracking-widest text-[var(--color-muted)]">today's dailies</div>
            </div>
          </div>
          {nextUp ? (
            <Link to={`/play/${nextUp.id}`} onClick={() => audio.whoosh()} className="btn-primary group flex items-center gap-3 rounded-3xl p-4 text-left text-white">
              <span className="text-4xl transition-transform group-hover:scale-125">{nextUp.emoji}</span>
              <span>
                <span className="block text-xs font-bold uppercase tracking-widest opacity-80">Up next</span>
                <span className="font-display text-lg font-black">{nextUp.name} →</span>
              </span>
            </Link>
          ) : (
            <div className="glass grid place-items-center rounded-3xl p-4 font-display font-black">🏆 All done today!</div>
          )}
        </motion.div>
      </motion.section>

      <div className="sticky top-[68px] z-20 -mx-4 mb-6 flex flex-wrap items-center gap-2 bg-[var(--color-bg)]/70 px-4 py-3 backdrop-blur-xl sm:mx-0 sm:rounded-full sm:border sm:border-[var(--color-line)] sm:px-3">
        <div className="flex gap-1 overflow-x-auto scrollbar-none" role="tablist" aria-label="Categories">
          {[{ id: 'all', name: 'All games' }, ...CATEGORIES].map((c) => (
            <button key={c.id} role="tab" aria-selected={cat === c.id} onClick={() => { audio.toggle(true); setCat(c.id); }} onPointerEnter={() => audio.hover()} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition ${cat === c.id ? 'bg-[var(--color-fg)] text-[var(--color-bg)]' : 'text-[var(--color-muted)] hover:text-[var(--color-fg)]'}`}>
              {c.name}
            </button>
          ))}
        </div>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search games…" aria-label="Search games" className="ml-auto w-full rounded-full border border-[var(--color-line)] bg-black/20 px-4 py-2 text-sm outline-none focus:border-[var(--color-accent2)] sm:w-56" />
      </div>

      {(cat === 'all' ? CATEGORIES : CATEGORIES.filter((c) => c.id === cat)).map((c) => {
        const games = list.filter((g) => g.category === c.id);
        if (!games.length) return null;
        return (
          <section key={c.id} className="mb-12">
            <div className="mb-4 flex items-baseline justify-between gap-4">
              <h2 className="font-display text-2xl font-black sm:text-3xl">{c.name}</h2>
              <span className="text-sm text-[var(--color-muted)]">{c.blurb}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
              {games.map((g, i) => {
                const done = dailyPlay(daily, g.id);
                const best = bestScore(plays, g.id);
                return (
                  <motion.div key={g.id} initial={{ opacity: 0, y: 40, scale: 0.92 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true, margin: '-40px' }} transition={{ delay: (i % 10) * 0.04, type: 'spring', stiffness: 140, damping: 16 }}>
                    <Link to={`/play/${g.id}`} onPointerEnter={() => audio.hover()} onClick={() => { audio.unlock(); audio.whoosh(); }} className="group block h-full rounded-[1.6rem] focus-visible:outline-offset-4">
                      <TiltCard className="glass h-full overflow-hidden rounded-[1.6rem] p-4 sm:p-5">
                        <div aria-hidden className="absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-50 blur-2xl transition-opacity duration-300 group-hover:opacity-100" style={{ background: `hsl(${g.hue} 95% 58%)` }} />
                        <div className="relative flex items-start justify-between">
                          <span className="text-4xl transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-110 sm:text-5xl" style={{ filter: `drop-shadow(0 6px 16px hsl(${g.hue} 90% 50% / .6))` }}>{g.emoji}</span>
                          {done ? (
                            <span className="rounded-full px-2 py-0.5 font-mono text-xs font-bold" style={{ background: `${rankFor(done.score).color}26`, color: rankFor(done.score).color }}>✓ {done.score}</span>
                          ) : (
                            <span className="rounded-full border border-[var(--color-line)] px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-[var(--color-muted)]">New</span>
                          )}
                        </div>
                        <div className="relative mt-4 font-display text-base font-bold leading-tight sm:text-lg">{g.name}</div>
                        <p className="relative mt-1 line-clamp-2 text-xs text-[var(--color-muted)] sm:text-sm">{g.tagline}</p>
                        {best > 0 && <div className="relative mt-3 text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted)]">Best {best}</div>}
                      </TiltCard>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </section>
        );
      })}
      {list.length === 0 && <p className="py-20 text-center text-[var(--color-muted)]">No games match “{q}”.</p>}
    </div>
  );
}
