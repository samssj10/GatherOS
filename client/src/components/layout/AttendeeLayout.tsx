import { Outlet } from 'react-router-dom';
import BottomNav from '@/components/layout/BottomNav';

export default function AttendeeLayout() {
  return (
    <div className="min-h-screen bg-slate-100">
      {/* Mobile-width column, centered on desktop. Bottom padding clears the fixed nav. */}
      <div className="mx-auto min-h-screen w-full max-w-md bg-slate-50 shadow-sm">
        <main id="main-content" className="px-4 pb-24 pt-6">
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
