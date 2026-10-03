import { Outlet, useLocation } from 'react-router-dom';
import ErrorBoundary from '@/components/ErrorBoundary';
import Sidebar from '@/components/layout/Sidebar';
import SkipLink from '@/components/SkipLink';

export default function PlannerLayout() {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-canvas lg:grid lg:grid-cols-[276px_minmax(0,1fr)]">
      <SkipLink />
      <Sidebar />
      <main id="main-content" tabIndex={-1} className="min-w-0 focus:outline-none">
        {/* Keyed by route so a crashed page recovers as soon as the user navigates away. */}
        <ErrorBoundary key={pathname} inline>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  );
}
