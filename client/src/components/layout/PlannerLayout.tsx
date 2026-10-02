import { Outlet } from 'react-router-dom';
import AiCommandBar from '@/components/layout/AiCommandBar';
import Sidebar from '@/components/layout/Sidebar';

export default function PlannerLayout() {
  return (
    <div className="min-h-screen min-w-[1024px] bg-slate-50">
      <Sidebar />
      <div className="pl-[250px]">
        <AiCommandBar />
        <main id="main-content" className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
