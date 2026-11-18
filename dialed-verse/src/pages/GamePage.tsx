import { Component, Suspense, lazy, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { gameById, loadGame } from '@/games/registry';
import type { Difficulty, GameResult, Mode } from '@/core/types';
import { createRng, dailySeed, dateKey, dayNumber, randomSeed } from '@/core/rng';
import { useStore, dailyPlay } from '@/core/store';
import { audio } from '@/audio/engine';
import { useUi } from '@/ui/fx';
import { evaluateAchievements } from '@/core/achievements';
import { toast } from '@/ui/Toasts';
import Results from './Results';
import { MagneticButton } from '@/ui/Interactive';
import { useSeo } from './seo';
import NotFound from './NotFound';

type Phase = 'intro' | 'countdown' | 'play' | 'results';

export default function GamePage() {
  const { id = '' } = useParams();
  const meta = gameById(id);
  if (!meta) return <NotFound />;
  return <GameShell key={id} id={id} />;
}

function GameShell({ id }: { id: string }) {
  const meta = gameById(id)!;
  useSeo(`${meta.name} · Dialed-verse`, `${meta.tagline} Play today's ${meta.name} daily challenge, free.`);
  const Game = useMemo(() => lazy(loadGame(id)), [id]);
  const daily = useStore((s) => s.daily);
  const today = dailyPlay(daily, id);
  const [mode, setMode] = useState<Mode>(today ? 'practice' : 'daily');
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [phase, setPhase] = useState<Phase>('intro');
  const [count, setCount] = useState(3);
  const [run, setRun] = useState<{ seed: number; key: number }>({ seed: 0, key: 0 });
  const [result, setResult] = useState<{ r: GameResult; fresh: boolean; mode: Mode } | null>(null);

  useEffect(() => {
    useUi.getState().setHue(meta.hue);
    useUi.getState().setEnergy(0.3);
    if (audio.ready) audio.startPad(meta.hue);
    // preload the chunk while the intro is showing
    loadGame(id)().catch(() => {});
  }, [id, meta.hue]);

  useEffect(() => {
    audio.duck(phase === 'play' && !!meta.audio);
    return () => audio.duck(false);
  }, [phase, meta.audio]);

  const start = () => {
    audio.unlock();
    audio.startPad(meta.hue);
    const seed = mode === 'daily' ? dailySeed(id) : randomSeed();
    setRun((r) => ({ seed, key: r.key + 1 }));
    setPhase('countdown');
    setCount(3);
    window.scrollTo({ top: 0 });
  };

  useEffect(() => {
    if (phase !== 'countdown') return;
    audio.countdown(count === 0);
    if (count === 0) {
      const t = setTimeout(() => { setPhase('play'); audio.whoosh(); }, 450);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setCount((c) => c - 1), 600);
    return () => clearTimeout(t);
  }, [phase, count]);

  const finish = (r: GameResult) => {
    const score = Math.max(0, Math.min(1000, Math.round(r.score)));
    const res = { ...r, score };
    const st = useStore.getState();
    const play = { game: id, score, mode, difficulty: mode === 'daily' ? ('normal' as const) : difficulty, date: dateKey(), ts: Date.now(), rounds: r.rounds, summary: r.summary };
    // daily lock: a second daily completion (e.g. two tabs) is recorded as practice
    if (mode === 'daily' && dailyPlay(st.daily, id)) play.mode = 'practice';
    st.recordPlay(play);
    const s2 = useStore.getState();
    const fresh = evaluateAchievements({ plays: s2.plays, daily: s2.daily }, s2.achievements);
    if (fresh.length) {
      s2.unlock(fresh.map((a) => a.id));
      fresh.slice(0, 3).forEach((a, i) => setTimeout(() => { toast({ icon: a.icon, title: a.name, body: a.desc }); audio.fanfare(0.3); }, 2600 + i * 700));
    }
    setResult({ r: res, fresh: true, mode });
    setPhase('results');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const viewToday = () => {
    if (!today) return;
    setResult({ r: { score: today.score, rounds: today.rounds, summary: today.summary ?? '' }, fresh: false, mode: 'daily' });
    setPhase('results');
  };

  const rng = useMemo(() => createRng(run.seed), [run]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-4 sm:px-6">
      <div className="mb-5 flex items-center gap-3">
        <Link to="/" className="btn btn-ghost !px-3 !py-2 text-sm" onClick={() => audio.whoosh()} aria-label="Back to hub">←</Link>
        <div className="flex min-w-0 items-center gap-2 font-display font-bold">
          <span className="text-2xl">{meta.emoji}</span>
          <span className="truncate">{meta.name}</span>
        </div>
        {phase !== 'intro' && (
          <span className="ml-auto rounded-full border border-[var(--color-line)] px-3 py-1 text-xs font-bold uppercase tracking-widest text-[var(--color-muted)]">
            {mode === 'daily' ? `Daily #${dayNumber()}` : `Practice · ${difficulty}`}
          </span>
        )}
      </div>

      <AnimatePresence mode="wait">
        {phase === 'intro' && (
          <motion.div key="intro" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, filter: 'blur(8px)' }} className="grid items-center gap-8 lg:grid-cols-2">
            <div className="relative text-center lg:text-left">
              <motion.div initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.1 }} className="mx-auto inline-grid h-32 w-32 animate-float place-items-center rounded-[2.2rem] text-7xl lg:mx-0" style={{ background: `linear-gradient(135deg, hsl(${meta.hue} 90% 60% / .35), hsl(${meta.hue + 60} 90% 50% / .15))`, boxShadow: `0 20px 80px -10px hsl(${meta.hue} 90% 55% / .6), inset 0 1px 0 rgb(255 255 255 / .3)` }}>
                {meta.emoji}
              </motion.div>
              <h1 className="chroma-glitch mt-6 font-display text-4xl font-black leading-[1.05] sm:text-6xl">{meta.name}</h1>
              <p className="mt-3 text-lg text-[var(--color-muted)]">{meta.tagline}</p>
              <ol className="mx-auto mt-6 max-w-md space-y-2 text-left lg:mx-0">
                {meta.howTo.map((h, i) => (
                  <motion.li key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 + i * 0.08 }} className="flex gap-3">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-black text-black" style={{ background: `hsl(${meta.hue + i * 30} 90% 65%)` }}>{i + 1}</span>
                    <span>{h}</span>
                  </motion.li>
                ))}
              </ol>
            </div>
            <div className="glass rounded-[2rem] p-6 sm:p-8">
              <div className="grid grid-cols-2 gap-2 rounded-2xl bg-black/20 p-1" role="tablist" aria-label="Mode">
                {(['daily', 'practice'] as Mode[]).map((m) => (
                  <button key={m} role="tab" aria-selected={mode === m} onClick={() => { audio.toggle(m === 'daily'); setMode(m); }} className={`rounded-xl py-3 font-display text-sm font-bold uppercase tracking-wider transition ${mode === m ? 'bg-[var(--color-fg)] text-[var(--color-bg)] shadow-lg' : 'text-[var(--color-muted)] hover:text-[var(--color-fg)]'}`}>
                    {m === 'daily' ? `☀ Daily #${dayNumber()}` : '∞ Practice'}
                  </button>
                ))}
              </div>
              {mode === 'daily' ? (
                <div className="mt-5 text-sm text-[var(--color-muted)]">
                  {today ? (
                    <div className="rounded-2xl border border-[var(--color-line)] p-4 text-center">
                      <div className="text-xs uppercase tracking-widest">Today's score</div>
                      <div className="font-display text-5xl font-black text-[var(--color-fg)]">{today.score}</div>
                      <button className="btn btn-ghost mt-3" onClick={viewToday}>View result & share</button>
                      <p className="mt-3">One attempt per day. Practice is unlimited.</p>
                    </div>
                  ) : (
                    <p>Same challenge for every player on Earth today ({dateKey()} UTC). <b className="text-[var(--color-fg)]">One attempt.</b> Normal difficulty.</p>
                  )}
                </div>
              ) : (
                <div className="mt-5">
                  <div className="mb-2 text-xs font-bold uppercase tracking-widest text-[var(--color-muted)]">Difficulty</div>
                  <div className="grid grid-cols-3 gap-2">
                    {(['easy', 'normal', 'hard'] as Difficulty[]).map((d) => (
                      <button key={d} aria-pressed={difficulty === d} onClick={() => { audio.toggle(true); setDifficulty(d); }} className={`rounded-xl border py-2.5 text-sm font-bold capitalize transition ${difficulty === d ? 'border-transparent bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent3)] text-white' : 'border-[var(--color-line)] text-[var(--color-muted)]'}`}>{d}</button>
                    ))}
                  </div>
                  <p className="mt-3 text-sm text-[var(--color-muted)]">A fresh random seed every run.</p>
                </div>
              )}
              {!(mode === 'daily' && today) && (
                <MagneticButton className="btn-primary mt-6 w-full !py-4 text-lg" onClick={start} autoFocus>
                  ▶ Start {mode === 'daily' ? 'daily' : 'practice'}
                </MagneticButton>
              )}
            </div>
          </motion.div>
        )}

        {phase === 'countdown' && (
          <motion.div key="cd" className="grid min-h-[50vh] place-items-center" exit={{ opacity: 0 }}>
            <AnimatePresence mode="popLayout">
              <motion.div key={count} initial={{ scale: 2.4, opacity: 0, rotate: -10 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} exit={{ scale: 0.4, opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 18 }} className="chroma font-display text-[9rem] font-black leading-none" style={{ color: `hsl(${meta.hue + count * 40} 90% 65%)` }}>
                {count === 0 ? 'GO' : count}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}

        {phase === 'play' && (
          <motion.div key={`play-${run.key}`} initial={{ opacity: 0, clipPath: 'circle(0% at 50% 50%)' }} animate={{ opacity: 1, clipPath: 'circle(150% at 50% 50%)', transitionEnd: { clipPath: 'none' } }} exit={{ opacity: 0 }} transition={{ duration: 0.6, ease: [0.7, 0, 0.2, 1] }}>
            <ErrorBoundary onReset={() => setPhase('intro')}>
              <Suspense fallback={<Spinner />}>
                <Game seed={run.seed} rng={rng} difficulty={mode === 'daily' ? 'normal' : difficulty} mode={mode} meta={meta} onFinish={finish} />
              </Suspense>
            </ErrorBoundary>
          </motion.div>
        )}

        {phase === 'results' && result && (
          <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Results meta={meta} result={result.r} mode={result.mode} fresh={result.fresh} onReplay={() => { setMode('practice'); setPhase('intro'); }} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Spinner() {
  return <div className="grid min-h-[40vh] place-items-center"><div className="h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-[var(--color-accent)]" /></div>;
}

class ErrorBoundary extends Component<{ children: ReactNode; onReset: () => void }, { err: Error | null }> {
  state = { err: null as Error | null };
  static getDerivedStateFromError(err: Error) { return { err }; }
  componentDidCatch(err: Error) { console.error(err); }
  render() {
    if (this.state.err) return (
      <div className="glass mx-auto max-w-md rounded-3xl p-6 text-center">
        <div className="text-4xl">💥</div>
        <p className="mt-2 font-bold">This game hit a glitch.</p>
        <p className="mt-1 text-sm text-[var(--color-muted)]">{this.state.err.message}</p>
        <button className="btn btn-primary mt-4" onClick={() => { this.setState({ err: null }); this.props.onReset(); }}>Back</button>
      </div>
    );
    return this.props.children;
  }
}
