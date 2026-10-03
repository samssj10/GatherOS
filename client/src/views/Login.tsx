import { ArrowRight, Award, LayoutGrid, Mail } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ApiError } from '@/api/client';
import PageFallback from '@/components/PageFallback';
import { useAuth } from '@/hooks/useAuth';
import { usePageTitle } from '@/hooks/usePageTitle';
import { roleHome } from '@/utils/roleHome';

interface DemoAccount {
  id: 'planner' | 'attendee';
  title: string;
  description: string;
  tag: string;
  /** Short name used in the button: "Continue as ...". */
  as: string;
  email: string;
  icon: LucideIcon;
}

// Demo accounts from the mock database (see server/.env.example and the seeded attendees).
const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    id: 'planner',
    title: 'Planner demo',
    description: 'Budget, RSVPs and the itinerary board',
    tag: 'DESKTOP',
    as: 'planner',
    email: 'planner@gatheros.example.com',
    icon: LayoutGrid,
  },
  {
    id: 'attendee',
    title: 'Attendee demo',
    description: 'RSVP, stamps and badges as Amara',
    tag: 'MOBILE',
    as: 'Amara',
    email: 'amara.silva.0001@example.com',
    icon: Award,
  },
];

/** Decorative preview on the brand panel. Numbers are illustrative, not live data. */
function BrandPreview() {
  const check = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.5 10 17 19 7" />
    </svg>
  );

  return (
    <div className="relative h-57.5 max-w-130" aria-hidden="true">
      <div className="absolute top-0 left-0 flex w-72.5 -rotate-3 flex-col gap-2.5 rounded-[20px] border border-ink-line bg-ink-raised p-4.5">
        <div className="flex items-center justify-between">
          <span className="rounded-md bg-lime px-2 py-0.75 font-mono text-[11px] font-semibold text-ink">LVL 2</span>
          <span className="font-display text-[22px] font-extrabold">
            225<span className="ml-0.75 text-xs text-ink-text-3">XP</span>
          </span>
        </div>
        <span className="font-display text-lg font-bold">Trailblazer</span>
        <div className="h-2 overflow-hidden rounded bg-ink-line">
          <div className="h-full w-1/2 rounded bg-lime" />
        </div>
      </div>

      <div className="absolute top-6 right-0 flex w-50 rotate-4 items-center gap-3 rounded-[20px] bg-white p-4 text-ink">
        <svg width="56" height="56" viewBox="0 0 56 56">
          <circle cx="28" cy="28" r="22" fill="none" stroke="#eef0f5" strokeWidth="7" />
          <circle
            cx="28"
            cy="28"
            r="22"
            fill="none"
            stroke="#14161f"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray="138.2"
            strokeDashoffset="69.1"
            transform="rotate(-90 28 28)"
          />
        </svg>
        <div>
          <p className="font-display text-[22px] font-extrabold">2/4</p>
          <p className="text-xs text-body">milestones</p>
        </div>
      </div>

      <div className="absolute bottom-0 left-10 flex gap-2.5 rounded-full border border-ink-line bg-ink-raised px-3.5 py-2.5">
        {['bg-brand', 'bg-blue', 'bg-orange'].map((color) => (
          <span key={color} className={`flex size-8.5 items-center justify-center rounded-full ${color}`}>
            {check}
          </span>
        ))}
        {[0, 1, 2, 3].map((index) => (
          <span key={index} className="size-8.5 rounded-full border-2 border-dashed border-body" />
        ))}
      </div>
    </div>
  );
}

