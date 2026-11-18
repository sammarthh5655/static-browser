import { create } from 'zustand';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';

interface Toast { id: number; icon: string; title: string; body?: string }
interface TS { toasts: Toast[]; push: (t: Omit<Toast, 'id'>) => void; remove: (id: number) => void }
let n = 0;
export const useToasts = create<TS>((set) => ({
  toasts: [],
  push: (t) => set((s) => ({ toasts: [...s.toasts, { ...t, id: ++n }].slice(-4) })),
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
export const toast = (t: Omit<Toast, 'id'>) => useToasts.getState().push(t);

export default function Toasts() {
  const { toasts, remove } = useToasts();
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[90] flex w-[min(92vw,360px)] flex-col gap-2" role="status" aria-live="polite">
      <AnimatePresence>
        {toasts.map((t) => <Item key={t.id} t={t} onDone={() => remove(t.id)} />)}
      </AnimatePresence>
    </div>
  );
}

function Item({ t, onDone }: { t: Toast; onDone: () => void }) {
  useEffect(() => { const x = setTimeout(onDone, 4200); return () => clearTimeout(x); }, [onDone]);
  return (
    <motion.div layout initial={{ opacity: 0, x: 60, scale: 0.9 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: 60 }} className="glass pointer-events-auto flex items-center gap-3 rounded-2xl p-3 pr-4">
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent2)] text-2xl">{t.icon}</div>
      <div className="min-w-0">
        <div className="text-[10px] font-black uppercase tracking-widest text-[var(--color-accent2)]">Achievement unlocked</div>
        <div className="truncate font-display text-sm font-bold">{t.title}</div>
        {t.body && <div className="truncate text-xs text-[var(--color-muted)]">{t.body}</div>}
      </div>
    </motion.div>
  );
}
