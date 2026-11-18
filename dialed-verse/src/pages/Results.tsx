import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import type { GameMeta, GameResult, Mode } from '@/core/types';
import { rankFor, roundEmoji } from '@/core/scoring';
import { copyText, drawShareCard, shareText } from '@/core/share';
import { audio } from '@/audio/engine';
import SlotScore from '@/ui/SlotScore';
import { burst, rain } from '@/ui/Confetti';
import { useUi } from '@/ui/fx';
import { useStore, dailyPlay } from '@/core/store';
import { GAMES } from '@/games/registry';
import LeaderboardPanel from './LeaderboardPanel';
import { submitScore } from '@/core/leaderboard';

export default function Results({ meta, result, mode, onReplay, fresh }: { meta: GameMeta; result: GameResult; mode: Mode; onReplay: () => void; fresh: boolean }) {
  const rank = rankFor(result.score);
  const [revealed, setRevealed] = useState(!fresh);
  const [copied, setCopied] = useState(false);
  const [img, setImg] = useState<string | null>(null);
  const [lbKey, setLbKey] = useState(0);
  const text = useMemo(() => shareText(meta, result, mode), [meta, result, mode]);
  const daily = useStore((s) => s.daily);
  const nickname = useStore((s) => s.nickname);
  const setNickname = useStore((s) => s.setNickname);
  const [submitted, setSubmitted] = useState<'no' | 'busy' | 'remote' | 'local'>('no');
  const nextGame = GAMES.find((g) => g.id !== meta.id && !dailyPlay(daily, g.id));

  const onRevealed = () => {
    setRevealed(true);
    if (!fresh) return;
    const s = result.score;
    useUi.getState().setEnergy(0.3 + (s / 1000) * 0.7);
    if (s >= 880) { audio.fanfare(s / 1000); burst(innerWidth / 2, innerHeight * 0.3, { count: 160, power: 15 }); if (s >= 940) rain(); }
    else if (s >= 600) audio.success(s / 1000);
    else audio.fail();
    if (s >= 980) useUi.getState().shake();
  };

  useEffect(() => {
    let alive = true;
    drawShareCard(meta, result, mode).then((c) => alive && setImg(c.toDataURL('image/png')));
    return () => { alive = false; };
  }, [meta, result, mode]);

  const doShare = async () => {
    audio.click();
    try {
      if (navigator.share) {
        const files: File[] = [];
        if (img) { const blob = await (await fetch(img)).blob(); files.push(new File([blob], `${meta.id}.png`, { type: 'image/png' })); }
        const data: ShareData = { text, ...(files.length && navigator.canShare?.({ files }) ? { files } : {}) };
        await navigator.share(data);
        return;
      }
    } catch { /* cancelled */ }
    const ok = await copyText(text);
    setCopied(ok);
  };

  const submit = async () => {
    setSubmitted('busy');
    const r = await submitScore(meta.id, result.score, nickname);
    setSubmitted(r);
    setLbKey((k) => k + 1);
  };

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-5 lg:grid-cols-[1.1fr_0.9fr]">
      <motion.section initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="glass relative overflow-hidden rounded-[2rem] p-6 sm:p-8">
        <div aria-hidden className="absolute -right-24 -top-24 h-72 w-72 rounded-full blur-3xl" style={{ background: `hsl(${meta.hue} 90% 55% / .35)` }} />
        <div className="text-xs font-black uppercase tracking-[0.3em] text-[var(--color-muted)]">{mode === 'daily' ? "Today's result" : 'Practice result'}</div>
        <div className="mt-1 flex items-center gap-2 font-display text-xl font-bold"><span>{meta.emoji}</span>{meta.name}</div>
        <div className="mt-4 flex items-end gap-3">
          <SlotScore value={result.score} onDone={onRevealed} className="text-7xl sm:text-8xl" />
          <span className="mb-3 font-mono text-lg text-[var(--color-muted)]">/1000</span>
        </div>
        {revealed && (
          <motion.div initial={{ scale: 0.3, rotate: -12, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 14 }} className="mt-3 inline-flex items-center gap-2 rounded-full px-4 py-2 font-display text-lg font-black" style={{ background: `${rank.color}22`, color: rank.color, boxShadow: `0 0 40px -6px ${rank.color}`, border: `1px solid ${rank.color}66` }}>
            <span className="text-2xl">{rank.emoji}</span> {rank.title}
          </motion.div>
        )}
        <p className="mt-4 text-[var(--color-muted)]">{result.summary}</p>
        {result.rounds && result.rounds.length > 0 && (
          <div className="mt-5 flex h-28 items-end gap-2">
            {result.rounds.map((r, i) => (
              <motion.div key={i} initial={{ height: 0 }} animate={{ height: `${10 + r * 90}%` }} transition={{ delay: 0.3 + i * 0.08, type: 'spring', stiffness: 120 }} className="relative flex-1 rounded-t-xl" style={{ background: `linear-gradient(to top, hsl(${meta.hue + i * 20} 90% 45% / .4), hsl(${meta.hue + i * 20} 95% 62%))` }} title={`${Math.round(r * 100)}%`}>
                <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-[var(--color-muted)]">{Math.round(r * 100)}</span>
              </motion.div>
            ))}
          </div>
        )}
        {result.details && (
          <dl className="mt-5 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
            {result.details.map((d) => (
              <div key={d.label} className="rounded-xl border border-[var(--color-line)] px-3 py-2">
                <dt className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted)]">{d.label}</dt>
                <dd className="font-mono font-bold">{d.value}</dd>
              </div>
            ))}
          </dl>
        )}
        <div className="mt-6 flex flex-wrap gap-2">
          <button className="btn btn-primary" onClick={onReplay}>↻ {mode === 'daily' ? 'Practice mode' : 'Play again'}</button>
          {nextGame && <Link to={`/play/${nextGame.id}`} className="btn btn-ghost" onClick={() => audio.whoosh()}>Next: {nextGame.emoji} {nextGame.name}</Link>}
          <Link to="/" className="btn btn-ghost" onClick={() => audio.whoosh()}>⌂ Hub</Link>
        </div>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="flex flex-col gap-5">
        <div className="glass rounded-[2rem] p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display font-bold">Share</h3>
            <span className="text-2xl tracking-tight">{result.grid ? '' : result.rounds?.map(roundEmoji).join('')}</span>
          </div>
          {img ? <img src={img} alt={`${meta.name} share card`} className="w-full rounded-2xl ring-1 ring-white/10" /> : <div className="aspect-[1200/630] animate-pulse rounded-2xl bg-white/5" />}
          <pre className="mt-3 max-h-32 overflow-auto whitespace-pre-wrap rounded-xl bg-black/30 p-3 font-mono text-xs">{text}</pre>
          <div className="mt-3 flex flex-wrap gap-2">
            <button className="btn btn-primary" onClick={doShare}>{copied ? '✓ Copied' : '↗ Share'}</button>
            <button className="btn btn-ghost" onClick={async () => { audio.click(); setCopied(await copyText(text)); }}>Copy text</button>
            {img && <a className="btn btn-ghost" href={img} download={`dialed-verse-${meta.id}.png`} onClick={() => audio.click()}>⤓ Image</a>}
          </div>
        </div>
        <div className="glass rounded-[2rem] p-5">
          {mode === 'daily' && submitted !== 'remote' && submitted !== 'local' && (
            <form className="mb-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); submit(); }}>
              <input aria-label="Nickname" value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="Nickname (optional)" maxLength={18} className="min-w-0 flex-1 rounded-full border border-[var(--color-line)] bg-black/20 px-4 py-2 outline-none focus:border-[var(--color-accent2)]" />
              <button className="btn btn-primary !py-2" disabled={submitted === 'busy'}>{submitted === 'busy' ? '…' : 'Post score'}</button>
            </form>
          )}
          {submitted === 'local' && <p className="mb-3 text-xs text-[var(--color-muted)]">Saved locally (online leaderboard not configured).</p>}
          <LeaderboardPanel key={lbKey} game={meta.id} compact />
        </div>
      </motion.section>
    </div>
  );
}
