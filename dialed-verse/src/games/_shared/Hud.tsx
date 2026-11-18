import type { ReactNode } from 'react';

export function Hud({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <div className="mx-auto mb-4 flex max-w-2xl flex-wrap justify-center gap-2">
      {items.map((it) => (
        <div key={it.label} className="glass min-w-[90px] rounded-2xl px-4 py-2 text-center">
          <div className="text-[10px] font-black uppercase tracking-widest text-[var(--color-muted)]">{it.label}</div>
          <div className="font-display text-xl font-black tabular-nums">{it.value}</div>
        </div>
      ))}
    </div>
  );
}

export const hearts = (n: number, max: number) => '❤️'.repeat(Math.max(0, n)) + '🖤'.repeat(Math.max(0, max - n));
