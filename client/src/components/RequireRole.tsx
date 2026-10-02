import { Navigate, Outlet } from 'react-router-dom';
import PageFallback from '@/components/PageFallback';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/types';
import { roleHome } from '@/utils/roleHome';

/** Route guard: signed-out users go to /login, wrong-role users go to their own home. */
export default function RequireRole({ role }: { role: UserRole }) {
  const { session, isLoading } = useAuth();

  if (isLoading) return <PageFallback />;
  if (!session) return <Navigate to="/login" replace />;
  if (session.role !== role) return <Navigate to={roleHome(session.role)} replace />;

  return <Outlet />;
}
