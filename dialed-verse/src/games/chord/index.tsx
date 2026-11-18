import { useEffect, useMemo, useState } from 'react';
import type { GameProps } from '@/core/types';
import { audio, midiToFreq, NOTE_NAMES } from '@/audio/engine';
import RoundRunner from '../_shared/RoundRunner';
import { Rings } from '../pitch/index';
import { memo, roundsResult } from '../_shared/helpers';

const BASE = 60; // C4
const TYPES: Record<string, number[]> = { major: [0, 4, 7], minor: [0, 3, 7], dim: [0, 3, 6], aug: [0, 4, 8], sus2: [0, 2, 7], sus4: [0, 5, 7], maj7: [0, 4, 7, 11], min7: [0, 3, 7, 10], dom7: [0, 4, 7, 10] };

function playChord(notes: number[]) {
  notes.forEach((n, k) => audio.note(midiToFreq(n), 1.6, k * 0.12, 0.14));
  notes.forEach((n) => audio.note(midiToFreq(n), 1.6, notes.length * 0.12 + 0.25, 0.12));
}

export default function ChordEar({ rng, difficulty, onFinish }: GameProps) {
  const targets = useMemo(() => Array.from({ length: 5 }, () => { const pool = memo(difficulty, ['major', 'minor'], ['major', 'minor', 'dim', 'aug', 'sus4'], Object.keys(TYPES)); const type = rng.pick(pool); const root = BASE + rng.int(0, 11); return { type, notes: TYPES[type].map((x) => root + x) }; }), [rng, difficulty]);
  return (
    <RoundRunner
      targets={targets}
      memorizeMs={(t) => t.notes.length * 120 + 2200}
      maskMs={0}
      showLabel="Listen to the chord"
      renderShow={(t) => <Play notes={t.notes} />}
      renderInput={(t, i, submit) => <Piano key={i} onSubmit={(sel) => {
        let pts = 0;
        t.notes.forEach((n) => { if (sel.includes(n)) pts += 1; else if (sel.some((s) => s % 12 === n % 12)) pts += 0.5; });
        const score = pts / Math.max(t.notes.length, sel.length);
        submit(score, <span>It was <b>{NOTE_NAMES[t.notes[0] % 12]} {t.type}</b>: {t.notes.map((n) => NOTE_NAMES[n % 12]).join(' · ')} <button className="ml-2 underline" onClick={() => playChord(t.notes)}>replay</button></span>);
      }} />}
      onDone={(s) => onFinish(roundsResult(s, `${s.filter((x) => x >= 0.99).length}/5 chords exact`))}
    />
  );
}

function Play({ notes }: { notes: number[] }) {
  useEffect(() => { const t = setTimeout(() => playChord(notes), 200); return () => clearTimeout(t); }, [notes]);
  return <Rings playing hue={250} />;
}

const KEYS = Array.from({ length: 24 }, (_, k) => BASE + k);
const isBlack = (m: number) => [1, 3, 6, 8, 10].includes(m % 12);

function Piano({ onSubmit }: { onSubmit: (sel: number[]) => void }) {
  const [sel, setSel] = useState<number[]>([]);
  const whites = KEYS.filter((k) => !isBlack(k));
  const toggle = (m: number) => { audio.note(midiToFreq(m), 0.7, 0, 0.14); setSel((s) => (s.includes(m) ? s.filter((x) => x !== m) : [...s, m].sort((a, b) => a - b))); };
  return (
    <div className="glass mx-auto max-w-3xl rounded-[2rem] p-4 sm:p-6">
      <div className="relative mx-auto h-44 w-full select-none sm:h-52">
        <div className="flex h-full gap-[2px]">
          {whites.map((m) => (
            <button key={m} aria-label={`${NOTE_NAMES[m % 12]}${Math.floor(m / 12) - 1}`} aria-pressed={sel.includes(m)} onClick={() => toggle(m)} className="relative flex-1 rounded-b-lg transition" style={{ background: sel.includes(m) ? 'linear-gradient(hsl(250 95% 75%), hsl(280 90% 60%))' : 'linear-gradient(#fff, #d9d6e8)', boxShadow: sel.includes(m) ? '0 0 30px hsl(260 95% 65%)' : 'inset 0 -6px 0 rgba(0,0,0,.15)' }}>
              <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-bold text-black/50">{m % 12 === 0 ? `C${Math.floor(m / 12) - 1}` : ''}</span>
            </button>
          ))}
        </div>
        {KEYS.filter(isBlack).map((m) => {
          const wi = whites.filter((w) => w < m).length;
          return <button key={m} aria-label={`${NOTE_NAMES[m % 12]}${Math.floor(m / 12) - 1}`} aria-pressed={sel.includes(m)} onClick={() => toggle(m)} className="absolute top-0 h-[60%] w-[4.2%] -translate-x-1/2 rounded-b-md transition" style={{ left: `${(wi / whites.length) * 100}%`, background: sel.includes(m) ? 'linear-gradient(hsl(250 95% 70%), hsl(280 90% 45%))' : 'linear-gradient(#333, #0b0b12)', boxShadow: sel.includes(m) ? '0 0 24px hsl(260 95% 65%)' : '0 4px 8px rgba(0,0,0,.5)' }} />;
        })}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="flex-1 font-mono text-sm text-[var(--color-muted)]">{sel.length ? sel.map((m) => NOTE_NAMES[m % 12]).join(' · ') : 'Tap keys to build the chord'}</span>
        <button className="btn btn-ghost !py-2" disabled={!sel.length} onClick={() => playChord(sel)}>▶ Hear yours</button>
        <button className="btn btn-ghost !py-2" disabled={!sel.length} onClick={() => setSel([])}>Clear</button>
        <button className="btn btn-primary !py-2" disabled={!sel.length} onClick={() => onSubmit(sel)}>Lock it in</button>
      </div>
    </div>
  );
}
