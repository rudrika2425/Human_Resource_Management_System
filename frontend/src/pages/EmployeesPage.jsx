import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Users } from 'lucide-react';
import { api } from '../services/api';
import Spinner from '../components/Spinner';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../hooks/useAuth';

export default function EmployeesPage() {
  const { user } = useAuth();

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['employees'],
    queryFn: async () =>
      (await api.get('/api/v1/employees')).data.data,
  });

  const rows = data?.data || [];

  const roles = (user?.roles || []).map((role) =>
    role.replace('ROLE_', '').toUpperCase()
  );

  const isHR = roles.includes('HR');
  const isManager = roles.includes('MANAGER');
  const isEmployee = roles.includes('EMPLOYEE');

  if (isLoading) {
    return <Spinner label="Loading employees..." />;
  }

  if (error) {
    return (
      <ErrorState
        description="Unable to load employees."
        onRetry={refetch}
      />
    );
  }

  if (!rows.length) {
    return (
      <EmptyState
        title="No employees yet"
        description="No employee records are available."
      />
    );
  }

  return (
    <div className="min-h-screen space-y-6 bg-gradient-to-b from-purple-50 via-[#F8F6FC] to-purple-50 p-4 sm:p-6 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">

      {}
      <div className="flex flex-col justify-between gap-4 border-b border-black/10 pb-5 md:flex-row md:items-end dark:border-white/10">

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-purple-500 dark:text-purple-400">
            People
          </p>

          <h1 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-100">
            Employees
          </h1>

          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Live directory powered by the backend API.
          </p>
        </div>

        {/* =========================
            HR FUNCTIONALITY
            UNCHANGED
        ========================== */}
        <div className="flex flex-col gap-2 sm:flex-row">
          {isHR && (
            <Link
              className="inline-flex items-center justify-center rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-purple-200 transition hover:bg-purple-700 dark:shadow-black/30 dark:hover:bg-purple-500"
              to="/employees/new"
            >
              <Plus size={18} className="mr-2" />
              Create employee
            </Link>
          )}

          {/* =========================
              MANAGER FUNCTIONALITY
              UNCHANGED
          ========================== */}
          {isManager && (
            <Link
              className="inline-flex items-center justify-center rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-purple-200 transition hover:bg-purple-700 dark:shadow-black/30 dark:hover:bg-purple-500"
              to="/employees/my-team"
            >
              <Users size={18} className="mr-2" />
              My Team
            </Link>
          )}
        </div>
      </div>

      {}
      <div className="overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-sm shadow-purple-100/50 dark:border-gray-800 dark:bg-gray-900 dark:shadow-black/30">

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-purple-100 text-sm dark:divide-gray-800">

            <thead className="bg-purple-50 text-left text-gray-900 dark:bg-gray-800/60 dark:text-gray-100">
              <tr>

                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.1em]">
                  Employee ID
                </th>

                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.1em]">
                  Name
                </th>

                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.1em]">
                  Email
                </th>

                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.1em]">
                  Department
                </th>

                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.1em]">
                  Designation
                </th>

                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.1em]">
                  Role
                </th>

                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.1em]">
                  Status
                </th>

                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.1em]">
                  Actions
                </th>

              </tr>
            </thead>

            <tbody className="divide-y divide-purple-100 dark:divide-gray-800">

              {rows.map((employee) => (
                <tr
                  key={employee.id}
                  className="transition hover:bg-purple-50/60 dark:hover:bg-gray-800/50"
                >

                  <td className="px-4 py-3 text-gray-800 dark:text-gray-200">
                    {employee.employeeId}
                  </td>

                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                    {employee.firstName} {employee.lastName}
                  </td>

                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {employee.email}
                  </td>

                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {employee.departmentName || '—'}
                  </td>

                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {employee.designationName || '—'}
                  </td>

                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {employee.assignedRole}
                  </td>

                  <td className="px-4 py-3">
                    <StatusBadge
                      value={employee.employmentStatus}
                    />
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex gap-2">

                      {/* 
                       * ALL ROLES CAN VIEW EMPLOYEE 360.
                       * HR / MANAGER behavior remains unchanged.
                       */}
                      <Link
                        className="rounded-xl border border-purple-100 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-purple-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
                        to={`/employees/${employee.id}`}
                      >
                        360
                      </Link>

                      {}
                      {isHR && (
                        <Link
                          className="rounded-xl border border-purple-100 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-purple-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
                          to={`/employees/${employee.id}/edit`}
                        >
                          Edit
                        </Link>
                      )}

                    </div>
                  </td>

                </tr>
              ))}

            </tbody>

          </table>
        </div>
      </div>
    </div>
  );
}