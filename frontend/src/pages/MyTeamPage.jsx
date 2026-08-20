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
      <div className="min-h-screen space-y-6 bg-gradient-to-b from-purple-50 via-[#F8F6FC] to-purple-50 p-3 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 sm:p-6">
        <Link
          to="/employees"
          className="inline-flex items-center gap-2 rounded-xl border border-purple-100 bg-white px-4 py-2 text-sm font-semibold text-gray-600 shadow-sm hover:bg-purple-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:shadow-black/30"
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
    <div className="min-h-screen space-y-5 bg-gradient-to-b from-purple-50 via-[#F8F6FC] to-purple-50 p-3 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 sm:space-y-6 sm:p-4 md:p-6 lg:p-8">

      {}
      <div className="flex flex-col justify-between gap-4 border-b border-black/10 pb-4 dark:border-white/10 sm:pb-5 md:flex-row md:items-end">

        <div>
          <Link
            to="/employees"
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300"
          >
            <ArrowLeft size={16} />
            Back to Employees
          </Link>

          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-purple-500 dark:text-purple-400 sm:text-xs sm:tracking-[0.3em]">
            Manager Workspace
          </p>

          <div className="mt-2 flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-purple-600 text-white shadow-sm dark:bg-purple-500 sm:h-12 sm:w-12">
              <Users size={22} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 sm:text-3xl">
                My Team
              </h1>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Employees currently reporting to you.
              </p>
            </div>
          </div>
        </div>

        <div className="w-fit rounded-2xl border border-purple-100 bg-white px-5 py-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:shadow-black/30">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Team Size
          </p>

          <p className="mt-1 text-2xl font-bold text-purple-600 dark:text-purple-400">
            {team.length}
          </p>
        </div>

      </div>

      {}
      <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">

        {team.map((employee) => (
          <div
            key={employee.id}
            className="overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-sm shadow-purple-100/50 transition hover:-translate-y-0.5 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:shadow-black/30 dark:hover:shadow-black/50"
          >

            {}
            <div className="border-b border-purple-100 bg-purple-50/60 p-4 dark:border-gray-800 dark:bg-purple-500/10 sm:p-5">

              <div className="flex items-start justify-between gap-4">

                <div className="flex items-center gap-3">

                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-purple-200 bg-purple-100 dark:border-purple-800 dark:bg-purple-500/20">

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
                      className={`h-full w-full items-center justify-center text-purple-500 dark:text-purple-400 ${
                        employee.profileImageUrl
                          ? 'hidden'
                          : 'flex'
                      }`}
                    >
                      <UserRound size={24} />
                    </div>

                  </div>

                  <div className="min-w-0">
                    <h2 className="truncate font-semibold text-gray-900 dark:text-gray-100">
                      {employee.firstName} {employee.lastName}
                    </h2>

                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
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
            <div className="space-y-3 p-4 sm:p-5">

              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                <Mail
                  size={16}
                  className="shrink-0 text-purple-400 dark:text-purple-500"
                />

                <span className="truncate">
                  {employee.email}
                </span>
              </div>

              {employee.phone && (
                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                  <Phone
                    size={16}
                    className="shrink-0 text-purple-400 dark:text-purple-500"
                  />

                  <span>
                    {employee.phone}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                <Building2
                  size={16}
                  className="shrink-0 text-purple-400 dark:text-purple-500"
                />

                <span>
                  {employee.departmentName || 'No department'}
                </span>
              </div>

              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                <BriefcaseBusiness
                  size={16}
                  className="shrink-0 text-purple-400 dark:text-purple-500"
                />

                <span>
                  {employee.designationName || 'No designation'}
                </span>
              </div>

              {employee.workLocation && (
                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                  <MapPin
                    size={16}
                    className="shrink-0 text-purple-400 dark:text-purple-500"
                  />

                  <span>
                    {employee.workLocation}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between gap-3 border-t border-purple-100 pt-4 dark:border-gray-800">

                <div className="min-w-0">
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Role
                  </p>

                  <p className="truncate text-sm font-semibold text-gray-800 dark:text-gray-200">
                    {employee.assignedRole}
                  </p>
                </div>

                <Link
                  to={`/employees/${employee.id}`}
                  className="shrink-0 rounded-xl border border-purple-100 bg-white px-3 py-2 text-xs font-semibold text-purple-600 transition hover:bg-purple-50 dark:border-gray-700 dark:bg-gray-800/60 dark:text-purple-300 dark:hover:bg-gray-800"
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