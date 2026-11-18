import { useMemo, useState } from 'react';
import type { GameProps } from '@/core/types';
import { audio } from '@/audio/engine';
import RoundRunner from '../_shared/RoundRunner';
import { memo, roundsResult } from '../_shared/helpers';

export const EMOJI = ['🍎', '🚀', '🐙', '🎸', '🌵', '🧊', '🦊', '🍩', '⚽', '🌙', '🔥', '🎈', '🐝', '🍄', '🧲', '🎲', '🦄', '🍉', '🐢', '⭐', '🌈', '🍕', '🐳', '🎃', '🧁', '🛸', '🌻', '🦀', '🎁', '🧩', '🪐', '🦋', '🍋', '🐸', '🥨', '🎺'];

export default function EmojiOrder({ rng, difficulty, onFinish }: GameProps) {
  const base = memo(difficulty, 4, 6, 8);
  const targets = useMemo(() => [0, 1, 2, 3].map((k) => { const seq = rng.sample(EMOJI, base + k); const decoys = difficulty === 'hard' ? rng.sample(EMOJI.filter((e) => !seq.includes(e)), 3) : []; return { seq, choices: rng.shuffle([...seq, ...decoys]) }; }), [rng, base, difficulty]);
  const [right, setRight] = useState(0);
  const [total, setTotal] = useState(0);
  return (
    <RoundRunner
      targets={targets}
      memorizeMs={(t) => 900 + t.seq.length * memo(difficulty, 900, 600, 420)}
      renderShow={(t) => <div className="glass mx-auto flex max-w-3xl flex-wrap justify-center gap-2 rounded-[2rem] p-6 sm:gap-3">{t.seq.map((e, k) => <span key={k} className="tile-pop grid h-14 w-14 place-items-center rounded-2xl bg-white/5 text-4xl sm:h-16 sm:w-16" style={{ animationDelay: `${k * 60}ms` }}>{e}</span>)}</div>}
      renderInput={(t, i, submit) => <Input key={i} t={t} onSubmit={(ans) => {
        const ok = ans.filter((e, k) => e === t.seq[k]).length;
        setRight((r) => r + ok); setTotal((x) => x + t.seq.length);
        submit(ok / t.seq.length, <span className="text-2xl tracking-wider">{t.seq.join('')}<br /><span className="text-sm">{t.seq.map((e, k) => (ans[k] === e ? '🟩' : '🟥')).join('')}</span></span>);
      }} />}
      onDone={(s) => onFinish(roundsResult(s, `${right + 0}/${total} emoji in the right spot`))}
    />
  );
}

function Input({ t, onSubmit }: { t: { seq: string[]; choices: string[] }; onSubmit: (a: string[]) => void }) {
  const [ans, setAns] = useState<string[]>([]);
  const add = (e: string) => {
    if (ans.includes(e) || ans.length >= t.seq.length) return;
    audio.combo(ans.length);
    const n = [...ans, e];
    setAns(n);
    if (n.length === t.seq.length) setTimeout(() => onSubmit(n), 250);
  };
  return (
    <div className="mx-auto max-w-3xl">
      <div className="glass flex min-h-[5rem] flex-wrap justify-center gap-2 rounded-[2rem] p-4">
        {t.seq.map((_, k) => <span key={k} className="grid h-12 w-12 place-items-center rounded-xl border-2 border-dashed border-[var(--color-line)] text-3xl sm:h-14 sm:w-14">{ans[k] ?? ''}</span>)}
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {t.choices.map((e) => <button key={e} disabled={ans.includes(e)} onClick={() => add(e)} className="grid h-14 w-14 place-items-center rounded-2xl bg-white/10 text-4xl transition hover:scale-110 disabled:opacity-20 sm:h-16 sm:w-16">{e}</button>)}
      </div>
      <div className="mt-3 text-center"><button className="btn btn-ghost !py-1.5 text-sm" disabled={!ans.length} onClick={() => setAns((a) => a.slice(0, -1))}>⌫ Undo</button></div>
    </div>
  );
}
