import { Link } from 'react-router-dom';
import { useSeo } from './seo';
import { GAMES } from '@/games/registry';

export default function About() {
  useSeo('About · Dialed-verse');
  return (
    <div className="mx-auto max-w-3xl px-4 pb-16 pt-8 sm:px-6">
      <h1 className="chroma font-display text-4xl font-black sm:text-6xl">About</h1>
      <div className="glass mt-6 space-y-4 rounded-3xl p-6 leading-relaxed">
        <p><b>Dialed-verse</b> is a playground of {GAMES.length} daily games built around one idea: <i>memorize a stimulus, then recreate it</i>. Colors, pitches, rhythms, angles, durations, shapes, plus a shelf of daily puzzles and reflex tests.</p>
        <p>Every daily challenge comes from a deterministic seed derived from the UTC date, so everyone on Earth gets the exact same puzzle. You get one daily attempt per game; practice mode is unlimited.</p>
        <p>Color games score with CIEDE2000 ΔE in CIELAB space. Pitch games score in cents. Every sound is synthesized in your browser with the Web Audio API, and all art is original.</p>
        <p>Your stats live on your device. Leaderboards use anonymous sign-in when the site is configured with Firebase.</p>
        <Link to="/" className="btn btn-primary">Start playing</Link>
      </div>
    </div>
  );
}
