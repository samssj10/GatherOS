import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import HomeRedirect from '@/components/HomeRedirect';
import PageFallback from '@/components/PageFallback';
import RequireRole from '@/components/RequireRole';

// Every layout and page is its own chunk, loaded on first navigation.
const PlannerLayout = lazy(() => import('@/components/layout/PlannerLayout'));
const AttendeeLayout = lazy(() => import('@/components/layout/AttendeeLayout'));
const Login = lazy(() => import('@/views/Login'));
const PlannerDashboard = lazy(() => import('@/views/PlannerDashboard'));
const PlannerAttendees = lazy(() => import('@/views/PlannerAttendees'));
const PlannerRoomCode = lazy(() => import('@/views/PlannerRoomCode'));
const AttendeeView = lazy(() => import('@/views/AttendeeView'));
const AttendeeSchedule = lazy(() => import('@/views/AttendeeSchedule'));
const AttendeePassport = lazy(() => import('@/views/AttendeePassport'));
const AttendeePreferences = lazy(() => import('@/views/AttendeePreferences'));
const AttendeeCheckIn = lazy(() => import('@/views/AttendeeCheckIn'));
const NotFound = lazy(() => import('@/views/NotFound'));

export default function App() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<Login />} />

        <Route element={<RequireRole role="planner" />}>
          <Route path="/planner" element={<PlannerLayout />}>
            <Route index element={<PlannerDashboard />} />
            <Route path="attendees" element={<PlannerAttendees />} />
          </Route>
          {/* Full-screen room display: no sidebar, meant to be projected. */}
          <Route path="/planner/sessions/:id/code" element={<PlannerRoomCode />} />
        </Route>

        <Route element={<RequireRole role="attendee" />}>
          {/* Full-screen camera page: no top bar or tab bar. */}
          <Route path="/attendee/check-in" element={<AttendeeCheckIn />} />
          <Route path="/attendee" element={<AttendeeLayout />}>
            <Route index element={<AttendeeView />} />
            <Route path="schedule" element={<AttendeeSchedule />} />
            <Route path="passport" element={<AttendeePassport />} />
            <Route path="preferences" element={<AttendeePreferences />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
