import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './components/layout/DashboardLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import LoginPage from './pages/auth/LoginPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AgentDashboard from './pages/agent/AgentDashboard';
import CustomerDashboard from './pages/customer/CustomerDashboard';
import CustomerManagement from './pages/customerMgmt/CustomerManagement';
import PolicyManagement from './pages/policy/PolicyManagement';
import ClaimsSubmission from './pages/claims/ClaimsSubmission';
import ClaimsWorkflow from './pages/claims/ClaimsWorkflow';
import FraudReport from './pages/fraud/FraudReport';
import AnalyticsDashboard from './pages/analytics/AnalyticsDashboard';
import NotificationsCenter from './pages/notifications/NotificationsCenter';

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected dashboard routes */}
      <Route
        element={
          <ProtectedRoute allowedRoles={['admin', 'agent', 'customer', 'claims_manager']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        {/* Admin */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Agent */}
        <Route
          path="/agent"
          element={
            <ProtectedRoute allowedRoles={['agent']}>
              <AgentDashboard />
            </ProtectedRoute>
          }
        />

        {/* Customer */}
        <Route
          path="/customer"
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <CustomerDashboard />
            </ProtectedRoute>
          }
        />

        {/* Shared pages */}
        <Route
          path="/customers"
          element={
            <ProtectedRoute allowedRoles={['admin', 'agent']}>
              <CustomerManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/policies"
          element={
            <ProtectedRoute allowedRoles={['admin', 'agent']}>
              <PolicyManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/claims"
          element={
            <ProtectedRoute allowedRoles={['admin', 'agent', 'customer', 'claims_manager']}>
              <ClaimsSubmission />
            </ProtectedRoute>
          }
        />

        <Route
          path="/claims-workflow"
          element={
            <ProtectedRoute allowedRoles={['admin', 'claims_manager']}>
              <ClaimsWorkflow />
            </ProtectedRoute>
          }
        />

        <Route
          path="/fraud-report"
          element={
            <ProtectedRoute allowedRoles={['admin', 'claims_manager']}>
              <FraudReport />
            </ProtectedRoute>
          }
        />

        <Route
          path="/analytics"
          element={
            <ProtectedRoute allowedRoles={['admin', 'claims_manager']}>
              <AnalyticsDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/notifications"
          element={
            <ProtectedRoute allowedRoles={['admin', 'agent', 'customer', 'claims_manager']}>
              <NotificationsCenter />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
