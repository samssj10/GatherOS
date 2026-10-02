import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Page not found</h1>
      <p className="text-slate-500">The page you are looking for does not exist.</p>
      <Link
        to="/"
        className="inline-flex h-12 items-center rounded-lg bg-indigo-600 px-6 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      >
        Go home
      </Link>
    </main>
  );
}
