import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { audio } from '@/audio/engine';
import { useUi } from '@/ui/fx';
import { burst } from '@/ui/Confetti';

export interface RoundRunnerProps<T> {
  targets: T[];
  /** How long the stimulus is visible. */
  memorizeMs: number;
  /** Short noise mask between stimulus and recall (kills afterimages). */
  maskMs?: number;
  showLabel?: string;
  renderShow: (t: T, i: number) => ReactNode;
  renderInput: (t: T, i: number, submit: (score: number, info?: ReactNode) => void) => ReactNode;
  onDone: (scores: number[]) => void;
}

/** Generic "memorize -> recreate -> reveal" loop used by the sensory games. */
export default function RoundRunner<T>({ targets, memorizeMs, maskMs = 450, showLabel = 'Memorize', renderShow, renderInput, onDone }: RoundRunnerProps<T>) {
  const [i, setI] = useState(0);
  const [phase, setPhase] = useState<'show' | 'mask' | 'input' | 'reveal'>('show');
  const [scores, setScores] = useState<number[]>([]);
  const [info, setInfo] = useState<ReactNode>(null);
  const revealRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (phase === 'show') {
      const t = setTimeout(() => setPhase(maskMs ? 'mask' : 'input'), memorizeMs);
      return () => clearTimeout(t);
    }
    if (phase === 'mask') {
      const t = setTimeout(() => setPhase('input'), maskMs);
      return () => clearTimeout(t);
    }
  }, [phase, memorizeMs, maskMs]);

  const submit = (score: number, inf?: ReactNode) => {
    const s = Math.max(0, Math.min(1, score));
    setScores((a) => [...a, s]);
    setInfo(inf ?? null);
    setPhase('reveal');
    if (s >= 0.9) { audio.success(s); const r = revealRef.current?.getBoundingClientRect(); burst(r ? r.left + r.width / 2 : innerWidth / 2, r ? r.top + 40 : innerHeight / 3, { count: 50, power: 9 }); }
    else if (s >= 0.6) audio.success(s * 0.5);
    else { audio.fail(); useUi.getState().flash(); }
    useUi.getState().setEnergy(0.25 + s * 0.6);
  };

  const next = () => {
    audio.whoosh();
    if (i + 1 >= targets.length) { onDone(scores); return; }
    setI(i + 1);
    setInfo(null);
    setPhase('show');
  };

  useEffect(() => {
    if (phase !== 'reveal') return;
    const k = (e: KeyboardEvent) => { if (e.key === 'Enter') { e.preventDefault(); next(); } };
    addEventListener('keydown', k);
    return () => removeEventListener('keydown', k);
  });

  const t = targets[i];
  const last = scores[scores.length - 1] ?? 0;
  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex gap-1.5" aria-label={`Round ${i + 1} of ${targets.length}`}>
          {targets.map((_, k) => (
            <span key={k} className="h-2 w-8 rounded-full transition-all duration-500 sm:w-10" style={{ background: k < scores.length ? `hsl(${scores[k] * 130} 85% 55%)` : k === i ? 'var(--color-fg)' : 'var(--color-line)' }} />
          ))}
        </div>
        <span className="font-mono text-sm text-[var(--color-muted)]">{i + 1}/{targets.length}</span>
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={`${i}-${phase === 'reveal' ? 'input' : phase}`} initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -12, filter: 'blur(6px)' }} transition={{ duration: 0.28 }}>
          {phase === 'show' && (
            <div>
              <div className="mb-3 text-center text-xs font-black uppercase tracking-[0.35em] text-[var(--color-muted)]">{showLabel}</div>
              {renderShow(t, i)}
              <div className="mx-auto mt-4 h-1.5 max-w-sm overflow-hidden rounded-full bg-[var(--color-line)]">
                <div className="h-full origin-left bg-[var(--color-fg)]" style={{ animation: `dv-shrink ${memorizeMs}ms linear forwards` }} />
              </div>
              <style>{'@keyframes dv-shrink{from{transform:scaleX(1)}to{transform:scaleX(0)}}'}</style>
            </div>
          )}
          {phase === 'mask' && <Mask />}
          {(phase === 'input' || phase === 'reveal') && (
            <div className="relative">
              <div className={phase === 'reveal' ? 'pointer-events-none' : ''}>{renderInput(t, i, submit)}</div>
              {phase === 'reveal' && (
                <motion.div ref={revealRef} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass mt-4 rounded-3xl p-5 text-center">
                  <div className="font-display text-5xl font-black chroma" style={{ color: `hsl(${last * 130} 90% 62%)` }}>{Math.round(last * 100)}%</div>
                  <div className="mt-2 text-sm text-[var(--color-muted)]">{info}</div>
                  <button autoFocus className="btn btn-primary mt-4" onClick={() => { audio.click(); next(); }}>{i + 1 >= targets.length ? 'See results' : 'Next round'} →</button>
                </motion.div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function Mask() {
  return (
    <div className="mx-auto aspect-[4/3] max-h-[50vh] w-full max-w-xl overflow-hidden rounded-3xl" aria-label="mask">
      <div className="h-full w-full" style={{ background: 'repeating-conic-gradient(#888 0 25%, #222 0 50%) 0 0/14px 14px', filter: 'blur(1px) contrast(1.4)', animation: 'grain .3s steps(3) infinite' }} />
    </div>
  );
}
