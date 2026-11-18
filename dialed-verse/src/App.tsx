import { lazy, Suspense, useEffect, useRef } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Layout from './ui/Layout';
import Background from './ui/Background';
import CursorTrail from './ui/CursorTrail';
import ConfettiLayer from './ui/Confetti';
import Toasts from './ui/Toasts';
import Home from './pages/Home';
import { useStore } from './core/store';
import { audio } from './audio/engine';
import { useReducedMotion, useUi } from './ui/fx';

const GamePage = lazy(() => import('./pages/GamePage'));
const Stats = lazy(() => import('./pages/Stats'));
const Settings = lazy(() => import('./pages/Settings'));
const Leaderboards = lazy(() => import('./pages/Leaderboards'));
const About = lazy(() => import('./pages/About'));
const NotFound = lazy(() => import('./pages/NotFound'));

function useApplySettings() {
  const s = useStore((st) => st.settings);
  const reduced = useReducedMotion();
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = s.theme;
    root.dataset.cv = s.colorVision;
    root.dataset.motion = reduced ? 'reduced' : 'full';
    root.lang = s.language;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', s.theme === 'light' ? '#f3f0ff' : '#05040b');
    audio.configure({ enabled: s.soundOn, master: s.masterVolume, sfx: s.sfxVolume, music: s.musicVolume, musicOn: s.musicOn });
    if (!s.musicOn) audio.stopPad();
    else if (audio.ready) audio.startPad(useUi.getState().hue);
  }, [s, reduced]);
}

export default function App() {
  useApplySettings();
  const location = useLocation();
  const reduced = useReducedMotion();
  const shakeKey = useUi((s) => s.shakeKey);
  const shakeRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = shakeRef.current;
    if (!shakeKey || !el || reduced) return;
    el.classList.remove('shake');
    void el.offsetWidth;
    el.classList.add('shake');
    const t = setTimeout(() => el.classList.remove('shake'), 600);
    return () => clearTimeout(t);
  }, [shakeKey, reduced]);

  useEffect(() => {
    // Unlock audio on the first gesture anywhere. Music fades in softly, never autoplays before that.
    const unlock = () => {
      audio.unlock();
      if (useStore.getState().settings.musicOn) audio.startPad(useUi.getState().hue);
      removeEventListener('pointerdown', unlock);
      removeEventListener('keydown', unlock);
    };
    addEventListener('pointerdown', unlock);
    addEventListener('keydown', unlock);
    return () => { removeEventListener('pointerdown', unlock); removeEventListener('keydown', unlock); };
  }, []);

  useEffect(() => { window.scrollTo(0, 0); }, [location.pathname]);

  return (
    <div className="grain">
      <Background />
      <CursorTrail />
      <ConfettiLayer />
      <Toasts />
      <div ref={shakeRef}>
        <Layout>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname.split('/').slice(0, 3).join('/')}
              initial={reduced ? { opacity: 0 } : { opacity: 0, clipPath: 'inset(0 0 100% 0)', y: 24 }}
              animate={reduced ? { opacity: 1 } : { opacity: 1, clipPath: 'inset(0 0 0% 0)', y: 0, transitionEnd: { clipPath: 'none' } }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, clipPath: 'inset(100% 0 0 0)', y: -24 }}
              transition={{ duration: 0.45, ease: [0.7, 0, 0.2, 1] }}
            >
              <Suspense fallback={<div className="grid min-h-[60vh] place-items-center"><div className="h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-[var(--color-accent)]" /></div>}>
                <Routes location={location}>
                  <Route path="/" element={<Home />} />
                  <Route path="/play/:id" element={<GamePage />} />
                  <Route path="/stats" element={<Stats />} />
                  <Route path="/leaderboards" element={<Leaderboards />} />
                  <Route path="/leaderboards/:id" element={<Leaderboards />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/about" element={<About />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </Layout>
      </div>
    </div>
  );
}
