import { Link } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';

export default function NotFound() {
  usePageTitle('Page not found');

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-canvas p-6 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.08em] text-muted">Error 404</p>
      <h1 className="font-display text-4xl font-extrabold tracking-tight">Page not found</h1>
      <p className="text-body">The page you are looking for does not exist.</p>
      <Link
        to="/"
        className="inline-flex min-h-12 items-center rounded-[14px] bg-brand px-6 text-sm font-semibold text-white no-underline transition-colors hover:bg-brand-hover"
      >
        Go home
      </Link>
    </main>
  );
}
