import { Link } from 'react-router-dom';
import { useSeo } from './seo';

export default function NotFound() {
  useSeo('Lost signal · Dialed-verse');
  return (
    <div className="grid min-h-[60vh] place-items-center px-4 text-center">
      <div>
        <div className="chroma-glitch font-display text-8xl font-black">404</div>
        <p className="mt-2 text-[var(--color-muted)]">This frequency is empty.</p>
        <Link to="/" className="btn btn-primary mt-6">Back to the hub</Link>
      </div>
    </div>
  );
}
