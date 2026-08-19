import { BrowserRouter, Switch, Route, Redirect } from 'react-router-dom';  // ✅ Changed
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

// Import useAuth hook
import { useAuth } from './hooks/useAuth';

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
    <BrowserRouter>  {/* ✅ v5 uses BrowserRouter here */}
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
        
        <Switch>  {/* ✅ v5 uses Switch instead of Routes */}
          {/* Public routes */}
          <Route path="/login" component={LoginPage} />
          <Route path="/register" component={RegisterPage} />
          <Route path="/forgot-password" component={ForgotPasswordPage} />
          <Route path="/reset-password" component={ResetPasswordPage} />

          {/* Protected routes - v5 doesn't use nested routes like v6 */}
          <Route
            path="/"
            render={() => (
              <RequireAuth>
                <AppLayout>
                  <Switch>
                    <Route exact path="/" component={DashboardPage} />
                    <Route path="/employees" component={EmployeesPage} />
                    <Route path="/documents" component={DocumentsPage} />
                    <Route path="/employees/new" render={() => <EmployeeFormPage mode="create" />} />
                    <Route path="/employees/:id" component={Employee360Page} />
                    <Route path="/employees/:id/edit" render={() => <EmployeeFormPage mode="edit" />} />
                    <Route path="/employees/my-team" component={MyTeamPage} />

                    {genericPages.map(([path, title, endpoint]) => (
                      <Route 
                        key={path} 
                        path={path} 
                        render={() => (
                          <GenericResourcePage 
                            title={title} 
                            endpoint={endpoint} 
                            roles={roles}
                            requiredRole="HR"
                          />
                        )}
                      />
                    ))}

                    <Route path="/payroll" component={PayrollPage} />
                    <Route path="/attendance" component={AttendancePage} />
                    <Route path="/leave" component={LeavePage} />
                    
                    <Route
                      path="/performance"
                      render={() => (
                        <RequireAuth>
                          <PerformancePage />
                        </RequireAuth>
                      )}
                    />

                    <Route
                      path="/performance/goals"
                      render={() => (
                        <RequireAuth>
                          <Goals />
                        </RequireAuth>
                      )}
                    />

                    <Route
                      path="/performance/reviews"
                      render={() => (
                        <RequireAuth>
                          <Review />
                        </RequireAuth>
                      )}
                    />

                    {/* Departments Route */}
                    <Route
                      path="/departments"
                      render={() => (
                        <GenericResourcePage
                          title="Departments"
                          endpoint="/api/v1/departments"
                          createPath="/departments/create"
                          createLabel="+ Add Department"
                          editPath={(row) => `/departments/${row.id}/edit`}
                          roles={roles}
                          requiredRole="HR"
                        />
                      )}
                    />
                    <Route path="/departments/create" render={() => <DepartmentFormPage mode="create" />} />
                    <Route path="/departments/:id/edit" render={() => <DepartmentFormPage mode="edit" />} />

                    {/* Designations Route */}
                    <Route
                      path="/designations"
                      render={() => (
                        <GenericResourcePage
                          title="Designations"
                          endpoint="/api/v1/designations"
                          createPath="/designations/create"
                          createLabel="+ Add Designation"
                          editPath={(row) => `/designations/${row.id}/edit`}
                          roles={roles}
                          requiredRole="HR"
                        />
                      )}
                    />
                    <Route path="/designations/create" render={() => <DesignationFormPage mode="create" />} />
                    <Route path="/designations/:id/edit" render={() => <DesignationFormPage mode="edit" />} />

                    <Route path="/notifications" component={NotificationsPage} />
                    <Route path="/profile" component={ProfilePage} />
                    
                    {/* 404 redirect */}
                    <Route render={() => <Redirect to="/" />} />
                  </Switch>
                </AppLayout>
              </RequireAuth>
            )}
          />

          {/* 404 redirect outside protected routes */}
          <Route render={() => <Redirect to="/" />} />
        </Switch>
      </>
    </BrowserRouter>
  );
}