export default function Login() {
  usePageTitle('Sign in');
  const { session, isLoading, signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [demo, setDemo] = useState<DemoAccount['id'] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (isLoading) return <PageFallback />;
  if (session) return <Navigate to={roleHome(session.role)} replace />;

  const picked = DEMO_ACCOUNTS.find((account) => account.id === demo);

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
    <div className="flex min-h-screen bg-canvas">
      <section
        aria-label="About GatherOS"
        className="hidden min-h-140 flex-[1_1_520px] flex-col justify-between gap-10 bg-ink p-12 text-canvas lg:flex"
      >
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-brand font-display text-[21px] font-extrabold text-white">
            G
          </span>
          <span className="font-display text-[22px] font-bold">GatherOS</span>
        </div>

        <div className="flex max-w-130 flex-col gap-4.5">
          <p className="font-mono text-xs uppercase tracking-[0.08em] text-lime">Company offsite · 3 days · 7 stops</p>
          <p className="font-display text-[52px] leading-[1.02] font-extrabold tracking-[-0.025em]">
            Plan it like a mission. Live it like a journey.
          </p>
          <p className="text-[17px] leading-normal text-ink-text-2">
            Planners hit milestones. Attendees earn stamps, XP and badges from RSVP to farewell lunch.
          </p>
        </div>

        <BrandPreview />
      </section>

      <main
        id="main-content"
        className="flex min-w-0 flex-[999_1_480px] items-center justify-center px-6 py-12"
      >
        <div className="flex w-full max-w-110 flex-col gap-7">
          <div className="flex items-center gap-3 lg:hidden">
            <span className="flex size-10 items-center justify-center rounded-xl bg-brand font-display text-[21px] font-extrabold text-white">
              G
            </span>
            <span className="font-display text-[22px] font-bold">GatherOS</span>
          </div>

          <div>
            <h1 className="font-display text-[40px] leading-tight font-extrabold tracking-[-0.02em]">Welcome back</h1>
            <p className="mt-2 text-base text-body">Sign in with your work email. No password needed.</p>
          </div>

          <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-col gap-3.5">
            <label htmlFor="email" className="text-sm font-semibold">
              Work email
            </label>
            <div
              className={`flex min-h-13.5 items-center gap-2.5 rounded-[14px] border-2 bg-white px-4 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand ${
                email ? 'border-brand' : 'border-field'
              }`}
            >
              <Mail className="size-4.5 shrink-0 text-muted" strokeWidth={1.9} aria-hidden="true" />
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@company.com"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setDemo(null);
                }}
                aria-invalid={error !== null}
                aria-describedby={error ? 'login-error' : undefined}
                className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted"
              />
            </div>

            {error && (
              <p id="login-error" role="alert" className="text-sm font-medium text-bad-ink">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex min-h-13.5 items-center justify-center gap-2 rounded-[14px] bg-brand text-base font-semibold text-white transition-colors hover:bg-brand-hover disabled:opacity-60"
            >
              {submitting ? 'Signing in…' : picked ? `Continue as ${picked.as}` : 'Sign in'}
              <ArrowRight className="size-4.5" strokeWidth={2} aria-hidden="true" />
            </button>
          </form>

          <div className="flex items-center gap-3 text-[13px] text-muted">
            <span className="h-px flex-1 bg-field" />
            Or jump into a demo
            <span className="h-px flex-1 bg-field" />
          </div>

          <div role="group" aria-label="Demo accounts" className="grid grid-cols-2 gap-3">
            {DEMO_ACCOUNTS.map((account) => {
              const active = demo === account.id;
              const Icon = account.icon;
              return (
                <button
                  key={account.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    setDemo(account.id);
                    setEmail(account.email);
                    setError(null);
                  }}
                  className={`flex min-h-33 flex-col justify-between gap-3 rounded-[18px] border-2 p-4 text-left transition-colors ${
                    active ? 'border-brand bg-brand-tint' : 'border-line bg-white hover:bg-wash'
                  }`}
                >
                  <span className="flex w-full items-center justify-between">
                    <span
                      className={`flex size-10 items-center justify-center rounded-xl ${
                        active ? 'bg-brand text-white' : 'bg-ink text-lime'
                      }`}
                    >
                      <Icon className="size-5" strokeWidth={1.9} aria-hidden="true" />
                    </span>
                    <span className="font-mono text-[11px] font-semibold text-body">{account.tag}</span>
                  </span>
                  <span>
                    <span className="block text-base font-semibold">{account.title}</span>
                    <span className="mt-0.5 block text-[13px] text-body">{account.description}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <p className="text-[13px] text-muted">Demo accounts use sample data that resets when the server restarts.</p>
        </div>
      </main>
    </div>
  );
}
