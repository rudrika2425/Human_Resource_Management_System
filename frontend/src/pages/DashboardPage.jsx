import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { api } from '../services/api';
import Spinner from '../components/Spinner';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../hooks/useAuth';

const cardClass =
  'rounded-2xl border border-purple-100 bg-white p-5 shadow-sm shadow-purple-100/50';

function StatCard({ label, value, hint }) {
  return (
    <div className={cardClass}>
      <p className="text-sm text-gray-500">{label}</p>

      <p className="mt-2 text-3xl font-semibold text-gray-900">
        {value ?? 0}
      </p>

      {hint && (
        <p className="mt-2 text-xs text-gray-400">
          {hint}
        </p>
      )}
    </div>
  );
}

function formatDuration(milliseconds) {
  const totalSeconds = Math.max(
    0,
    Math.floor(milliseconds / 1000)
  );

  const hours = Math.floor(totalSeconds / 3600);

  const minutes = Math.floor(
    (totalSeconds % 3600) / 60
  );

  const seconds = totalSeconds % 60;

  return [
    String(hours).padStart(2, '0'),
    String(minutes).padStart(2, '0'),
    String(seconds).padStart(2, '0'),
  ].join(':');
}

function formatMinutes(minutes) {
  if (minutes == null || minutes < 0) {
    return '00:00:00';
  }

  return formatDuration(minutes * 60 * 1000);
}

function formatTime(value) {
  if (!value) {
    return '--';
  }

  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '--';
  }

  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/*
 * ============================================================
 * LOCAL DATE
 *
 * Do NOT use:
 *
 * new Date().toISOString().slice(0, 10)
 *
 * because that uses UTC and can select yesterday/tomorrow
 * depending on the user's timezone.
 * ============================================================
 */
function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, '0');

  const day = String(
    date.getDate()
  ).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/*
 * ============================================================
 * ATTENDANCE STATUS
 * ============================================================
 */
function getAttendanceStatus(attendance) {
  if (!attendance) {
    return 'ABSENT';
  }

  return (
    attendance.status ||
    attendance.attendanceStatus ||
    'PRESENT'
  )
    .toString()
    .replace('AttendanceStatus.', '')
    .replace('STATUS_', '')
    .toUpperCase();
}

function getStatusClasses(status) {
  switch (status) {
    case 'PRESENT':
      return 'bg-emerald-50 text-emerald-700';

    case 'LATE':
      return 'bg-amber-50 text-amber-700';

    case 'HALF_DAY':
      return 'bg-orange-50 text-orange-700';

    case 'ON_LEAVE':
      return 'bg-purple-50 text-purple-700';

    case 'ABSENT':
      return 'bg-rose-50 text-rose-700';

    default:
      return 'bg-slate-100 text-slate-500';
  }
}

function getStatusLabel(status) {
  switch (status) {
    case 'PRESENT':
      return 'Present';

    case 'LATE':
      return 'Late';


    case 'ON_LEAVE':
      return 'On Leave';

    case 'ABSENT':
      return 'Absent';

    default:
      return status || 'Unknown';
  }
}

/*
 * ============================================================
 * ATTENDANCE STATUS / LIVE TIMER
 *
 * SAME COMPONENT IS NOW USED BY:
 *
 * HR
 * MANAGER
 * EMPLOYEE
 *
 * It does NOT create attendance records.
 *
 * It only displays the actual attendance record returned
 * from the backend.
 *
 * Login:
 *   backend creates check-in
 *
 * Logout:
 *   backend creates check-out
 *
 * Dashboard:
 *   only reads and displays it.
 * ============================================================
 */
