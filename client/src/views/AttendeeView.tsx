import { usePageTitle } from '@/hooks/usePageTitle';
import { LogOut } from 'lucide-react';
import RsvpCard from '@/components/attendee/RsvpCard';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useAuth } from '@/hooks/useAuth';

export default function AttendeeView() {
  usePageTitle('Your offsite');
  const { session, signOut } = useAuth();
  if (!session) return null;

  const firstName = session.name.split(' ')[0];

  return (
    <div>
      <header className="rounded-2xl bg-indigo-600 px-6 pb-10 pt-6 text-white">
        <div className="flex items-start justify-between gap-4">
          <p className="text-sm font-medium text-indigo-100">Company offsite</p>
          <button
            type="button"
            onClick={signOut}
            aria-label="Sign out"
            className="-mr-2 -mt-2 flex h-12 w-12 items-center justify-center rounded-lg text-indigo-100 transition-colors hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-600"
          >
            <LogOut className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Welcome, {firstName}</h1>
        <p className="mt-2 text-indigo-100">
          We&apos;re planning something great. Confirm your spot to get your schedule.
        </p>
      </header>

      <div className="relative -mt-6">
        <ErrorBoundary inline>
          <RsvpCard attendeeId={session.id} />
        </ErrorBoundary>
      </div>
    </div>
  );
}
