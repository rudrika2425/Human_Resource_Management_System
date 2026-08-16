import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  Mail,
  MapPin,
  Phone,
  UserRound,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { api } from '../services/api';
import Spinner from '../components/Spinner';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';

export default function MyTeamPage() {

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['my-team'],
    queryFn: async () =>
      (await api.get('/api/v1/employees/my-team')).data.data,
  });

  if (isLoading) {
    return <Spinner label="Loading your team..." />;
  }

  if (error) {
    return (
      <ErrorState
        description="Unable to load your team."
        onRetry={refetch}
      />
    );
  }

  const team = data || [];

  if (!team.length) {
    return (
      <div className="space-y-6">
        <Link
          to="/employees"
          className="inline-flex items-center gap-2 rounded-xl border border-purple-100 bg-white px-4 py-2 text-sm font-semibold text-gray-600 shadow-sm hover:bg-purple-50"
        >
          <ArrowLeft size={16} />
          Back to Employees
        </Link>

        <EmptyState
          title="No team members"
          description="There are currently no employees assigned to you as their manager."
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-6 bg-gradient-to-b from-purple-50 via-[#F8F6FC] to-purple-50 p-6">

      {}
      <div className="flex flex-col justify-between gap-4 border-b border-black/10 pb-5 md:flex-row md:items-end">

        <div>
          <Link
            to="/employees"
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-purple-600 hover:text-purple-800"
          >
            <ArrowLeft size={16} />
            Back to Employees
          </Link>

          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-purple-500">
            Manager Workspace
          </p>

          <div className="mt-2 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-600 text-white shadow-sm">
              <Users size={22} />
            </div>

            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                My Team
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Employees currently reporting to you.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-purple-100 bg-white px-5 py-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Team Size
          </p>

          <p className="mt-1 text-2xl font-bold text-purple-600">
            {team.length}
          </p>
        </div>

      </div>

      {}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">

        {team.map((employee) => (
          <div
            key={employee.id}
            className="overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-sm shadow-purple-100/50 transition hover:-translate-y-0.5 hover:shadow-md"
          >

            {}
            <div className="border-b border-purple-100 bg-purple-50/60 p-5">

              <div className="flex items-start justify-between gap-4">

                <div className="flex items-center gap-3">

                  <div className="h-14 w-14 overflow-hidden rounded-2xl border border-purple-200 bg-purple-100">

                    {employee.profileImageUrl ? (
                      <img
                        src={employee.profileImageUrl}
                        alt={`${employee.firstName} ${employee.lastName}`}
                        className="h-full w-full object-cover"
                        onError={(event) => {
                          event.currentTarget.style.display = 'none';

                          if (
                            event.currentTarget
                              .nextElementSibling
                          ) {
                            event.currentTarget
                              .nextElementSibling
                              .style.display = 'flex';
                          }
                        }}
                      />
                    ) : null}

                    <div
                      className={`h-full w-full items-center justify-center text-purple-500 ${
                        employee.profileImageUrl
                          ? 'hidden'
                          : 'flex'
                      }`}
                    >
                      <UserRound size={24} />
                    </div>

                  </div>

                  <div>
                    <h2 className="font-semibold text-gray-900">
                      {employee.firstName} {employee.lastName}
                    </h2>

                    <p className="mt-0.5 text-xs text-gray-500">
                      {employee.employeeId}
                    </p>
                  </div>

                </div>

                <StatusBadge
                  value={employee.employmentStatus}
                />

              </div>
            </div>

            {}
            <div className="space-y-3 p-5">

              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Mail
                  size={16}
                  className="shrink-0 text-purple-400"
                />

                <span className="truncate">
                  {employee.email}
                </span>
              </div>

              {employee.phone && (
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Phone
                    size={16}
                    className="shrink-0 text-purple-400"
                  />

                  <span>
                    {employee.phone}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Building2
                  size={16}
                  className="shrink-0 text-purple-400"
                />

                <span>
                  {employee.departmentName || 'No department'}
                </span>
              </div>

              <div className="flex items-center gap-3 text-sm text-gray-600">
                <BriefcaseBusiness
                  size={16}
                  className="shrink-0 text-purple-400"
                />

                <span>
                  {employee.designationName || 'No designation'}
                </span>
              </div>

              {employee.workLocation && (
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <MapPin
                    size={16}
                    className="shrink-0 text-purple-400"
                  />

                  <span>
                    {employee.workLocation}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between border-t border-purple-100 pt-4">

                <div>
                  <p className="text-xs text-gray-400">
                    Role
                  </p>

                  <p className="text-sm font-semibold text-gray-800">
                    {employee.assignedRole}
                  </p>
                </div>

                <Link
                  to={`/employees/${employee.id}`}
                  className="rounded-xl border border-purple-100 bg-white px-3 py-2 text-xs font-semibold text-purple-600 transition hover:bg-purple-50"
                >
                  View 360
                </Link>

              </div>

            </div>
          </div>
        ))}

      </div>
    </div>
  );
}