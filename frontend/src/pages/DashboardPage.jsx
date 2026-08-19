import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

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

/*
 * ============================================================
 * ATTENDANCE STATUS + CHECK-IN / CHECK-OUT BUTTONS
 *
 * IMPORTANT:
 *
 * Check-in and check-out are now 100% MANUAL.
 *
 * - Login/logout no longer touch attendance at all.
 * - The timer only starts after the user clicks "Check In".
 * - The timer only stops after the user confirms "Check Out".
 *
 * Backend is still the source of truth for checkInAt/checkOutAt;
 * this component just renders it and triggers the two manual
 * endpoints:
 *
 *   POST /api/v1/attendance/my/check-in
 *   POST /api/v1/attendance/my/check-out
 * ============================================================
 */
function AttendanceStatus({
  attendance,
  onCheckIn,
  onCheckOut,
  isCheckingIn,
  isCheckingOut,
}) {
  const [now, setNow] = useState(Date.now());
  const [showConfirmCheckOut, setShowConfirmCheckOut] =
    useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const state = useMemo(() => {
    /*
     * NO BACKEND ATTENDANCE RECORD FOR TODAY YET
     *
     * Do not start timer. "Check In" button is shown.
     */
    if (!attendance) {
      return {
        status: 'ABSENT',
        checkIn: null,
        checkOut: null,
        workedMinutes: 0,
        elapsedMilliseconds: 0,
        remainingMilliseconds: 8 * 60 * 60 * 1000,
        progress: 0,
        checkedIn: false,
        checkedOut: false,
      };
    }

    const status = getAttendanceStatus(attendance);

    const checkInValue =
      attendance.checkInAt ??
      attendance.checkInTime ??
      null;

    const checkOutValue =
      attendance.checkOutAt ??
      attendance.checkOutTime ??
      null;

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

    /*
     * TIMER STARTS ONLY IF THE USER HAS CLICKED
     * "Check In" (i.e. backend has checkInAt).
     */
    const checkedIn = Boolean(validCheckIn);

    const checkedOut = Boolean(validCheckOut);

    let elapsedMilliseconds = 0;

    let workedMinutes =
      attendance.workedMinutes ?? null;

    /*
     * ----------------------------------------------------------
     * CURRENT SESSION: checked in, not yet checked out.
     * ----------------------------------------------------------
     */
    if (checkedIn && !checkedOut) {
      elapsedMilliseconds = Math.max(
        0,
        now - checkIn.getTime()
      );

      workedMinutes = Math.floor(
        elapsedMilliseconds / 60000
      );
    }

    /*
     * ----------------------------------------------------------
     * CHECKED OUT: freeze timer at backend's worked time.
     * ----------------------------------------------------------
     */
    if (checkedIn && checkedOut) {
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
      checkIn: validCheckIn ? checkIn : null,
      checkOut: validCheckOut ? checkOut : null,
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

  /*
   * Single check-in / single check-out per day.
   *
   * "Check In" is only available when there is no check-in yet
   * today. Once checked in, only "Check Out" is available. Once
   * checked out, NEITHER button is shown again for the rest of
   * the day — the day is closed out. Both buttons reappear
   * naturally tomorrow once /my/today returns null again.
   */
  const canCheckIn = !state.checkedIn;

  const canCheckOut =
    state.checkedIn && !state.checkedOut;

  const handleCheckInClick = () => {
    if (!canCheckIn || isCheckingIn) {
      return;
    }

    onCheckIn();
  };

  const handleCheckOutClick = () => {
    if (!canCheckOut || isCheckingOut) {
      return;
    }

    setShowConfirmCheckOut(true);
  };

  const handleConfirmCheckOut = () => {
    setShowConfirmCheckOut(false);
    onCheckOut();
  };

  const handleCancelCheckOut = () => {
    setShowConfirmCheckOut(false);
  };

  return (
    <div className={cardClass}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">
            Today's attendance
          </p>

          <p className="mt-1 text-xl font-semibold text-purple-700">
            {heading}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div
            className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClasses(
              state.status
            )}`}
          >
            {getStatusLabel(state.status)}
          </div>

          {canCheckIn && (
            <button
              type="button"
              onClick={handleCheckInClick}
              disabled={isCheckingIn}
              className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm shadow-emerald-200 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isCheckingIn ? 'Checking in...' : 'Check In'}
            </button>
          )}

          {canCheckOut && (
            <button
              type="button"
              onClick={handleCheckOutClick}
              disabled={isCheckingOut}
              className="rounded-xl bg-rose-600 px-5 py-2 text-sm font-semibold text-white shadow-sm shadow-rose-200 transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isCheckingOut ? 'Checking out...' : 'Check Out'}
            </button>
          )}
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
        Check-in and check-out are triggered only when you click
        the buttons above.
      </p>

      {/* ---------------------------------------------------------- */}
      {/* CONFIRM CHECK-OUT DIALOG                                    */}
      {/* ---------------------------------------------------------- */}
      {showConfirmCheckOut && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <p className="text-lg font-semibold text-gray-900">
              Confirm check-out
            </p>

            <p className="mt-2 text-sm text-gray-500">
              Are you sure you want to check out? Your timer will
              stop and today's attendance will be finalized.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCancelCheckOut}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmCheckOut}
                disabled={isCheckingOut}
                className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isCheckingOut ? 'Checking out...' : 'Yes, check out'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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

export default function DashboardPage() {
  const {
    user,
    loading: authLoading,
  } = useAuth();

  const queryClient = useQueryClient();

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
   * DASHBOARD
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
   * TODAY'S ATTENDANCE (single source of truth for the timer)
   *
   * Uses GET /api/v1/attendance/my/today, which returns:
   *   - null if the user hasn't checked in yet today
   *   - the record with checkInAt (and checkOutAt once checked out)
   *
   * This does NOT create attendance. It only reads it. Attendance
   * is only ever created/updated by clicking Check In / Check Out.
   * ============================================================
   */
  const attendanceQueryKey = [
    'attendance-today',
    role,
    employeeId,
  ];

  const {
    data: todayAttendance,
  } = useQuery({
    queryKey: attendanceQueryKey,

    queryFn: async () => {
      try {
        const response = await api.get(
          '/api/v1/attendance/my/today'
        );

        return response.data?.data ?? null;
      } catch (attendanceError) {
        console.warn(
          "Today's attendance unavailable:",
          attendanceError
        );

        return null;
      }
    },

    enabled:
      !authLoading &&
      Boolean(user) &&
      Boolean(role),

    // Keep the record fresh, but the live timer itself is driven
    // by a local 1-second interval inside AttendanceStatus.
    refetchInterval: 30000,

    retry: false,
  });

  /*
   * ============================================================
   * MANUAL CHECK-IN
   * ============================================================
   */
  const checkInMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(
        '/api/v1/attendance/my/check-in'
      );

      return response.data?.data ?? null;
    },

    onSuccess: (attendance) => {
      queryClient.setQueryData(
        attendanceQueryKey,
        attendance
      );

      queryClient.invalidateQueries({
        queryKey: attendanceQueryKey,
      });

      queryClient.invalidateQueries({
        queryKey: ['dashboard', role, employeeId],
      });
    },
  });

  /*
   * ============================================================
   * MANUAL CHECK-OUT
   * ============================================================
   */
  const checkOutMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(
        '/api/v1/attendance/my/check-out'
      );

      return response.data?.data ?? null;
    },

    onSuccess: (attendance) => {
      queryClient.setQueryData(
        attendanceQueryKey,
        attendance
      );

      queryClient.invalidateQueries({
        queryKey: attendanceQueryKey,
      });

      queryClient.invalidateQueries({
        queryKey: ['dashboard', role, employeeId],
      });
    },
  });

  /*
   * ============================================================
   * AUTH
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
   * ATTENDANCE
   *
   * /my/today is preferred. Dashboard payload is fallback only
   * (e.g. before the first refetch completes).
   * ============================================================
   */
  const dashboardAttendance =
    extractAttendance(data);

  const attendance =
    todayAttendance ??
    dashboardAttendance ??
    null;

  const attendanceButtonProps = {
    attendance,
    onCheckIn: () => checkInMutation.mutate(),
    onCheckOut: () => checkOutMutation.mutate(),
    isCheckingIn: checkInMutation.isPending,
    isCheckingOut: checkOutMutation.isPending,
  };

  /*
   * ============================================================
   * HR
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

        <AttendanceStatus {...attendanceButtonProps} />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total employees"
            value={data.totalEmployees}
            hint="All registered employees"
          />

          <StatCard
            label="Active employees"
            value={data.activeEmployees}
            hint="Currently active records"
          />

          <StatCard
            label="Present today"
            value={data.presentToday}
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
                  {data.employeesOnLeave ?? 0}
                </p>
              </div>

              <div>
                <p className="text-gray-500">
                  Pending leave
                </p>

                <p className="text-2xl font-semibold text-gray-900">
                  {data.pendingLeave ?? 0}
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
   * MANAGER
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

        <AttendanceStatus {...attendanceButtonProps} />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Team size"
            value={data.teamSize}
            hint="Employees assigned to you"
          />

          <StatCard
            label="Present today"
            value={data.teamPresentToday}
            hint="Your team members present today"
          />

          <StatCard
            label="Pending approvals"
            value={data.pendingApprovals}
            hint="Leave requests awaiting action"
          />

          <StatCard
            label="Goals"
            value={data.goals}
            hint="Goals assigned to your team"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className={cardClass}>
            <p className="text-sm text-gray-500">
              Performance reviews
            </p>

            <p className="mt-4 text-3xl font-semibold text-gray-900">
              {data.performanceReviews ?? 0}
            </p>

            <p className="mt-2 text-sm text-gray-500">
              Reviews managed by you
            </p>
          </div>
        </div>
      </div>
    );
  }

  /*
   * ============================================================
   * EMPLOYEE
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

        <AttendanceStatus {...attendanceButtonProps} />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Attendance"
            value={
              data.attendancePercentage != null
                ? `${data.attendancePercentage}%`
                : data.attendanceRecords ?? 0
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
            hint="Available payroll records"
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