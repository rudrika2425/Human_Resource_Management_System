import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Calendar, Users, User } from 'lucide-react';
import { api } from '../services/api';
import Spinner from '../components/Spinner';
import ErrorState from '../components/ErrorState';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../hooks/useAuth';


function getRole(user) {
  if (!user) return '';

  const role =
    user.role ||
    user.assignedRole ||
    user.userRole ||
    (Array.isArray(user.roles) ? user.roles[0] : '') ||
    (Array.isArray(user.authorities)
      ? user.authorities[0]?.authority
      : '') ||
    '';

  return String(role)
    .replace(/^ROLE_/, '')
    .toUpperCase();
}

function formatDate(date) {
  if (!date) return '—';

  return new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatTime(dateTime) {
  if (!dateTime) return '—';

  return new Date(dateTime).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatWorkedMinutes(minutes) {
  if (minutes === null || minutes === undefined) return '—';

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) return `${mins}m`;

  return `${hours}h ${mins}m`;
}

function getEmployeeName(row) {
  return (
    row.employeeName ||
    row.name ||
    `Employee #${row.employeeId ?? '—'}`
  );
}

function getStatusClass(status) {
  switch (status) {
    case 'PRESENT':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30';

    case 'LATE':
      return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30';

    case 'HALF_DAY':
      return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/30';

    case 'ABSENT':
      return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/30';

    case 'ON_LEAVE':
      return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/30';

    default:
      return 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/30';
  }
}

function StatCard({ label, value, description }) {
  return (
    <div className="rounded-2xl border border-purple-100 bg-white p-4 shadow-sm shadow-purple-100/50 dark:border-gray-800 dark:bg-gray-900 dark:shadow-black/30 sm:p-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-purple-400 dark:text-purple-400 sm:text-xs sm:tracking-[0.18em]">
        {label}
      </p>

      <div className="mt-2 text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100 sm:mt-3 sm:text-3xl">
        {value}
      </div>

      {description ? (
        <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400 sm:text-sm">{description}</p>
      ) : null}
    </div>
  );
}

function AttendanceStatus({ status }) {
  if (!status) {
    return (
      <span className="inline-flex whitespace-nowrap rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500">
        —
      </span>
    );
  }

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusClass(
        status
      )}`}
    >
      {status.replaceAll('_', ' ')}
    </span>
  );
}

function HistoryModal({ employee, history, loading, error, onClose }) {
  if (!employee) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 backdrop-blur-sm dark:bg-black/60 sm:p-4">
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900 dark:shadow-black/50 sm:rounded-3xl sm:max-h-[85vh]">
        <div className="flex flex-col gap-3 border-b border-black/10 px-4 py-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-purple-400 sm:text-xs sm:tracking-[0.2em]">
              Attendance History
            </p>

            <h2 className="mt-1 truncate text-lg font-semibold text-gray-900 dark:text-gray-100 sm:text-xl">
              {getEmployeeName(employee)}
            </h2>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Employee ID: {employee.employeeId ?? employee.employeeId === 0
                ? employee.employeeId
                : employee.id ?? '—'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center self-end rounded-xl border border-purple-100 bg-purple-50 text-purple-500 transition hover:bg-purple-100 hover:text-purple-700 dark:border-gray-800 dark:bg-gray-800 dark:text-purple-400 dark:hover:bg-gray-700 dark:hover:text-purple-300 sm:self-auto"
          >
            ×
          </button>
        </div>

        <div className="max-h-[65vh] overflow-auto p-3 sm:p-6">
          {loading ? (
            <Spinner label="Loading attendance history..." />
          ) : error ? (
            <ErrorState description="Unable to load attendance history." />
          ) : !history.length ? (
            <div className="rounded-2xl border border-dashed border-purple-200 bg-purple-50/40 p-6 text-center dark:border-gray-700 dark:bg-gray-800/40 sm:p-10">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No attendance records found.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-purple-100 bg-white dark:border-gray-800 dark:bg-gray-900">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[480px] divide-y divide-purple-100 text-sm dark:divide-gray-800">
                  <thead className="bg-purple-50 text-left text-gray-900 dark:bg-gray-800/60 dark:text-gray-100">
                    <tr>
                      <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-[0.15em]">
                        Date
                      </th>

                      <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-[0.15em]">
                        Check In
                      </th>

                      <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-[0.15em]">
                        Check Out
                      </th>

                      

                      <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-[0.15em]">
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-purple-100 dark:divide-gray-800">
                    {history.map((record) => (
                      <tr
                        key={record.id ?? `${record.employeeId}-${record.workDate}`}
                        className="transition hover:bg-purple-50/60 dark:hover:bg-gray-800/50"
                      >
                        <td className="whitespace-nowrap px-4 py-3 text-gray-800 dark:text-gray-200">
                          {formatDate(record.workDate)}
                        </td>

                        <td className="whitespace-nowrap px-4 py-3 text-gray-600 dark:text-gray-400">
                          {formatTime(record.checkInAt)}
                        </td>

                        <td className="whitespace-nowrap px-4 py-3 text-gray-600 dark:text-gray-400">
                          {formatTime(record.checkOutAt)}
                        </td>

                        

                        <td className="whitespace-nowrap px-4 py-3">
                          <AttendanceStatus status={record.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AttendancePage() {
  const { user: authUser } = useAuth();

  const [search, setSearch] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  
  const {
    data: meUser,
    isLoading: meLoading,
    error: meError,
  } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const response = await api.get('/api/v1/auth/me');
      return response.data?.data;
    },
  });

  
  
  const user = meUser || authUser;

  const role = getRole(user);

  console.log('========== ATTENDANCE DEBUG ==========');
  console.log('Auth user:', authUser);
  console.log('Backend /me user:', meUser);
  console.log('Final user:', user);
  console.log('Detected role:', role);
  console.log('User roles:', user?.roles);
  console.log('======================================');

  /*
   * HR:
   *     /api/v1/attendance/all/today
   *
   * MANAGER:
   *     /api/v1/attendance/team (for team attendance)
   *     /api/v1/attendance/my-history (for manager's own attendance)
   *
   * EMPLOYEE:
   *     /api/v1/attendance/my-history
   */
  const endpoint =
    role === 'HR'
      ? '/api/v1/attendance/all/today'
      : role === 'MANAGER'
        ? '/api/v1/attendance/team'
        : '/api/v1/attendance/my-history';

  const isEmployee = role === 'EMPLOYEE';
  const isHr = role === 'HR';
  const isManager = role === 'MANAGER';

  
  const {
    data,
    isLoading: attendanceLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['attendance', role, endpoint],
    queryFn: async () => {
      const response = await api.get(endpoint);
      return response.data?.data ?? [];
    },
    enabled: Boolean(role),
  });

  
  const {
    data: managerOwnAttendance,
    isLoading: managerOwnLoading,
  } = useQuery({
    queryKey: ['manager-own-attendance'],
    queryFn: async () => {
      const response = await api.get('/api/v1/attendance/my-history');
      return response.data?.data ?? [];
    },
    enabled: isManager,
  });

  const attendance = Array.isArray(data) ? data : [];
  const managerAttendance = Array.isArray(managerOwnAttendance) ? managerOwnAttendance : [];

  
  const filteredAttendance = useMemo(() => {
    if (!search.trim() || isEmployee) {
      return attendance;
    }

    const keyword = search.toLowerCase();

    return attendance.filter((row) => {
      const name = getEmployeeName(row).toLowerCase();
      const employeeId = String(row.employeeId ?? '').toLowerCase();
      const status = String(row.status ?? '').toLowerCase();

      return (
        name.includes(keyword) ||
        employeeId.includes(keyword) ||
        status.includes(keyword)
      );
    });
  }, [attendance, search, isEmployee]);

  
  const statistics = useMemo(() => {
    const targetData = isManager ? attendance : attendance;
    return {
      present: targetData.filter((item) => item.status === 'PRESENT').length,
      late: targetData.filter((item) => item.status === 'LATE').length,
      halfDay: targetData.filter((item) => item.status === 'HALF_DAY').length,
      absent: targetData.filter((item) => item.status === 'ABSENT').length,
      onLeave: targetData.filter((item) => item.status === 'ON_LEAVE').length,
    };
  }, [attendance, isManager]);

  
  const managerStats = useMemo(() => {
    return {
      present: managerAttendance.filter((item) => item.status === 'PRESENT').length,
      late: managerAttendance.filter((item) => item.status === 'LATE').length,
      halfDay: managerAttendance.filter((item) => item.status === 'HALF_DAY').length,
      absent: managerAttendance.filter((item) => item.status === 'ABSENT').length,
      onLeave: managerAttendance.filter((item) => item.status === 'ON_LEAVE').length,
    };
  }, [managerAttendance]);

  
  const employeeStats = useMemo(() => {
    return {
      present: attendance.filter((item) => item.status === 'PRESENT').length,
      late: attendance.filter((item) => item.status === 'LATE').length,
      halfDay: attendance.filter((item) => item.status === 'HALF_DAY').length,
      absent: attendance.filter((item) => item.status === 'ABSENT').length,
      onLeave: attendance.filter((item) => item.status === 'ON_LEAVE').length,
    };
  }, [attendance]);

  /*
   * History query for selected employee (HR/Manager only)
   */
  const {
    data: selectedHistory,
    isLoading: historyLoading,
    error: historyError,
  } = useQuery({
    queryKey: ['attendance-history', selectedEmployee?.employeeId],
    queryFn: async () => {
      const employeeId = selectedEmployee?.employeeId;

      const response = await api.get(
        `/api/v1/attendance/history/${employeeId}`,
        {
          params: {
            page: 0,
            size: 100,
          },
        }
      );

      return response.data?.data ?? [];
    },
    enabled:
      Boolean(selectedEmployee?.employeeId) &&
      (isHr || isManager),
  });

  if (meLoading || (isManager && managerOwnLoading)) {
    return <Spinner label="Loading user information..." />;
  }

  if (meError) {
    return <ErrorState description="Unable to load your user information." />;
  }

  if (!role) {
    return (
      <ErrorState description="Unable to determine your role." />
    );
  }

  if (attendanceLoading) {
    return <Spinner label="Loading attendance..." />;
  }

  if (error) {
    return (
      <ErrorState
        description="Unable to load attendance. Please try again."
        onRetry={refetch}
      />
    );
  }

  return (
    <>
      <div className="min-h-screen space-y-5 bg-gradient-to-b from-purple-50 via-[#F8F6FC] to-purple-50 p-3 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 sm:space-y-6 sm:p-4 md:p-6 lg:p-8">
        {}
        <div className="flex flex-col justify-between gap-3 border-b border-black/10 pb-4 dark:border-white/10 sm:gap-4 sm:pb-5 md:flex-row md:items-end">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-purple-500 dark:text-purple-400 sm:text-xs sm:tracking-[0.22em]">
              Workforce
            </p>

            <h1 className="mt-1 text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-2xl">
              Attendance
            </h1>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {isHr
                ? "Monitor today's attendance across the organization."
                : isManager
                  ? "View your attendance and your team's attendance."
                  : "View your attendance history and working hours."}
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* =========================
                HR FUNCTIONALITY
                Only show for HR role
            ========================== */}
            

            {(isHr || isManager) && (
              <div className="text-xs font-medium text-gray-600 dark:text-gray-400 sm:text-sm">
                {new Date().toLocaleDateString('en-IN', {
                  weekday: 'long',
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </div>
            )}
          </div>
        </div>

        {}
        {isEmployee ? (
          
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
            <StatCard
              label="Present"
              value={employeeStats.present}
              description="Your records"
            />
            <StatCard
              label="Late"
              value={employeeStats.late}
              description="Your records"
            />
            <StatCard
              label="Half Day"
              value={employeeStats.halfDay}
              description="Your records"
            />
            <StatCard
              label="Absent"
              value={employeeStats.absent}
              description="Your records"
            />
            <StatCard
              label="On Leave"
              value={employeeStats.onLeave}
              description="Your records"
            />
          </div>
        ) : isManager ? (
          
          <>
            {}
            <div>
              <div className="mb-3 flex items-center gap-2">
                <User size={18} className="text-purple-500 dark:text-purple-400" />
                <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 sm:text-lg">
                  My Attendance
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
                <StatCard
                  label="Present"
                  value={managerStats.present}
                  description="Your records"
                />
                <StatCard
                  label="Late"
                  value={managerStats.late}
                  description="Your records"
                />
                <StatCard
                  label="Half Day"
                  value={managerStats.halfDay}
                  description="Your records"
                />
                <StatCard
                  label="Absent"
                  value={managerStats.absent}
                  description="Your records"
                />
                <StatCard
                  label="On Leave"
                  value={managerStats.onLeave}
                  description="Your records"
                />
              </div>
            </div>

            {}
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Users size={18} className="text-purple-500 dark:text-purple-400" />
                <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 sm:text-lg">
                  Team Attendance
                </h2>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  ({filteredAttendance.length} members)
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
                <StatCard
                  label="Present"
                  value={statistics.present}
                  description="Today"
                />
                <StatCard
                  label="Late"
                  value={statistics.late}
                  description="Today"
                />
                <StatCard
                  label="Half Day"
                  value={statistics.halfDay}
                  description="Today"
                />
                <StatCard
                  label="Absent"
                  value={statistics.absent}
                  description="Today"
                />
                <StatCard
                  label="On Leave"
                  value={statistics.onLeave}
                  description="Today"
                />
              </div>
            </div>
          </>
        ) : (
          
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
            <StatCard
              label="Present"
              value={statistics.present}
              description="Today"
            />
            <StatCard
              label="Late"
              value={statistics.late}
              description="Today"
            />
            <StatCard
              label="Half Day"
              value={statistics.halfDay}
              description="Today"
            />
            <StatCard
              label="Absent"
              value={statistics.absent}
              description="Today"
            />
            <StatCard
              label="On Leave"
              value={statistics.onLeave}
              description="Today"
            />
          </div>
        )}

        {}
        {(isHr || isManager) && (
          <div className="rounded-2xl border border-purple-100 bg-white p-3 shadow-sm shadow-purple-100/50 dark:border-gray-800 dark:bg-gray-900 dark:shadow-black/30 sm:p-4">
            <div className="relative w-full sm:max-w-md">
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search employee, ID or status..."
                className="w-full rounded-xl border border-purple-100 bg-purple-50/40 px-4 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-400 transition focus:border-purple-300 focus:bg-white dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-purple-500 dark:focus:bg-gray-800 sm:py-3"
              />
            </div>
          </div>
        )}

        {}
        {isEmployee ? (
          <div className="overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-sm shadow-purple-100/50 dark:border-gray-800 dark:bg-gray-900 dark:shadow-black/30">
            <div className="border-b border-black/10 px-4 py-4 dark:border-white/10 sm:px-5">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-purple-500 dark:text-purple-400" />
                <h2 className="font-semibold text-gray-900 dark:text-gray-100">
                  My Attendance History
                </h2>
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Your complete attendance history and working hours.
              </p>
            </div>

            {!attendance.length ? (
              <div className="p-6 text-center sm:p-10">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No attendance records found.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] divide-y divide-purple-100 text-sm dark:divide-gray-800">
                  <thead className="bg-purple-50 text-left text-gray-900 dark:bg-gray-800/60 dark:text-gray-100">
                    <tr>
                      <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-[0.15em] sm:px-5">
                        Date
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-[0.15em] sm:px-5">
                        Check In
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-[0.15em] sm:px-5">
                        Check Out
                      </th>
                      
                      <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-[0.15em] sm:px-5">
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-purple-100 dark:divide-gray-800">
                    {attendance.map((row) => (
                      <tr
                        key={row.id ?? `${row.employeeId}-${row.workDate}`}
                        className="transition hover:bg-purple-50/60 dark:hover:bg-gray-800/50"
                      >
                        <td className="whitespace-nowrap px-4 py-4 text-gray-800 dark:text-gray-200 sm:px-5">
                          {formatDate(row.workDate)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-gray-600 dark:text-gray-400 sm:px-5">
                          {formatTime(row.checkInAt)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-gray-600 dark:text-gray-400 sm:px-5">
                          {formatTime(row.checkOutAt)}
                        </td>
                        
                        <td className="whitespace-nowrap px-4 py-4 sm:px-5">
                          <AttendanceStatus status={row.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : isManager ? (
          
          <>
            {}
            <div className="overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-sm shadow-purple-100/50 dark:border-gray-800 dark:bg-gray-900 dark:shadow-black/30">
              <div className="border-b border-black/10 px-4 py-4 dark:border-white/10 sm:px-5">
                <div className="flex items-center gap-2">
                  <User size={18} className="text-purple-500 dark:text-purple-400" />
                  <h2 className="font-semibold text-gray-900 dark:text-gray-100">
                    My Attendance
                  </h2>
                </div>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Your personal attendance records.
                </p>
              </div>

              {!managerAttendance.length ? (
                <div className="p-6 text-center sm:p-10">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No attendance records found.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[520px] divide-y divide-purple-100 text-sm dark:divide-gray-800">
                    <thead className="bg-purple-50 text-left text-gray-900 dark:bg-gray-800/60 dark:text-gray-100">
                      <tr>
                        <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-[0.15em] sm:px-5">
                          Date
                        </th>
                        <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-[0.15em] sm:px-5">
                          Check In
                        </th>
                        <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-[0.15em] sm:px-5">
                          Check Out
                        </th>
                        
                        <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-[0.15em] sm:px-5">
                          Status
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-purple-100 dark:divide-gray-800">
                      {managerAttendance.map((row) => (
                        <tr
                          key={row.id ?? `${row.employeeId}-${row.workDate}`}
                          className="transition hover:bg-purple-50/60 dark:hover:bg-gray-800/50"
                        >
                          <td className="whitespace-nowrap px-4 py-4 text-gray-800 dark:text-gray-200 sm:px-5">
                            {formatDate(row.workDate)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-gray-600 dark:text-gray-400 sm:px-5">
                            {formatTime(row.checkInAt)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-gray-600 dark:text-gray-400 sm:px-5">
                            {formatTime(row.checkOutAt)}
                          </td>
                          
                          <td className="whitespace-nowrap px-4 py-4 sm:px-5">
                            <AttendanceStatus status={row.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {}
            <div className="overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-sm shadow-purple-100/50 dark:border-gray-800 dark:bg-gray-900 dark:shadow-black/30">
              <div className="border-b border-black/10 px-4 py-4 dark:border-white/10 sm:px-5">
                <div className="flex flex-col justify-between gap-2 md:flex-row md:items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <Users size={18} className="text-purple-500 dark:text-purple-400" />
                      <h2 className="font-semibold text-gray-900 dark:text-gray-100">
                        Team Attendance
                      </h2>
                    </div>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Today's attendance of employees reporting to you.
                    </p>
                  </div>

                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {filteredAttendance.length} record
                    {filteredAttendance.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {!filteredAttendance.length ? (
                <div className="p-6 text-center sm:p-10">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No attendance records found.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] divide-y divide-purple-100 text-sm dark:divide-gray-800">
                    <thead className="bg-purple-50 text-left text-gray-900 dark:bg-gray-800/60 dark:text-gray-100">
                      <tr>
                        <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-[0.15em] sm:px-5">
                          Employee
                        </th>
                        <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-[0.15em] sm:px-5">
                          Date
                        </th>
                        <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-[0.15em] sm:px-5">
                          Check In
                        </th>
                        <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-[0.15em] sm:px-5">
                          Check Out
                        </th>
                        
                        <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-[0.15em] sm:px-5">
                          Status
                        </th>
                        <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.15em] sm:px-5">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-purple-100 dark:divide-gray-800">
                      {filteredAttendance.map((row) => (
                        <tr
                          key={row.id ?? `${row.employeeId}-${row.workDate}`}
                          className="transition hover:bg-purple-50/60 dark:hover:bg-gray-800/50"
                        >
                          <td className="whitespace-nowrap px-4 py-4 sm:px-5">
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                              {getEmployeeName(row)}
                            </div>
                            <div className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                              ID: {row.employeeId ?? '—'}
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-gray-600 dark:text-gray-400 sm:px-5">
                            {formatDate(row.workDate)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-gray-600 dark:text-gray-400 sm:px-5">
                            {formatTime(row.checkInAt)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-gray-600 dark:text-gray-400 sm:px-5">
                            {formatTime(row.checkOutAt)}
                          </td>
                          
                          <td className="whitespace-nowrap px-4 py-4 sm:px-5">
                            <AttendanceStatus status={row.status} />
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-right sm:px-5">
                            <button
                              type="button"
                              onClick={() => setSelectedEmployee(row)}
                              className="rounded-xl border border-purple-200 bg-purple-50 px-3 py-2 text-xs font-semibold text-purple-700 transition hover:bg-purple-600 hover:text-white dark:border-purple-800 dark:bg-purple-500/10 dark:text-purple-300 dark:hover:bg-purple-600 dark:hover:text-white"
                            >
                              View History
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : (
          
          <div className="overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-sm shadow-purple-100/50 dark:border-gray-800 dark:bg-gray-900 dark:shadow-black/30">
            <div className="border-b border-black/10 px-4 py-4 dark:border-white/10 sm:px-5">
              <div className="flex flex-col justify-between gap-2 md:flex-row md:items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <Users size={18} className="text-purple-500 dark:text-purple-400" />
                    <h2 className="font-semibold text-gray-900 dark:text-gray-100">
                      Today's Attendance
                    </h2>
                  </div>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Attendance of all active employees across the organization.
                  </p>
                </div>

                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {filteredAttendance.length} record
                  {filteredAttendance.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {!filteredAttendance.length ? (
              <div className="p-6 text-center sm:p-10">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No attendance records found.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] divide-y divide-purple-100 text-sm dark:divide-gray-800">
                  <thead className="bg-purple-50 text-left text-gray-900 dark:bg-gray-800/60 dark:text-gray-100">
                    <tr>
                      <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-[0.15em] sm:px-5">
                        Employee
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-[0.15em] sm:px-5">
                        Date
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-[0.15em] sm:px-5">
                        Check In
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-[0.15em] sm:px-5">
                        Check Out
                      </th>
                      
                      <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-[0.15em] sm:px-5">
                        Status
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.15em] sm:px-5">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-purple-100 dark:divide-gray-800">
                    {filteredAttendance.map((row) => (
                      <tr
                        key={row.id ?? `${row.employeeId}-${row.workDate}`}
                        className="transition hover:bg-purple-50/60 dark:hover:bg-gray-800/50"
                      >
                        <td className="whitespace-nowrap px-4 py-4 sm:px-5">
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {getEmployeeName(row)}
                          </div>
                          <div className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                            ID: {row.employeeId ?? '—'}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-gray-600 dark:text-gray-400 sm:px-5">
                          {formatDate(row.workDate)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-gray-600 dark:text-gray-400 sm:px-5">
                          {formatTime(row.checkInAt)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-gray-600 dark:text-gray-400 sm:px-5">
                          {formatTime(row.checkOutAt)}
                        </td>
                        
                        <td className="whitespace-nowrap px-4 py-4 sm:px-5">
                          <AttendanceStatus status={row.status} />
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-right sm:px-5">
                          <button
                            type="button"
                            onClick={() => setSelectedEmployee(row)}
                            className="rounded-xl border border-purple-200 bg-purple-50 px-3 py-2 text-xs font-semibold text-purple-700 transition hover:bg-purple-600 hover:text-white dark:border-purple-800 dark:bg-purple-500/10 dark:text-purple-300 dark:hover:bg-purple-600 dark:hover:text-white"
                          >
                            View History
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {}
      <HistoryModal
        employee={selectedEmployee}
        history={selectedHistory ?? []}
        loading={historyLoading}
        error={historyError}
        onClose={() => setSelectedEmployee(null)}
      />
    </>
  );
}