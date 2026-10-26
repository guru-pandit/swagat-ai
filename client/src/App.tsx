import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Center, Spinner } from '@chakra-ui/react';
import { ProtectedRoute } from './components/ProtectedRoute';
import { KioskLayout } from './layouts/KioskLayout';
import { StaffLayout } from './layouts/StaffLayout';

// Load each workflow only when its route is visited, keeping the initial JS payload smaller.
const LoginPage = lazy(() => import('./pages/LoginPage').then(module => ({ default: module.LoginPage })));
const DashboardHome = lazy(() => import('./pages/dashboard/DashboardHome').then(module => ({ default: module.DashboardHome })));
const AnalyticsPage = lazy(() => import('./pages/dashboard/AnalyticsPage').then(module => ({ default: module.AnalyticsPage })));
const AppointmentsPage = lazy(() => import('./pages/AppointmentsPage'));
const PackagesPage = lazy(() => import('./pages/PackagePage'));
const KioskCheckin = lazy(() => import('./pages/kiosk/KioskCheckin').then(module => ({ default: module.KioskCheckin })));
const VisitorsPage = lazy(() => import('./pages/VisitorsPage'));

export default function App() {
  return (
    // Keep a single router at the app root so every page shares the same history.
    <BrowserRouter>
      <Suspense fallback={<Center minH="100vh"><Spinner size="xl" /></Center>}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<KioskLayout />}>
          <Route path="/kiosk" element={<KioskCheckin />} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route element={<StaffLayout />}>
            <Route path="/" element={<DashboardHome />} />
            <Route path="/appointments" element={<AppointmentsPage />} />
            <Route element={<ProtectedRoute roles={['ADMIN', 'RECEPTIONIST']} />}>
              <Route path="/visitors" element={<VisitorsPage />} />
              <Route path="/packages" element={<PackagesPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
            </Route>
          </Route>
        </Route>
        {/* Unknown URLs return to a real landing page instead of rendering a blank screen. */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
