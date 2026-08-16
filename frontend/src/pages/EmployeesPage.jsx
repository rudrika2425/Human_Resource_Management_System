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
    <div className="min-h-screen space-y-6 bg-gradient-to-b from-purple-50 via-[#F8F6FC] to-purple-50 p-6">

      {}
      <div className="flex flex-col justify-between gap-4 border-b border-black/10 pb-5 md:flex-row md:items-end">

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-purple-500">
            People
          </p>

          <h1 className="mt-2 text-3xl font-bold text-gray-900">
            Employees
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Live directory powered by the backend API.
          </p>
        </div>

        {/* =========================
            HR FUNCTIONALITY
            UNCHANGED
        ========================== */}
        {isHR && (
          <Link
            className="inline-flex items-center rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-purple-200 transition hover:bg-purple-700"
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
            className="inline-flex items-center rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-purple-200 transition hover:bg-purple-700"
            to="/employees/my-team"
          >
            <Users size={18} className="mr-2" />
            My Team
          </Link>
        )}
      </div>

      {}
      <div className="overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-sm shadow-purple-100/50">

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-purple-100 text-sm">

            <thead className="bg-purple-50 text-left text-gray-900">
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

            <tbody className="divide-y divide-purple-100">

              {rows.map((employee) => (
                <tr
                  key={employee.id}
                  className="transition hover:bg-purple-50/60"
                >

                  <td className="px-4 py-3 text-gray-800">
                    {employee.employeeId}
                  </td>

                  <td className="px-4 py-3 font-medium text-gray-900">
                    {employee.firstName} {employee.lastName}
                  </td>

                  <td className="px-4 py-3 text-gray-600">
                    {employee.email}
                  </td>

                  <td className="px-4 py-3 text-gray-600">
                    {employee.departmentName || '—'}
                  </td>

                  <td className="px-4 py-3 text-gray-600">
                    {employee.designationName || '—'}
                  </td>

                  <td className="px-4 py-3 text-gray-600">
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
                        className="rounded-xl border border-purple-100 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-purple-50"
                        to={`/employees/${employee.id}`}
                      >
                        360
                      </Link>

                      {}
                      {isHR && (
                        <Link
                          className="rounded-xl border border-purple-100 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-purple-50"
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