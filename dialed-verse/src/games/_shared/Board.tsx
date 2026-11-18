import { forwardRef, type ReactNode, type SVGProps } from 'react';

/** Standard 400x300 glass board used by geometry games. */
export const Board = forwardRef<SVGSVGElement, { children: ReactNode; hue?: number; w?: number; h?: number } & SVGProps<SVGSVGElement>>(function Board({ children, hue = 200, w = 400, h = 300, className = '', ...rest }, ref) {
  return (
    <svg ref={ref} viewBox={`0 0 ${w} ${h}`} className={`mx-auto block max-h-[58vh] w-full max-w-2xl select-none rounded-[2rem] ring-1 ring-white/10 ${className}`} style={{ background: `radial-gradient(circle at 50% 40%, hsl(${hue} 40% 14%), hsl(${hue} 30% 5%))` }} {...rest}>
      <defs>
        <pattern id="dvgrid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="rgba(255,255,255,.04)" /></pattern>
        <filter id="dvglow"><feGaussianBlur stdDeviation="4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <rect width={w} height={h} fill="url(#dvgrid)" />
      {children}
    </svg>
  );
});

export const SubmitBar = ({ onSubmit, children, label = 'Lock it in' }: { onSubmit: () => void; children?: ReactNode; label?: string }) => (
  <div className="glass mx-auto mt-4 flex max-w-2xl flex-col gap-3 rounded-3xl p-4 sm:flex-row sm:items-center">
    <div className="flex-1">{children}</div>
    <button className="btn btn-primary" onClick={onSubmit}>{label}</button>
  </div>
);
