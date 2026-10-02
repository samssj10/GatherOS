import { useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ApiError } from '@/api/client';
import PageFallback from '@/components/PageFallback';
import { useAuth } from '@/hooks/useAuth';
import { roleHome } from '@/utils/roleHome';

// Demo accounts from the mock database (see server/.env.example and the seeded attendees).
const DEMO_ACCOUNTS = [
  { label: 'Planner demo', email: 'planner@gatheros.example.com' },
  { label: 'Attendee demo', email: 'amara.silva.0001@example.com' },
];

export default function Login() {
  const { session, isLoading, signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (isLoading) return <PageFallback />;
  if (session) return <Navigate to={roleHome(session.role)} replace />;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const next = await signIn(email.trim());
      void navigate(roleHome(next.role), { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not sign in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
            G
          </span>
          <span className="text-lg font-bold tracking-tight text-slate-900">GatherOS</span>
        </div>
        <h1 className="mt-6 text-2xl font-bold tracking-tight text-slate-900">Sign in</h1>
        <p className="mt-1 text-sm text-slate-500">Enter your work email to continue.</p>

        <form onSubmit={(event) => void handleSubmit(event)} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="text-sm font-medium text-slate-900">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-invalid={error !== null}
              aria-describedby={error ? 'login-error' : undefined}
              className="mt-1 h-12 w-full rounded-lg border border-slate-200 bg-white px-4 text-slate-900 placeholder:text-slate-500 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            />
          </div>

          {error && (
            <p id="login-error" role="alert" className="text-sm font-medium text-rose-500">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="h-12 w-full rounded-lg bg-indigo-600 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60"
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="mt-6 border-t border-slate-200 pt-4">
          <p className="text-xs font-medium text-slate-500">Try a demo account</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.email}
                type="button"
                onClick={() => setEmail(account.email)}
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                {account.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
