import { Outlet, useLocation } from 'react-router-dom';
import ErrorBoundary from '@/components/ErrorBoundary';
import BottomNav from '@/components/layout/BottomNav';
import SkipLink from '@/components/SkipLink';

export default function AttendeeLayout() {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-sunken">
      <SkipLink />
      {/* Mobile-width column, centered on desktop. Bottom padding clears the fixed nav. */}
      <div className="mx-auto min-h-screen w-full max-w-md bg-canvas shadow-sm">
        <main id="main-content" tabIndex={-1} className="px-5 pt-5 pb-28 focus:outline-none">
          <ErrorBoundary key={pathname} inline>
            <Outlet />
          </ErrorBoundary>
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
