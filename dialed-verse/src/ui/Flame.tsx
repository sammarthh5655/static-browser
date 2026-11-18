/** Animated streak flame (SVG). Grows with streak length. */
export default function Flame({ streak, size = 28 }: { streak: number; size?: number }) {
  const lit = streak > 0;
  const s = size * (1 + Math.min(streak, 30) / 60);
  return (
    <svg width={s} height={s} viewBox="0 0 32 32" className={lit ? 'flame' : 'opacity-40 grayscale'} aria-hidden>
      <defs>
        <radialGradient id="fl" cx="50%" cy="75%" r="65%">
          <stop offset="0" stopColor="#fff6b0" />
          <stop offset=".35" stopColor="#ffb12b" />
          <stop offset=".75" stopColor="#ff3d6e" />
          <stop offset="1" stopColor="#b31dff" />
        </radialGradient>
      </defs>
      <path fill="url(#fl)" d="M16 2c1.5 5-3.5 7.5-3.5 12 0 1.6.8 2.8 2 3.4-.6-2.8 1.8-4.6 3.2-6.4 1 4 5.3 5.6 5.3 10.5C23 26.2 19.9 30 16 30s-8-3.3-8-8.4C8 13 16 10.5 16 2z" />
      <path fill="#fff7d1" opacity=".85" d="M16 30c-2.5 0-4.3-1.9-4.3-4.4 0-3 3-4.3 3.6-7.1 1.6 2 4.9 3.5 4.9 6.9 0 2.6-1.8 4.6-4.2 4.6z" />
    </svg>
  );
}
