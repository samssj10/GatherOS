import { Outlet, useLocation } from 'react-router-dom';
import ErrorBoundary from '@/components/ErrorBoundary';
import AiCommandBar from '@/components/layout/AiCommandBar';
import Sidebar from '@/components/layout/Sidebar';
import SkipLink from '@/components/SkipLink';

export default function PlannerLayout() {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen min-w-[1024px] bg-slate-50">
      <SkipLink />
      <Sidebar />
      <div className="pl-[250px]">
        <ErrorBoundary inline>
          <AiCommandBar />
        </ErrorBoundary>
        <main id="main-content" tabIndex={-1} className="p-6 focus:outline-none">
          {/* Keyed by route so a crashed page recovers as soon as the user navigates away. */}
          <ErrorBoundary key={pathname} inline>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
