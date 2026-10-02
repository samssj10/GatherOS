import { Outlet, useLocation } from 'react-router-dom';
import ErrorBoundary from '@/components/ErrorBoundary';
import BottomNav from '@/components/layout/BottomNav';
import SkipLink from '@/components/SkipLink';

export default function AttendeeLayout() {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-slate-100">
      <SkipLink />
      {/* Mobile-width column, centered on desktop. Bottom padding clears the fixed nav. */}
      <div className="mx-auto min-h-screen w-full max-w-md bg-slate-50 shadow-sm">
        <main id="main-content" tabIndex={-1} className="px-4 pb-24 pt-6 focus:outline-none">
          <ErrorBoundary key={pathname} inline>
            <Outlet />
          </ErrorBoundary>
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
