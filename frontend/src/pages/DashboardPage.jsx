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

/* ============================================================
 * TIME HELPERS
 * ============================================================ */

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

/* ============================================================
 * LOCAL DATE
 * ============================================================ */

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

/* ============================================================
 * ATTENDANCE STATUS
 * ============================================================ */

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

    case 'HALF_DAY':
      return 'Half Day';

    case 'ON_LEAVE':
      return 'On Leave';

    case 'ABSENT':
      return 'Absent';

    default:
      return status || 'Unknown';
  }
}

/* ============================================================
 * ATTENDANCE STATUS / LIVE TIMER
 *
 * IMPORTANT:
 *
 * Frontend NEVER creates attendance.
 *
 * Backend:
 *
 * LOGIN
 *   -> AuthService.login()
 *   -> attendanceService.checkInForLogin()
 *   -> checkInAt saved in DB
 *
 * FRONTEND
 *   -> /attendance/my-history
 *   -> reads checkInAt
 *   -> timer starts from checkInAt
 *
 * LOGOUT
 *   -> AuthService.logout()
 *   -> attendanceService.checkOutIfCheckedIn()
 *   -> checkOutAt + workedMinutes saved
 * ============================================================ */

function AttendanceStatus({ attendance }) {
  const [now, setNow] = useState(Date.now());

  /*
   * Refresh the displayed timer every second.
   */
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const state = useMemo(() => {
    /*
     * No backend attendance record.
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
     * These are the actual fields returned by
     * AttendanceResponse:
     *
     * checkInAt
     * checkOutAt
     * workedMinutes
     * status
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

    const checkedIn = Boolean(validCheckIn);
    const checkedOut = Boolean(validCheckOut);

    /*
     * Backend is the source of truth for
     * completed sessions.
     */
    let workedMinutes =
      attendance.workedMinutes ?? null;

    let elapsedMilliseconds = 0;

    /*
     * ========================================================
     * CURRENTLY LOGGED IN
     *
     * Timer starts EXACTLY from backend checkInAt.
     * ========================================================
     */
    if (validCheckIn && !validCheckOut) {
      elapsedMilliseconds = Math.max(
        0,
        now - checkIn.getTime()
      );

      /*
       * Display only.
       * We do NOT save this value to backend.
       */
      workedMinutes = Math.floor(
        elapsedMilliseconds / 60000
      );
    }

    /*
     * ========================================================
     * LOGGED OUT
     *
     * Backend workedMinutes is authoritative.
     * ========================================================
     */
    if (validCheckOut) {
      if (workedMinutes != null) {
        elapsedMilliseconds =
          Math.max(0, workedMinutes) *
          60 *
          1000;
      } else {
        elapsedMilliseconds = Math.max(
          0,
          checkOut.getTime() -
            checkIn.getTime()
        );
      }
    }

    const eightHours =
      8 * 60 * 60 * 1000;

    const remainingMilliseconds =
      Math.max(
        0,
        eightHours -
          elapsedMilliseconds
      );

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
        Check-in and check-out are handled automatically
        by the backend when you log in and log out.
      </p>
    </div>
  );
}

/* ============================================================
 * FIND TODAY'S ATTENDANCE
 * ============================================================ */

function findTodaysAttendance(records) {
  if (!Array.isArray(records)) {
    return null;
  }

  const today = getLocalDateString();

  return (
    records.find((record) => {
      if (!record) {
        return false;
      }

      if (record.workDate) {
        return (
          String(record.workDate).slice(0, 10) ===
          today
        );
      }

      const dateValue =
        record.date ??
        record.attendanceDate ??
        record.checkInAt ??
        record.checkInTime;

      if (!dateValue) {
        return false;
      }

      const date = new Date(dateValue);

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

/* ============================================================
 * DASHBOARD PAGE
 * ============================================================ */

export default function DashboardPage() {
  const {
    user,
    loading: authLoading,
  } = useAuth();

  /* ==========================================================
   * ROLE
   * ========================================================== */

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

  /* ==========================================================
   * DASHBOARD ENDPOINT
   *
   * These exactly match DashboardController.
   * ========================================================== */

  let endpoint = null;

  if (role === 'HR') {
    endpoint = '/api/v1/dashboard/hr';
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

  /* ==========================================================
   * DASHBOARD QUERY
   * ========================================================== */

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

  /* ==========================================================
   * OWN ATTENDANCE
   *
   * IMPORTANT:
   *
   * This is the ONLY attendance source used for the
   * attendance timer.
   *
   * Backend login creates:
   *
   * attendance.checkInAt
   *
   * Therefore the frontend simply reads it.
   * ========================================================== */

  const {
    data: ownAttendanceData,
    isLoading:
      ownAttendanceLoading,
    refetch:
      refetchOwnAttendance,
  } = useQuery({
    queryKey: [
      'dashboard-own-attendance',
      user?.email,
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

    /*
     * Refresh every 30 seconds so that after
     * login/logout the latest backend attendance
     * is reflected.
     */
    refetchInterval: 30000,

    retry: false,
  });

  /*
   * Extra refresh after the page becomes visible.
   *
   * Useful when user logs in and then returns
   * to the dashboard.
   */
  useEffect(() => {
    const handleVisibility = () => {
      if (
        document.visibilityState ===
        'visible'
      ) {
        refetchOwnAttendance();
      }
    };

    document.addEventListener(
      'visibilitychange',
      handleVisibility
    );

    return () => {
      document.removeEventListener(
        'visibilitychange',
        handleVisibility
      );
    };
  }, [refetchOwnAttendance]);

  /* ==========================================================
   * AUTH LOADING
   * ========================================================== */

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

  /* ==========================================================
   * DASHBOARD LOADING
   * ========================================================== */

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

  /* ==========================================================
   * TODAY'S OWN ATTENDANCE
   *
   * Backend source:
   * GET /api/v1/attendance/my-history
   *
   * We ONLY display what backend returned.
   * ========================================================== */

  const attendance =
    findTodaysAttendance(
      ownAttendanceData
    );

  /* ==========================================================
   * HR DASHBOARD
   * ========================================================== */

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

  /* ==========================================================
   * MANAGER DASHBOARD
   *
   * BACKEND RESPONSE:
   *
   * ManagerDashboardResponse(
   *     teamSize,
   *     teamPresentToday,
   *     pendingApprovals,
   *     goals,
   *     performanceReviews
   * )
   *
   * Therefore use those exact fields.
   * ========================================================== */

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

        <AttendanceStatus
          attendance={attendance}
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {/* ==================================================
              TEAM SIZE
              
              DIRECTLY FROM:
              DashboardService.managerDashboard()

              employeeRepository.findAll()
                .filter(employee ->
                    employee.getManager().getId()
                        .equals(managerEmployeeId)
                )
                .count();

              If two employees are assigned to this manager,
              backend returns teamSize = 2.
             ================================================== */}

          <StatCard
            label="Team size"
            value={data.teamSize ?? 0}
            hint="Employees reporting to you"
          />

          <StatCard
            label="Present today"
            value={
              data.teamPresentToday ?? 0
            }
            hint="Team members present today"
          />

          <StatCard
            label="Pending approvals"
            value={
              data.pendingApprovals ?? 0
            }
            hint="Requests awaiting action"
          />

          <StatCard
            label="Goals"
            value={
              data.goals ?? 0
            }
            hint="Goals assigned to your team"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className={cardClass}>
            <p className="text-sm text-gray-500">
              Performance reviews
            </p>

            <p className="mt-4 text-3xl font-semibold text-gray-900">
              {data.performanceReviews ??
                0}
            </p>

            <p className="mt-2 text-sm text-gray-500">
              Reviews assigned to you
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ==========================================================
   * EMPLOYEE DASHBOARD
   *
   * NO TEAM SIZE HERE.
   * ========================================================== */

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
                : data.attendanceRecords ??
                  data.attendance ??
                  0
            }
            hint="Your attendance records"
          />

          <StatCard
            label="Leave balance"
            value={
              data.leaveBalance ?? 0
            }
            hint="Available leave"
          />

          <StatCard
            label="Payroll records"
            value={
              data.payrollRecords ?? 0
            }
            hint="Your payroll records"
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