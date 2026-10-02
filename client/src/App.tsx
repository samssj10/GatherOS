import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import PageFallback from '@/components/PageFallback';

// Every layout and page is its own chunk, loaded on first navigation.
const PlannerLayout = lazy(() => import('@/components/layout/PlannerLayout'));
const AttendeeLayout = lazy(() => import('@/components/layout/AttendeeLayout'));
const PlannerDashboard = lazy(() => import('@/views/PlannerDashboard'));
const PlannerAttendees = lazy(() => import('@/views/PlannerAttendees'));
const AttendeeView = lazy(() => import('@/views/AttendeeView'));
const AttendeeSchedule = lazy(() => import('@/views/AttendeeSchedule'));
const AttendeePreferences = lazy(() => import('@/views/AttendeePreferences'));
const NotFound = lazy(() => import('@/views/NotFound'));

export default function App() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        {/* Role-based redirect arrives with auth wiring in Phase 5. */}
        <Route path="/" element={<Navigate to="/planner" replace />} />

        <Route path="/planner" element={<PlannerLayout />}>
          <Route index element={<PlannerDashboard />} />
          <Route path="attendees" element={<PlannerAttendees />} />
        </Route>

        <Route path="/attendee" element={<AttendeeLayout />}>
          <Route index element={<AttendeeView />} />
          <Route path="schedule" element={<AttendeeSchedule />} />
          <Route path="preferences" element={<AttendeePreferences />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
