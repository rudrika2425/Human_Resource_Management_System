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
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';

    case 'LATE':
      return 'bg-amber-50 text-amber-700 border-amber-200';

    case 'HALF_DAY':
      return 'bg-orange-50 text-orange-700 border-orange-200';

    case 'ABSENT':
      return 'bg-rose-50 text-rose-700 border-rose-200';

    case 'ON_LEAVE':
      return 'bg-purple-50 text-purple-700 border-purple-200';

    default:
      return 'bg-slate-50 text-slate-500 border-slate-200';
  }
}

function StatCard({ label, value, description }) {
  return (
    <div className="rounded-2xl border border-purple-100 bg-white p-5 shadow-sm shadow-purple-100/50">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-purple-400">
        {label}
      </p>

      <div className="mt-3 text-3xl font-semibold tracking-tight text-gray-900">
        {value}
      </div>

      {description ? (
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      ) : null}
    </div>
  );
}

function AttendanceStatus({ status }) {
  if (!status) {
    return (
      <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-400">
        —
      </span>
    );
  }

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusClass(
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
      <div className="max-h-[85vh] w-full max-w-5xl overflow-hidden rounded-3xl border border-purple-100 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-black/10 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-purple-400">
              Attendance History
            </p>

            <h2 className="mt-1 text-xl font-semibold text-gray-900">
              {getEmployeeName(employee)}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Employee ID: {employee.employeeId ?? employee.employeeId === 0
                ? employee.employeeId
                : employee.id ?? '—'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-purple-100 bg-purple-50 text-purple-500 transition hover:bg-purple-100 hover:text-purple-700"
          >
            ×
          </button>
        </div>

        <div className="max-h-[65vh] overflow-auto p-6">
          {loading ? (
            <Spinner label="Loading attendance history..." />
          ) : error ? (
            <ErrorState description="Unable to load attendance history." />
          ) : !history.length ? (
            <div className="rounded-2xl border border-dashed border-purple-200 bg-purple-50/40 p-10 text-center">
              <p className="text-sm text-gray-500">
                No attendance records found.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-purple-100 bg-white">
              <table className="min-w-full divide-y divide-purple-100 text-sm">
                <thead className="bg-purple-50 text-left text-gray-900">
                  <tr>
                    <th className="px-4 py-3 font-semibold uppercase tracking-[0.15em] text-xs">
                      Date
                    </th>

                    <th className="px-4 py-3 font-semibold uppercase tracking-[0.15em] text-xs">
                      Check In
                    </th>

                    <th className="px-4 py-3 font-semibold uppercase tracking-[0.15em] text-xs">
                      Check Out
                    </th>

                    

                    <th className="px-4 py-3 font-semibold uppercase tracking-[0.15em] text-xs">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-purple-100">
                  {history.map((record) => (
                    <tr
                      key={record.id ?? `${record.employeeId}-${record.workDate}`}
                      className="transition hover:bg-purple-50/60"
                    >
                      <td className="px-4 py-3 text-gray-800">
                        {formatDate(record.workDate)}
                      </td>

                      <td className="px-4 py-3 text-gray-600">
                        {formatTime(record.checkInAt)}
                      </td>

                      <td className="px-4 py-3 text-gray-600">
                        {formatTime(record.checkOutAt)}
                      </td>

                      

                      <td className="px-4 py-3">
                        <AttendanceStatus status={record.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
      <div className="min-h-screen space-y-6 bg-gradient-to-b from-purple-50 via-[#F8F6FC] to-purple-50 p-6">
        {}
        <div className="flex flex-col justify-between gap-4 border-b border-black/10 pb-5 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-purple-500">
              Workforce
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900">
              Attendance
            </h1>

            <p className="mt-1 text-sm text-gray-500">
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
              <div className="text-sm font-medium text-gray-600">
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
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
                <User size={18} className="text-purple-500" />
                <h2 className="text-lg font-semibold text-gray-900">
                  My Attendance
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
              <div className="mb-3 flex items-center gap-2">
                <Users size={18} className="text-purple-500" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Team Attendance
                </h2>
                <span className="text-sm text-gray-500">
                  ({filteredAttendance.length} members)
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
          <div className="rounded-2xl border border-purple-100 bg-white p-4 shadow-sm shadow-purple-100/50">
            <div className="relative max-w-md">
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search employee, ID or status..."
                className="w-full rounded-xl border border-purple-100 bg-purple-50/40 px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 transition focus:border-purple-300 focus:bg-white"
              />
            </div>
          </div>
        )}

        {}
        {isEmployee ? (
          <div className="overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-sm shadow-purple-100/50">
            <div className="border-b border-black/10 px-5 py-4">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-purple-500" />
                <h2 className="font-semibold text-gray-900">
                  My Attendance History
                </h2>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Your complete attendance history and working hours.
              </p>
            </div>

            {!attendance.length ? (
              <div className="p-10 text-center">
                <p className="text-sm text-gray-500">
                  No attendance records found.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-purple-100 text-sm">
                  <thead className="bg-purple-50 text-left text-gray-900">
                    <tr>
                      <th className="px-5 py-3 font-semibold uppercase tracking-[0.15em] text-xs">
                        Date
                      </th>
                      <th className="px-5 py-3 font-semibold uppercase tracking-[0.15em] text-xs">
                        Check In
                      </th>
                      <th className="px-5 py-3 font-semibold uppercase tracking-[0.15em] text-xs">
                        Check Out
                      </th>
                      
                      <th className="px-5 py-3 font-semibold uppercase tracking-[0.15em] text-xs">
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-purple-100">
                    {attendance.map((row) => (
                      <tr
                        key={row.id ?? `${row.employeeId}-${row.workDate}`}
                        className="transition hover:bg-purple-50/60"
                      >
                        <td className="px-5 py-4 text-gray-800">
                          {formatDate(row.workDate)}
                        </td>
                        <td className="px-5 py-4 text-gray-600">
                          {formatTime(row.checkInAt)}
                        </td>
                        <td className="px-5 py-4 text-gray-600">
                          {formatTime(row.checkOutAt)}
                        </td>
                        
                        <td className="px-5 py-4">
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
            <div className="overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-sm shadow-purple-100/50">
              <div className="border-b border-black/10 px-5 py-4">
                <div className="flex items-center gap-2">
                  <User size={18} className="text-purple-500" />
                  <h2 className="font-semibold text-gray-900">
                    My Attendance
                  </h2>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Your personal attendance records.
                </p>
              </div>

              {!managerAttendance.length ? (
                <div className="p-10 text-center">
                  <p className="text-sm text-gray-500">
                    No attendance records found.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-purple-100 text-sm">
                    <thead className="bg-purple-50 text-left text-gray-900">
                      <tr>
                        <th className="px-5 py-3 font-semibold uppercase tracking-[0.15em] text-xs">
                          Date
                        </th>
                        <th className="px-5 py-3 font-semibold uppercase tracking-[0.15em] text-xs">
                          Check In
                        </th>
                        <th className="px-5 py-3 font-semibold uppercase tracking-[0.15em] text-xs">
                          Check Out
                        </th>
                        
                        <th className="px-5 py-3 font-semibold uppercase tracking-[0.15em] text-xs">
                          Status
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-purple-100">
                      {managerAttendance.map((row) => (
                        <tr
                          key={row.id ?? `${row.employeeId}-${row.workDate}`}
                          className="transition hover:bg-purple-50/60"
                        >
                          <td className="px-5 py-4 text-gray-800">
                            {formatDate(row.workDate)}
                          </td>
                          <td className="px-5 py-4 text-gray-600">
                            {formatTime(row.checkInAt)}
                          </td>
                          <td className="px-5 py-4 text-gray-600">
                            {formatTime(row.checkOutAt)}
                          </td>
                          
                          <td className="px-5 py-4">
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
            <div className="overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-sm shadow-purple-100/50">
              <div className="border-b border-black/10 px-5 py-4">
                <div className="flex flex-col justify-between gap-2 md:flex-row md:items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <Users size={18} className="text-purple-500" />
                      <h2 className="font-semibold text-gray-900">
                        Team Attendance
                      </h2>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      Today's attendance of employees reporting to you.
                    </p>
                  </div>

                  <span className="text-sm font-medium text-gray-500">
                    {filteredAttendance.length} record
                    {filteredAttendance.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {!filteredAttendance.length ? (
                <div className="p-10 text-center">
                  <p className="text-sm text-gray-500">
                    No attendance records found.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-purple-100 text-sm">
                    <thead className="bg-purple-50 text-left text-gray-900">
                      <tr>
                        <th className="px-5 py-3 font-semibold uppercase tracking-[0.15em] text-xs">
                          Employee
                        </th>
                        <th className="px-5 py-3 font-semibold uppercase tracking-[0.15em] text-xs">
                          Date
                        </th>
                        <th className="px-5 py-3 font-semibold uppercase tracking-[0.15em] text-xs">
                          Check In
                        </th>
                        <th className="px-5 py-3 font-semibold uppercase tracking-[0.15em] text-xs">
                          Check Out
                        </th>
                        
                        <th className="px-5 py-3 font-semibold uppercase tracking-[0.15em] text-xs">
                          Status
                        </th>
                        <th className="px-5 py-3 text-right font-semibold uppercase tracking-[0.15em] text-xs">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-purple-100">
                      {filteredAttendance.map((row) => (
                        <tr
                          key={row.id ?? `${row.employeeId}-${row.workDate}`}
                          className="transition hover:bg-purple-50/60"
                        >
                          <td className="px-5 py-4">
                            <div className="font-medium text-gray-900">
                              {getEmployeeName(row)}
                            </div>
                            <div className="mt-0.5 text-xs text-gray-400">
                              ID: {row.employeeId ?? '—'}
                            </div>
                          </td>
                          <td className="px-5 py-4 text-gray-600">
                            {formatDate(row.workDate)}
                          </td>
                          <td className="px-5 py-4 text-gray-600">
                            {formatTime(row.checkInAt)}
                          </td>
                          <td className="px-5 py-4 text-gray-600">
                            {formatTime(row.checkOutAt)}
                          </td>
                          
                          <td className="px-5 py-4">
                            <AttendanceStatus status={row.status} />
                          </td>
                          <td className="px-5 py-4 text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedEmployee(row)}
                              className="rounded-xl border border-purple-200 bg-purple-50 px-3 py-2 text-xs font-semibold text-purple-700 transition hover:bg-purple-600 hover:text-white"
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
          
          <div className="overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-sm shadow-purple-100/50">
            <div className="border-b border-black/10 px-5 py-4">
              <div className="flex flex-col justify-between gap-2 md:flex-row md:items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <Users size={18} className="text-purple-500" />
                    <h2 className="font-semibold text-gray-900">
                      Today's Attendance
                    </h2>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Attendance of all active employees across the organization.
                  </p>
                </div>

                <span className="text-sm font-medium text-gray-500">
                  {filteredAttendance.length} record
                  {filteredAttendance.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {!filteredAttendance.length ? (
              <div className="p-10 text-center">
                <p className="text-sm text-gray-500">
                  No attendance records found.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-purple-100 text-sm">
                  <thead className="bg-purple-50 text-left text-gray-900">
                    <tr>
                      <th className="px-5 py-3 font-semibold uppercase tracking-[0.15em] text-xs">
                        Employee
                      </th>
                      <th className="px-5 py-3 font-semibold uppercase tracking-[0.15em] text-xs">
                        Date
                      </th>
                      <th className="px-5 py-3 font-semibold uppercase tracking-[0.15em] text-xs">
                        Check In
                      </th>
                      <th className="px-5 py-3 font-semibold uppercase tracking-[0.15em] text-xs">
                        Check Out
                      </th>
                      
                      <th className="px-5 py-3 font-semibold uppercase tracking-[0.15em] text-xs">
                        Status
                      </th>
                      <th className="px-5 py-3 text-right font-semibold uppercase tracking-[0.15em] text-xs">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-purple-100">
                    {filteredAttendance.map((row) => (
                      <tr
                        key={row.id ?? `${row.employeeId}-${row.workDate}`}
                        className="transition hover:bg-purple-50/60"
                      >
                        <td className="px-5 py-4">
                          <div className="font-medium text-gray-900">
                            {getEmployeeName(row)}
                          </div>
                          <div className="mt-0.5 text-xs text-gray-400">
                            ID: {row.employeeId ?? '—'}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-gray-600">
                          {formatDate(row.workDate)}
                        </td>
                        <td className="px-5 py-4 text-gray-600">
                          {formatTime(row.checkInAt)}
                        </td>
                        <td className="px-5 py-4 text-gray-600">
                          {formatTime(row.checkOutAt)}
                        </td>
                        
                        <td className="px-5 py-4">
                          <AttendanceStatus status={row.status} />
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedEmployee(row)}
                            className="rounded-xl border border-purple-200 bg-purple-50 px-3 py-2 text-xs font-semibold text-purple-700 transition hover:bg-purple-600 hover:text-white"
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