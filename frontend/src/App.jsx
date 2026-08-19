import { Routes, Route, Navigate } from 'react-router-dom';  // ✅ v6
import PerformancePage from './pages/PerformancePage';
import Goals from './pages/Goals';
import { Toaster } from 'react-hot-toast';
import Review from './pages/Review';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import RequireAuth from './components/RequireAuth';
import PayrollPage from './pages/PayrollPage';
import MyTeamPage from './pages/MyTeamPage';
import AppLayout from './layouts/AppLayout';
import DocumentsPage from './pages/DocumentsPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import EmployeesPage from './pages/EmployeesPage';
import EmployeeFormPage from './pages/EmployeeFormPage';
import Employee360Page from './pages/Employee360Page';
import GenericResourcePage from './pages/GenericResourcePage';
import NotificationsPage from './pages/NotificationsPage';
import ProfilePage from './pages/ProfilePage';
import RegisterPage from './pages/RegisterPage';
import DesignationFormPage from './pages/Designationformpage';
import DepartmentFormPage from './pages/Departmentformpage';
import AttendancePage from './pages/AttendancePage';
import LeavePage from './pages/LeavePage';

import { useAuth } from './hooks/useAuth';

const genericPages = [
  ['goals', 'Goals', '/api/v1/goals'],
  ['documents', 'Documents', '/api/v1/documents'],
  ['audit-logs', 'Audit Logs', '/api/v1/audit-logs'],
];

export default function App() {
  const { user } = useAuth();
  const roles = user?.roles || [];

  return (
    <>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 5000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
      
      <Routes>  {/* ✅ v6: Routes */}
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Protected routes with AppLayout */}
        <Route path="/" element={
          <RequireAuth>
            <AppLayout>
              <DashboardPage />
            </AppLayout>
          </RequireAuth>
        } />

        {/* Other routes inside AppLayout */}
        <Route path="/employees" element={
          <RequireAuth>
            <AppLayout>
              <EmployeesPage />
            </AppLayout>
          </RequireAuth>
        } />

        <Route path="/employees/new" element={
          <RequireAuth>
            <AppLayout>
              <EmployeeFormPage mode="create" />
            </AppLayout>
          </RequireAuth>
        } />

        <Route path="/employees/:id" element={
          <RequireAuth>
            <AppLayout>
              <Employee360Page />
            </AppLayout>
          </RequireAuth>
        } />

        <Route path="/employees/:id/edit" element={
          <RequireAuth>
            <AppLayout>
              <EmployeeFormPage mode="edit" />
            </AppLayout>
          </RequireAuth>
        } />

        <Route path="/employees/my-team" element={
          <RequireAuth>
            <AppLayout>
              <MyTeamPage />
            </AppLayout>
          </RequireAuth>
        } />

        <Route path="/documents" element={
          <RequireAuth>
            <AppLayout>
              <DocumentsPage />
            </AppLayout>
          </RequireAuth>
        } />

        <Route path="/payroll" element={
          <RequireAuth>
            <AppLayout>
              <PayrollPage />
            </AppLayout>
          </RequireAuth>
        } />

        <Route path="/attendance" element={
          <RequireAuth>
            <AppLayout>
              <AttendancePage />
            </AppLayout>
          </RequireAuth>
        } />

        <Route path="/leave" element={
          <RequireAuth>
            <AppLayout>
              <LeavePage />
            </AppLayout>
          </RequireAuth>
        } />

        <Route path="/performance" element={
          <RequireAuth>
            <AppLayout>
              <PerformancePage />
            </AppLayout>
          </RequireAuth>
        } />

        <Route path="/performance/goals" element={
          <RequireAuth>
            <AppLayout>
              <Goals />
            </AppLayout>
          </RequireAuth>
        } />

        <Route path="/performance/reviews" element={
          <RequireAuth>
            <AppLayout>
              <Review />
            </AppLayout>
          </RequireAuth>
        } />

        <Route path="/departments" element={
          <RequireAuth>
            <AppLayout>
              <GenericResourcePage
                title="Departments"
                endpoint="/api/v1/departments"
                createPath="/departments/create"
                createLabel="+ Add Department"
                editPath={(row) => `/departments/${row.id}/edit`}
                roles={roles}
                requiredRole="HR"
              />
            </AppLayout>
          </RequireAuth>
        } />

        <Route path="/departments/create" element={
          <RequireAuth>
            <AppLayout>
              <DepartmentFormPage mode="create" />
            </AppLayout>
          </RequireAuth>
        } />

        <Route path="/departments/:id/edit" element={
          <RequireAuth>
            <AppLayout>
              <DepartmentFormPage mode="edit" />
            </AppLayout>
          </RequireAuth>
        } />

        <Route path="/designations" element={
          <RequireAuth>
            <AppLayout>
              <GenericResourcePage
                title="Designations"
                endpoint="/api/v1/designations"
                createPath="/designations/create"
                createLabel="+ Add Designation"
                editPath={(row) => `/designations/${row.id}/edit`}
                roles={roles}
                requiredRole="HR"
              />
            </AppLayout>
          </RequireAuth>
        } />

        <Route path="/designations/create" element={
          <RequireAuth>
            <AppLayout>
              <DesignationFormPage mode="create" />
            </AppLayout>
          </RequireAuth>
        } />

        <Route path="/designations/:id/edit" element={
          <RequireAuth>
            <AppLayout>
              <DesignationFormPage mode="edit" />
            </AppLayout>
          </RequireAuth>
        } />

        <Route path="/notifications" element={
          <RequireAuth>
            <AppLayout>
              <NotificationsPage />
            </AppLayout>
          </RequireAuth>
        } />

        <Route path="/profile" element={
          <RequireAuth>
            <AppLayout>
              <ProfilePage />
            </AppLayout>
          </RequireAuth>
        } />

        {/* 404 redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}