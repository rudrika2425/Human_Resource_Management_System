import { Navigate, Route, Routes } from 'react-router-dom';
import PerformancePage from './pages/PerformancePage';
import Goals from './pages/Goals';
import Review from './pages/Review';
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

// Import useAuth hook
import { useAuth } from './hooks/useAuth'; // Adjust path as needed

const genericPages = [
  ['goals', 'Goals', '/api/v1/goals'],
  ['documents', 'Documents', '/api/v1/documents'],
  ['audit-logs', 'Audit Logs', '/api/v1/audit-logs'],
];

// Wrapper component to pass roles to GenericResourcePage
function GenericResourcePageWithAuth({ title, endpoint, createPath, createLabel, editPath }) {
  const { user } = useAuth();
  const roles = user?.roles || [];
  
  return (
    <GenericResourcePage
      title={title}
      endpoint={endpoint}
      createPath={createPath}
      createLabel={createLabel}
      editPath={editPath}
      roles={roles}
      requiredRole="HR"
    />
  );
}

export default function App() {
  const { user } = useAuth();
  const roles = user?.roles || [];

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<RequireAuth><AppLayout /></RequireAuth>}>
        <Route index element={<DashboardPage />} />
        <Route path="employees" element={<EmployeesPage />} />
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="employees/new" element={<EmployeeFormPage mode="create" />} />
        <Route path="employees/:id" element={<Employee360Page />} />
        <Route path="employees/:id/edit" element={<EmployeeFormPage mode="edit" />} />
        <Route path="/employees/my-team" element={<MyTeamPage />} />

        {genericPages.map(([path, title, endpoint]) => (
          <Route 
            key={path} 
            path={path} 
            element={
              <GenericResourcePage 
                title={title} 
                endpoint={endpoint} 
                roles={roles}
                requiredRole="HR"
              />
            } 
          />
        ))}

        <Route path="payroll" element={<PayrollPage />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="/leave" element={<LeavePage />} />
        <Route
  path="/performance"
  element={
    <RequireAuth>
      <PerformancePage />
    </RequireAuth>
  }
/>

<Route
  path="/performance/goals"
  element={
    <RequireAuth>
      <Goals />
    </RequireAuth>
  }
/>

<Route
  path="/performance/reviews"
  element={
    <RequireAuth>
      <Review />
    </RequireAuth>
  }
/>

        {/* ============================================================
            DEPARTMENTS ROUTE - Now with roles passed
        ============================================================ */}
        <Route
          path="departments"
          element={
            <GenericResourcePage
              title="Departments"
              endpoint="/api/v1/departments"
              createPath="/departments/create"
              createLabel="+ Add Department"
              editPath={(row) => `/departments/${row.id}/edit`}
              roles={roles}  // <-- ADD THIS
              requiredRole="HR"  // <-- ADD THIS
            />
          }
        />
        <Route path="departments/create" element={<DepartmentFormPage mode="create" />} />
        <Route path="departments/:id/edit" element={<DepartmentFormPage mode="edit" />} />

        {/* ============================================================
            DESIGNATIONS ROUTE - Now with roles passed
        ============================================================ */}
        <Route
          path="designations"
          element={
            <GenericResourcePage
              title="Designations"
              endpoint="/api/v1/designations"
              createPath="/designations/create"
              createLabel="+ Add Designation"
              editPath={(row) => `/designations/${row.id}/edit`}
              roles={roles}  // <-- ADD THIS
              requiredRole="HR"  // <-- ADD THIS
            />
          }
        />
        <Route path="designations/create" element={<DesignationFormPage mode="create" />} />
        <Route path="designations/:id/edit" element={<DesignationFormPage mode="edit" />} />

        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}