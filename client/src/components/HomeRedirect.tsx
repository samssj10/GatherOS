import { Navigate } from 'react-router-dom';
import PageFallback from '@/components/PageFallback';
import { useAuth } from '@/hooks/useAuth';
import { roleHome } from '@/utils/roleHome';

/** "/" sends each persona to its own experience. */
export default function HomeRedirect() {
  const { session, isLoading } = useAuth();

  if (isLoading) return <PageFallback />;
  return <Navigate to={session ? roleHome(session.role) : '/login'} replace />;
}
