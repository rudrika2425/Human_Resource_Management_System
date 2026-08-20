import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import Spinner from '../components/Spinner';
import ErrorState from '../components/ErrorState';
import StatusBadge from '../components/StatusBadge';

function SectionCard({ title, children }) {
  return (
    <div className="rounded-2xl border border-purple-100 bg-white p-4 shadow-sm shadow-purple-100/50 dark:border-gray-800 dark:bg-gray-900 dark:shadow-black/30 sm:p-6">
      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 sm:text-lg">
        {title}
      </h3>

      <div className="mt-4">
        {children}
      </div>
    </div>
  );
}

export default function Employee360Page() {
  const { id } = useParams();

  const {
    data,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['employee-360', id],

    queryFn: async () => {
      const [
        employeeRes,
        attendanceRes,
        leavesRes,
        payrollRes,
        documentsRes,
        notificationsRes,
      ] = await Promise.allSettled([
        api.get(`/api/v1/employees/${id}`),
        api.get(`/api/v1/attendance/history/${id}`),
        api.get(`/api/v1/leaves/history/${id}`),
        api.get(`/api/v1/payroll/history/${id}`),
        api.get(`/api/v1/documents?employeeId=${id}`),
        api.get('/api/v1/notifications'),
      ]);

      
      if (employeeRes.status === 'rejected') {
        throw employeeRes.reason;
      }

      const unwrap = (result, fallback) =>
        result.status === 'fulfilled'
          ? result.value.data.data
          : fallback;

      return {
        employee: unwrap(employeeRes, null),
        attendance: unwrap(attendanceRes, []),
        leaves: unwrap(leavesRes, []),
        payroll: unwrap(payrollRes, []),
        documents: unwrap(documentsRes, []),
        notifications: unwrap(notificationsRes, []),
      };
    },
  });

  if (isLoading) {
    return (
      <Spinner label="Loading employee 360..." />
    );
  }

  if (error) {
    return (
      <ErrorState
        description="Unable to load employee 360 view."
      />
    );
  }

  const {
    employee,
    attendance,
    leaves,
    payroll,
    documents,
    notifications,
  } = data;

  return (
    <div className="min-h-screen space-y-5 bg-gradient-to-b from-purple-50 via-[#F8F6FC] to-purple-50 p-3 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 sm:space-y-6 sm:p-4 md:p-6 lg:p-8">

      {}
      <div className="border-b border-black/10 pb-4 dark:border-white/10 sm:pb-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-purple-500 dark:text-purple-400 sm:text-xs sm:tracking-[0.3em]">
          Employee 360
        </p>

        <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100 sm:text-3xl">
          {employee.firstName} {employee.lastName}
        </h1>

        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Complete profile and operational history.
        </p>
      </div>

      {}
      <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 md:grid-cols-4">

        <SectionCard title="Overview">
          <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">

            <p>
              <span className="text-gray-500 dark:text-gray-400">
                Employee ID:
              </span>{' '}
              {employee.employeeId}
            </p>

            <p>
              <span className="text-gray-500 dark:text-gray-400">
                Department:
              </span>{' '}
              {employee.departmentName || '—'}
            </p>

            <p>
              <span className="text-gray-500 dark:text-gray-400">
                Designation:
              </span>{' '}
              {employee.designationName || '—'}
            </p>

            <p>
              <span className="text-gray-500 dark:text-gray-400">
                Role:
              </span>{' '}
              {employee.assignedRole || '—'}
            </p>

            <p>
              <span className="text-gray-500 dark:text-gray-400">
                Location:
              </span>{' '}
              {employee.workLocation || '—'}
            </p>

            <p>
              <span className="text-gray-500 dark:text-gray-400">
                Manager:
              </span>{' '}
              {employee.managerName || 'Not assigned'}
            </p>

          </div>
        </SectionCard>

        <SectionCard title="Status">
          <StatusBadge
            value={employee.employmentStatus}
          />
        </SectionCard>

        <SectionCard title="Attendance">
          <span className="text-gray-700 dark:text-gray-300">
            {attendance.length} records
          </span>
        </SectionCard>

        <SectionCard title="Payroll">
          <span className="text-gray-700 dark:text-gray-300">
            {payroll.length} payslips
          </span>
        </SectionCard>

      </div>

      {}
      <SectionCard title="Reporting Manager">
        <div className="rounded-xl bg-purple-50 px-4 py-4 dark:bg-purple-500/10">

          <p className="text-xs uppercase tracking-[0.15em] text-purple-500 dark:text-purple-400">
            Assigned Manager
          </p>

          <p className="mt-1 text-base font-semibold text-gray-900 dark:text-gray-100">
            {employee.managerName || 'Not assigned'}
          </p>

        </div>
      </SectionCard>

      {}
      <div className="grid gap-3 sm:gap-4 xl:grid-cols-2">

        {}
        <SectionCard title="Attendance history">
          <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">

            {attendance.slice(0, 5).map(
              (item) => (
                <div
                  key={item.id}
                  className="flex justify-between gap-3 rounded-xl bg-purple-50 px-4 py-3 dark:bg-purple-500/10"
                >
                  <span className="truncate">
                    {item.workDate}
                  </span>

                  <span className="shrink-0">
                    {item.status}
                  </span>
                </div>
              )
            )}

          </div>
        </SectionCard>

        {}
        <SectionCard title="Leave history">
          <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">

            {leaves.slice(0, 5).map(
              (item) => (
                <div
                  key={item.id}
                  className="flex justify-between gap-3 rounded-xl bg-purple-50 px-4 py-3 dark:bg-purple-500/10"
                >
                  <span className="truncate">
                    {item.leaveType}
                  </span>

                  <span className="shrink-0">
                    {item.status}
                  </span>
                </div>
              )
            )}

          </div>
        </SectionCard>

        {}
        <SectionCard title="Payroll history">
          <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">

            {payroll.slice(0, 5).map(
              (item) => (
                <div
                  key={item.id}
                  className="flex justify-between gap-3 rounded-xl bg-purple-50 px-4 py-3 dark:bg-purple-500/10"
                >
                  <span className="truncate">
                    {item.payrollMonth}
                  </span>

                  <span className="shrink-0">
                    {item.netSalary}
                  </span>
                </div>
              )
            )}

          </div>
        </SectionCard>

        {}
        <SectionCard title="Documents">
          <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">

            {documents.slice(0, 5).map(
              (item) => (
                <div
                  key={item.id}
                  className="flex justify-between gap-3 rounded-xl bg-purple-50 px-4 py-3 dark:bg-purple-500/10"
                >
                  <span className="truncate">
                    {item.originalFilename}
                  </span>

                  <span className="shrink-0">
                    {item.category}
                  </span>
                </div>
              )
            )}

          </div>
        </SectionCard>

      </div>

      {}
      <SectionCard title="Recent notifications">
        <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">

          {notifications.slice(0, 5).map(
            (item) => (
              <div
                key={item.id}
                className="flex justify-between gap-3 rounded-xl bg-purple-50 px-4 py-3 dark:bg-purple-500/10"
              >
                <span className="truncate">
                  {item.title}
                </span>

                <span className="shrink-0">
                  {item.read
                    ? 'Read'
                    : 'Unread'}
                </span>
              </div>
            )
          )}

        </div>
      </SectionCard>

    </div>
  );
}