function AttendanceStatus({ attendance }) {
  const [now, setNow] = useState(Date.now());

  /*
   * Update timer every second.
   */
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  const state = useMemo(() => {
    /*
     * No attendance record for today.
     */
    if (!attendance) {
      return {
        status: 'ABSENT',
        checkIn: null,
        checkOut: null,
        workedMinutes: 0,
        elapsedMilliseconds: 0,
        remainingMilliseconds:
          8 * 60 * 60 * 1000,
        progress: 0,
        checkedIn: false,
        checkedOut: false,
      };
    }

    const status =
      getAttendanceStatus(attendance);

    /*
     * Support all existing backend field names.
     */
    const checkInValue =
      attendance.checkInAt ??
      attendance.checkInTime ??
      attendance.loginTime;

    const checkOutValue =
      attendance.checkOutAt ??
      attendance.checkOutTime ??
      attendance.logoutTime;

    const checkIn = checkInValue
      ? new Date(checkInValue)
      : null;

    const checkOut = checkOutValue
      ? new Date(checkOutValue)
      : null;

    const validCheckIn =
      checkIn &&
      !Number.isNaN(checkIn.getTime());

    const validCheckOut =
      checkOut &&
      !Number.isNaN(checkOut.getTime());

    const checkedIn =
      Boolean(validCheckIn);

    const checkedOut =
      Boolean(validCheckOut);

    /*
     * Backend workedMinutes, if available.
     */
    let workedMinutes =
      attendance.workedMinutes ?? null;

    let elapsedMilliseconds = 0;

    /*
     * --------------------------------------------------------
     * CURRENTLY WORKING
     *
     * check-in -> current time
     * --------------------------------------------------------
     */
    if (validCheckIn) {
      const endTime = validCheckOut
        ? checkOut.getTime()
        : now;

      elapsedMilliseconds = Math.max(
        0,
        endTime - checkIn.getTime()
      );
    }

    /*
     * --------------------------------------------------------
     * CHECKED OUT
     *
     * Backend workedMinutes is the source of truth.
     * --------------------------------------------------------
     */
    if (
      checkedOut &&
      workedMinutes != null
    ) {
      elapsedMilliseconds =
        Math.max(0, workedMinutes) *
        60 *
        1000;
    }

    /*
     * --------------------------------------------------------
     * CURRENTLY WORKING
     *
     * Calculate live worked minutes.
     * --------------------------------------------------------
     */
    if (
      checkedIn &&
      !checkedOut
    ) {
      workedMinutes = Math.floor(
        elapsedMilliseconds / 60000
      );
    }

    /*
     * 8-hour workday.
     */
    const eightHours =
      8 * 60 * 60 * 1000;

    /*
     * Remaining time cannot become negative.
     */
    const remainingMilliseconds =
      Math.max(
        0,
        eightHours -
          elapsedMilliseconds
      );

    /*
     * Progress cannot exceed 100%.
     */
    const progress =
      Math.min(
        100,
        Math.max(
          0,
          (elapsedMilliseconds /
            eightHours) *
            100
        )
      );

    return {
      status,
      checkIn: validCheckIn
        ? checkIn
        : null,

      checkOut: validCheckOut
        ? checkOut
        : null,

      workedMinutes,

      elapsedMilliseconds,

      remainingMilliseconds,

      progress,

      checkedIn,

      checkedOut,
    };
  }, [attendance, now]);

  const completed =
    state.elapsedMilliseconds >=
    8 * 60 * 60 * 1000;

  let heading = 'Not checked in';

  if (state.checkedOut) {
    heading = 'Checked out';
  } else if (completed) {
    heading = '8 Hours Completed';
  } else if (state.status === 'LATE') {
    heading = 'Working — Late';
  } else if (state.checkedIn) {
    heading = 'Checked in';
  }

  return (
    <div className={cardClass}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">
            Today's attendance
          </p>

          <p className="mt-1 text-xl font-semibold text-purple-700">
            {heading}
          </p>
        </div>

        <div
          className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClasses(
            state.status
          )}`}
        >
          {getStatusLabel(state.status)}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div>
          <p className="text-xs text-gray-400">
            Checked in at
          </p>

          <p className="mt-1 text-lg font-semibold text-gray-900">
            {formatTime(state.checkIn)}
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-400">
            Time worked
          </p>

          <p className="mt-1 text-lg font-semibold text-gray-900">
            {formatDuration(
              state.elapsedMilliseconds
            )}
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-400">
            Time remaining
          </p>

          <p className="mt-1 text-lg font-semibold text-gray-900">
            {state.checkedOut || completed
              ? '00:00:00'
              : formatDuration(
                  state.remainingMilliseconds
                )}
          </p>
        </div>
      </div>

      {state.checkedOut && (
        <div className="mt-4">
          <p className="text-xs text-gray-400">
            Checked out at
          </p>

          <p className="mt-1 text-lg font-semibold text-gray-900">
            {formatTime(state.checkOut)}
          </p>

          <p className="mt-1 text-xs text-gray-400">
            Backend recorded worked time:{' '}
            {formatMinutes(
              state.workedMinutes
            )}
          </p>
        </div>
      )}

      <div className="mt-6">
        <div className="mb-2 flex justify-between text-xs">
          <span className="text-gray-500">
            8-hour workday
          </span>

          <span className="text-gray-600">
            {Math.round(state.progress)}%
          </span>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-purple-100">
          <div
            className="h-full rounded-full bg-purple-500 transition-all duration-1000"
            style={{
              width: `${state.progress}%`,
            }}
          />
        </div>
      </div>

      <p className="mt-4 text-xs text-gray-400">
        Check-in happens automatically when you
        log in. Check-out happens automatically
        when you log out.
      </p>
    </div>
  );
}

/*
 * ============================================================
 * EXTRACT ATTENDANCE FROM DASHBOARD RESPONSE
 * ============================================================
 */
function extractAttendance(data) {
  if (!data) {
    return null;
  }

  return (
    data.attendance ??
    data.todayAttendance ??
    data.today ??
    null
  );
}

/*
 * ============================================================
 * FIND TODAY'S ATTENDANCE
 * ============================================================
 */
function findTodaysAttendance(records) {
  if (!Array.isArray(records)) {
    return null;
  }

  const today =
    getLocalDateString();

  return (
    records.find((record) => {
      if (!record) {
        return false;
      }

      /*
       * Main backend field.
       */
      if (record.workDate) {
        return (
          String(record.workDate)
            .slice(0, 10) === today
        );
      }

      /*
       * Compatibility with possible date fields.
       */
      const dateValue =
        record.date ??
        record.attendanceDate ??
        record.checkInAt ??
        record.checkInTime;

      if (!dateValue) {
        return false;
      }

      const date =
        new Date(dateValue);

      if (Number.isNaN(date.getTime())) {
        return false;
      }

      return (
        getLocalDateString(date) ===
        today
      );
    }) || null
  );
}

export default function DashboardPage() {
  const {
    user,
    loading: authLoading,
  } = useAuth();

  /*
   * ============================================================
   * ROLE
   * ============================================================
   */
  const role =
    user?.assignedRole
      ?.toString()
      ?.replace('ROLE_', '')
      ?.toUpperCase() ||
    user?.roles?.[0]
      ?.toString()
      ?.replace('ROLE_', '')
      ?.toUpperCase();

  const employeeId =
    user?.employeeId;

  /*
   * ============================================================
   * DASHBOARD ENDPOINT
   * ============================================================
   */
  let endpoint = null;

  if (role === 'HR') {
    endpoint =
      '/api/v1/dashboard/hr';
  }

  if (
    role === 'MANAGER' &&
    employeeId
  ) {
    endpoint =
      `/api/v1/dashboard/manager/${employeeId}`;
  }

  if (
    role === 'EMPLOYEE' &&
    employeeId
  ) {
    endpoint =
      `/api/v1/dashboard/employee/${employeeId}`;
  }

  /*
   * ============================================================
   * DASHBOARD QUERY
   *
   * Existing dashboard APIs remain unchanged.
   * ============================================================
   */
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      'dashboard',
      role,
      employeeId,
    ],

    queryFn: async () => {
      const response =
        await api.get(endpoint);

      return response.data.data;
    },

    enabled:
      !authLoading &&
      Boolean(user) &&
      Boolean(endpoint),

    refetchInterval: 30000,
  });

  /*
   * ============================================================
   * OWN ATTENDANCE
   *
   * ALL ROLES NOW USE THE SAME ATTENDANCE SOURCE.
   *
   * HR:
   *   /attendance/my-history
   *
   * MANAGER:
   *   /attendance/my-history
   *
   * EMPLOYEE:
   *   /attendance/my-history
   *
   * If HR doesn't have an employee profile and this endpoint
   * returns an error, we simply use the attendance supplied
   * by the HR dashboard instead.
   * ============================================================
   */
  const {
    data: ownAttendanceData,
    isLoading:
      ownAttendanceLoading,
  } = useQuery({
    queryKey: [
      'dashboard-own-attendance',
      role,
      employeeId,
    ],

    queryFn: async () => {
      try {
        const response =
          await api.get(
            '/api/v1/attendance/my-history'
          );

        return (
          response.data?.data ??
          []
        );
      } catch (attendanceError) {
        /*
         * Do NOT break the dashboard if the user
         * does not have an employee attendance profile.
         *
         * HR dashboard can still provide attendance.
         */
        console.warn(
          'Own attendance history unavailable:',
          attendanceError
        );

        return null;
      }
    },

    enabled:
      !authLoading &&
      Boolean(user) &&
      Boolean(role),

    refetchInterval: 30000,

    /*
     * Don't keep retrying if HR has no employee profile.
     */
    retry: false,
  });

  /*
   * ============================================================
   * AUTH LOADING
   * ============================================================
   */
  if (authLoading) {
    return (
      <Spinner label="Loading account..." />
    );
  }

  if (!user) {
    return (
      <EmptyState
        title="Not authenticated"
        description="Please log in again to access your dashboard."
      />
    );
  }

  if (!role) {
    return (
      <EmptyState
        title="User role not defined"
        description="Your account does not contain a valid HRMS role."
      />
    );
  }

  if (
    (role === 'MANAGER' ||
      role === 'EMPLOYEE') &&
    !employeeId
  ) {
    return (
      <EmptyState
        title="Employee profile not found"
        description="Your user account is not linked to an employee profile."
      />
    );
  }

  if (!endpoint) {
    return (
      <EmptyState
        title="Dashboard unavailable"
        description={`No dashboard is configured for the ${role} role.`}
      />
    );
  }

  /*
   * ============================================================
   * DASHBOARD LOADING
   *
   * Attendance loading is NOT allowed to block the dashboard.
   *
   * This is especially important for HR if HR doesn't have
   * an employee profile.
   * ============================================================
   */
  if (isLoading) {
    return (
      <Spinner label="Loading dashboard..." />
    );
  }

  if (error) {
    console.error(
      'Dashboard API error:',
      error
    );

    return (
      <ErrorState
        description="Unable to load the dashboard summary."
        onRetry={refetch}
      />
    );
  }

  if (!data) {
    return (
      <EmptyState
        title="No dashboard data"
        description="No dashboard information is available for your account."
      />
    );
  }

  /*
   * ============================================================
   * ATTENDANCE SELECTION
   *
   * First preference:
   *   /attendance/my-history
   *
   * Fallback:
   *   dashboard response
   *
   * This means HR/EMPLOYEE/MANAGER all use the same
   * AttendanceStatus component and live timer.
   * ============================================================
   */
  const attendanceFromHistory =
    findTodaysAttendance(
      ownAttendanceData
    );

  const dashboardAttendance =
    extractAttendance(data);

  const attendance =
    attendanceFromHistory ??
    dashboardAttendance ??
    null;

  /*
   * ============================================================
   * HR DASHBOARD
   *
   * Existing HR layout/cards remain unchanged.
   * Only AttendanceStatus has been added.
   * ============================================================
   */
  if (role === 'HR') {
    return (
      <div className="min-h-screen space-y-6 bg-gradient-to-b from-purple-50 via-[#F8F6FC] to-purple-50">
        <div className="border-b border-black/10">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-purple-500">
            Overview
          </p>

          <h1 className="mt-2 text-3xl font-bold text-gray-900">
            HR dashboard
          </h1>
        </div>

        {}
        <AttendanceStatus
          attendance={attendance}
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total employees"
            value={
              data.totalEmployees
            }
            hint="All registered employees"
          />

          <StatCard
            label="Active employees"
            value={
              data.activeEmployees
            }
            hint="Currently active records"
          />

          <StatCard
            label="Present today"
            value={
              data.presentToday
            }
            hint="Employees checked in today"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          

          
         
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          <div className={cardClass}>
            <p className="text-sm text-gray-500">
              Leave flow
            </p>

            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">
                  Employees on leave
                </p>

                <p className="text-2xl font-semibold text-gray-900">
                  {data.employeesOnLeave ??
                    0}
                </p>
              </div>

              <div>
                <p className="text-gray-500">
                  Pending leave
                </p>

                <p className="text-2xl font-semibold text-gray-900">
                  {data.pendingLeave ??
                    0}
                </p>
              </div>
            </div>
          </div>

          

          <div className={cardClass}>
            <p className="text-sm text-gray-500">
              System status
            </p>

            <p className="mt-4 text-3xl font-semibold text-purple-700">
              Healthy
            </p>

            <p className="mt-2 text-sm text-gray-500">
              Server connected and responsive
            </p>
          </div>
        </div>
      </div>
    );
  }

  /*
   * ============================================================
   * MANAGER DASHBOARD
   * ============================================================
   */
  if (role === 'MANAGER') {
    return (
      <div className="min-h-screen space-y-6 bg-gradient-to-b from-purple-50 via-[#F8F6FC] to-purple-50">
        <div className="border-b border-black/10">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-purple-500">
            Overview
          </p>

          <h1 className="mt-2 text-3xl font-bold text-gray-900">
            Manager dashboard
          </h1>
        </div>

        

        {}
        <AttendanceStatus
          attendance={attendance}
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Team size"
            value={
              data.teamSize ??
              data.totalTeamMembers ??
              data.totalEmployees ??
              0
            }
            hint="Employees in your team"
          />

          <StatCard
            label="Present today"
            value={
              data.presentToday ?? 0
            }
            hint="Team members present today"
          />

          <StatCard
            label="On leave"
            value={
              data.employeesOnLeave ??
              data.teamMembersOnLeave ??
              0
            }
            hint="Team members currently on leave"
          />

          <div className={cardClass}>
            <p className="text-sm text-gray-500">
              Pending leave
            </p>

            <p className="mt-4 text-3xl font-semibold text-gray-900">
              {data.pendingLeave ?? 0}
            </p>

            <p className="mt-2 text-sm text-gray-500">
              Leave requests awaiting action
            </p>
          </div>
        </div>

        
      </div>
    );
  }

  /*
   * ============================================================
   * EMPLOYEE DASHBOARD
   * ============================================================
   */
  if (role === 'EMPLOYEE') {
    return (
      <div className="min-h-screen space-y-6 bg-gradient-to-b from-purple-50 via-[#F8F6FC] to-purple-50">
        <div className="border-b border-black/10">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-purple-500">
            Overview
          </p>

          <h1 className="mt-2 text-3xl font-bold text-gray-900">
            Employee dashboard
          </h1>
        </div>

        {}
        <AttendanceStatus
          attendance={attendance}
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Attendance"
            value={
              data.attendancePercentage !=
              null
                ? `${data.attendancePercentage}%`
                : data.attendance ?? 0
            }
            hint="Your current attendance"
          />

          <StatCard
            label="Leave balance"
            value={
              data.leaveBalance ??
              data.remainingLeave ??
              0
            }
            hint="Available leave"
          />

          <StatCard
            label="Pending leave"
            value={
              data.pendingLeave ?? 0
            }
            hint="Your pending leave requests"
          />

          <StatCard
            label="Today"
            value={
              attendance
                ? getStatusLabel(
                    getAttendanceStatus(
                      attendance
                    )
                  )
                : 'Absent'
            }
            hint="Today's attendance status"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          

          <div className={cardClass}>
            <p className="text-sm text-gray-500">
              Account status
            </p>

            <p
              className={`mt-4 text-3xl font-semibold ${
                user.active
                  ? 'text-purple-700'
                  : 'text-rose-600'
              }`}
            >
              {user.active
                ? 'Active'
                : 'Inactive'}
            </p>

            <p className="mt-2 text-sm text-gray-500">
              Current account status
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <EmptyState
      title="Dashboard unavailable"
      description="Your role does not have a dashboard configured."
    />
  );
}