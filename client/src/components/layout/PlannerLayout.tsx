import { Outlet, useLocation } from 'react-router-dom';
import ErrorBoundary from '@/components/ErrorBoundary';
import PlannerBottomNav from '@/components/layout/PlannerBottomNav';
import PlannerTopBar from '@/components/layout/PlannerTopBar';
import Sidebar from '@/components/layout/Sidebar';
import SkipLink from '@/components/SkipLink';

export default function PlannerLayout() {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-canvas lg:grid lg:grid-cols-[276px_minmax(0,1fr)]">
      <SkipLink />
      <PlannerTopBar />
      <Sidebar />
      {/* On a phone the tab bar is fixed to the bottom, so the page leaves room under its last line. */}
      <main id="main-content" tabIndex={-1} className="min-w-0 pb-24 focus:outline-none lg:pb-0">
        {/* Keyed by route so a crashed page recovers as soon as the user navigates away. */}
        <ErrorBoundary key={pathname} inline>
          <Outlet />
        </ErrorBoundary>
      </main>
      <PlannerBottomNav />
    </div>
  );
}
