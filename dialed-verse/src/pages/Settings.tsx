import type { ReactNode } from 'react';
import { useStore, type ColorVision, type Motion, type Theme } from '@/core/store';
import { Slider } from '@/ui/Interactive';
import { audio } from '@/audio/engine';
import { useSeo } from './seo';
import { LANGUAGES } from '@/i18n';

export default function Settings() {
  useSeo('Settings · Dialed-verse');
  const s = useStore((st) => st.settings);
  const set = useStore((st) => st.setSettings);
  const nickname = useStore((st) => st.nickname);
  const setNickname = useStore((st) => st.setNickname);
  const resetAll = useStore((st) => st.resetAll);

  return (
    <div className="mx-auto max-w-3xl px-4 pb-16 pt-8 sm:px-6">
      <h1 className="chroma font-display text-4xl font-black sm:text-6xl">Settings</h1>

      <Card title="🎚️ Sound mixer">
        <Toggle label="Sound" checked={s.soundOn} onChange={(v) => set({ soundOn: v })} />
        <Slider label="Master" min={0} max={1} step={0.01} value={s.masterVolume} onChange={(v) => set({ masterVolume: v })} format={(v) => `${Math.round(v * 100)}%`} track="linear-gradient(90deg,#222,var(--color-accent))" />
        <Slider label="Effects" min={0} max={1} step={0.01} value={s.sfxVolume} onChange={(v) => set({ sfxVolume: v })} format={(v) => `${Math.round(v * 100)}%`} track="linear-gradient(90deg,#222,var(--color-accent2))" />
        <Toggle label="Ambient music" checked={s.musicOn} onChange={(v) => set({ musicOn: v })} />
        <Slider label="Music" min={0} max={0.6} step={0.01} value={s.musicVolume} onChange={(v) => set({ musicVolume: v })} format={(v) => `${Math.round((v / 0.6) * 100)}%`} track="linear-gradient(90deg,#222,var(--color-accent3))" disabled={!s.musicOn} />
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-ghost !py-2 text-sm" onClick={() => { audio.unlock(); audio.success(1); }}>Test chime</button>
          <button className="btn btn-ghost !py-2 text-sm" onClick={() => { audio.unlock(); audio.fanfare(1); }}>Test fanfare</button>
        </div>
        <p className="text-xs text-[var(--color-muted)]">Game stimuli (tones in Pitch, Volume, etc.) ignore the effects slider so every player hears the same reference loudness. Music ducks automatically during audio games.</p>
      </Card>

      <Card title="🎨 Look & feel">
        <Seg<Theme> label="Theme" value={s.theme} options={[['dark', 'Dark'], ['light', 'Light'], ['neon', 'Neon'], ['retro', 'Retro']]} onChange={(v) => set({ theme: v })} />
        <Seg<Motion> label="Motion" value={s.motion} options={[['system', 'System'], ['full', 'Full'], ['reduced', 'Reduced']]} onChange={(v) => set({ motion: v })} />
        <Seg<ColorVision> label="Color vision" value={s.colorVision} options={[['none', 'Default'], ['deuteranopia', 'Deutan'], ['protanopia', 'Protan'], ['tritanopia', 'Tritan'], ['high-contrast', 'High contrast']]} onChange={(v) => set({ colorVision: v })} />
        <Toggle label="Cursor trail" checked={s.cursorTrail} onChange={(v) => set({ cursorTrail: v })} />
        <label className="flex items-center justify-between gap-3">
          <span className="font-bold">Language</span>
          <select value={s.language} onChange={(e) => set({ language: e.target.value })} className="rounded-full border border-[var(--color-line)] bg-[var(--color-bg2)] px-4 py-2 text-sm">
            {LANGUAGES.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </label>
      </Card>

      <Card title="👤 Profile">
        <label className="block">
          <span className="mb-1 block text-xs font-bold uppercase tracking-widest text-[var(--color-muted)]">Leaderboard nickname</span>
          <input value={nickname} onChange={(e) => setNickname(e.target.value)} maxLength={18} placeholder="Anonymous" className="w-full rounded-full border border-[var(--color-line)] bg-black/20 px-4 py-2.5 outline-none focus:border-[var(--color-accent2)]" />
        </label>
        <button className="btn btn-ghost !py-2 text-sm text-[var(--color-bad)]" onClick={() => { if (confirm('Erase all local stats, streaks and achievements?')) resetAll(); }}>Reset all local data</button>
      </Card>
    </div>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="glass mt-6 space-y-4 rounded-3xl p-5 sm:p-6">
      <h2 className="font-display text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button role="switch" aria-checked={checked} onClick={() => { audio.unlock(); audio.toggle(!checked); onChange(!checked); }} className="flex w-full items-center justify-between gap-3 text-left">
      <span className="font-bold">{label}</span>
      <span className={`relative h-7 w-12 rounded-full transition ${checked ? 'bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent2)]' : 'bg-white/15'}`}>
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? 'left-6' : 'left-1'}`} />
      </span>
    </button>
  );
}

function Seg<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div>
      <div className="mb-2 text-xs font-bold uppercase tracking-widest text-[var(--color-muted)]">{label}</div>
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={label}>
        {options.map(([v, l]) => (
          <button key={v} role="radio" aria-checked={value === v} onClick={() => { audio.toggle(true); onChange(v); }} className={`rounded-full border px-4 py-2 text-sm font-bold transition ${value === v ? 'border-transparent bg-[var(--color-fg)] text-[var(--color-bg)]' : 'border-[var(--color-line)] text-[var(--color-muted)] hover:text-[var(--color-fg)]'}`}>{l}</button>
        ))}
      </div>
    </div>
  );
}
