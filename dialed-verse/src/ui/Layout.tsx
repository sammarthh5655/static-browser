import { NavLink, Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useStore, computeStreak } from '@/core/store';
import { useUi } from './fx';
import Flame from './Flame';
import { audio } from '@/audio/engine';
import { t } from '@/i18n';

const NAV = [
  { to: '/', label: t('nav.play'), icon: '🎮' },
  { to: '/stats', label: t('nav.stats'), icon: '📊' },
  { to: '/leaderboards', label: t('nav.boards'), icon: '🏆' },
  { to: '/settings', label: t('nav.settings'), icon: '⚙️' },
];

export default function Layout({ children }: { children: ReactNode }) {
  const daily = useStore((s) => s.daily);
  const soundOn = useStore((s) => s.settings.soundOn);
  const setSettings = useStore((s) => s.setSettings);
  const streak = computeStreak(daily).current;
  const flashKey = useUi((s) => s.flashKey);
  const flashColor = useUi((s) => s.flashColor);
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-black">Skip to content</a>
      <header className="sticky top-0 z-40 border-b border-[var(--color-line)] bg-[var(--color-bg)]/60 backdrop-blur-xl">
        <div className="mx-auto flex h-[68px] max-w-7xl items-center gap-3 px-4 sm:px-6">
          <Link to="/" className="group flex items-center gap-2" onClick={() => audio.whoosh()} aria-label="Dialed-verse home">
            <Logo />
            <span className="hidden font-display text-lg font-black tracking-tight sm:inline">DIALED<span className="text-gradient">·VERSE</span></span>
          </Link>
          <nav className="ml-auto hidden items-center gap-1 md:flex" aria-label="Main">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end onPointerEnter={() => audio.hover()} onClick={() => audio.click()} className={({ isActive }) => `rounded-full px-4 py-2 text-sm font-bold transition ${isActive ? 'bg-[var(--color-fg)] text-[var(--color-bg)]' : 'text-[var(--color-muted)] hover:text-[var(--color-fg)]'}`}>
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2 md:ml-2">
            <Link to="/stats" className="flex items-center gap-1 rounded-full border border-[var(--color-line)] bg-[var(--color-glass)] py-1 pl-2 pr-3 font-display text-sm font-black" aria-label={`${streak} day streak`}>
              <Flame streak={streak} size={22} /> {streak}
            </Link>
            <button aria-label={soundOn ? 'Mute' : 'Unmute'} aria-pressed={!soundOn} onClick={() => { audio.unlock(); setSettings({ soundOn: !soundOn }); audio.toggle(!soundOn); }} className="grid h-10 w-10 place-items-center rounded-full border border-[var(--color-line)] bg-[var(--color-glass)] text-lg transition hover:scale-105">
              {soundOn ? '🔊' : '🔇'}
            </button>
          </div>
        </div>
      </header>
      <main id="main" className="relative min-h-[calc(100dvh-68px)] pb-24 md:pb-8">{children}</main>
      <footer className="mx-auto max-w-7xl px-6 pb-28 pt-6 text-center text-xs text-[var(--color-muted)] md:pb-10">
        All sounds synthesized live · All art original · Daily seeds reset at 00:00 UTC · <Link className="underline" to="/about">About</Link>
      </footer>
      <nav className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-4 rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg)]/75 p-1 backdrop-blur-xl md:hidden" style={{ paddingBottom: 'max(0.25rem, env(safe-area-inset-bottom))' }} aria-label="Mobile">
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end onClick={() => audio.click()} className={({ isActive }) => `flex flex-col items-center rounded-xl py-1.5 text-[10px] font-bold ${isActive ? 'bg-[var(--color-fg)] text-[var(--color-bg)]' : 'text-[var(--color-muted)]'}`}>
            <span className="text-lg">{n.icon}</span>{n.label}
          </NavLink>
        ))}
      </nav>
      {flashKey > 0 && <div key={flashKey} aria-hidden className="pointer-events-none fixed inset-0 z-[75]" style={{ background: flashColor, animation: 'dvflash .45s ease-out forwards' }} />}
      <style>{'@keyframes dvflash{0%{opacity:.28}100%{opacity:0}}'}</style>
    </>
  );
}

export function Logo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden className="transition-transform duration-500 group-hover:rotate-[120deg]">
      <defs>
        <linearGradient id="lg1" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#ff3fb4" /><stop offset=".5" stopColor="#b388ff" /><stop offset="1" stopColor="#36e6ff" /></linearGradient>
      </defs>
      <circle cx="32" cy="32" r="27" fill="none" stroke="url(#lg1)" strokeWidth="6" strokeDasharray="120 50" strokeLinecap="round" />
      <circle cx="32" cy="32" r="14" fill="url(#lg1)" />
      <rect x="30" y="6" width="4" height="16" rx="2" fill="#fff" />
    </svg>
  );
}
