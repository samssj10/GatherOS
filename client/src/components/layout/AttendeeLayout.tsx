import { Outlet, useLocation } from 'react-router-dom';
import ErrorBoundary from '@/components/ErrorBoundary';
import BottomNav from '@/components/layout/BottomNav';
import TopNav from '@/components/layout/TopNav';
import SkipLink from '@/components/SkipLink';

export default function AttendeeLayout() {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-sunken lg:bg-canvas">
      <SkipLink />
      <TopNav />
      {/* Phones: a centered column with a fixed tab bar. From lg up: full width under the top bar. */}
      <div className="mx-auto min-h-screen w-full max-w-md bg-canvas shadow-sm lg:min-h-0 lg:max-w-300 lg:shadow-none">
        <main
          id="main-content"
          tabIndex={-1}
          className="px-5 pt-5 pb-28 focus:outline-none lg:px-8 lg:py-8"
        >
          <ErrorBoundary key={pathname} inline>
            <Outlet />
          </ErrorBoundary>
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
