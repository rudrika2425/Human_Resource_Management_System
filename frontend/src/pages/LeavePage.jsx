import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '../services/api';
import Spinner from '../components/Spinner';
import ErrorState from '../components/ErrorState';
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

function getEmployeeId(user) {
  if (!user) return null;

  const employeeId =
    user.employeeId ??
    user.employee?.id ??
    user.employee?.employeeId ??
    user.profile?.employeeId ??
    user.employeeProfile?.id ??
    user.employeeProfile?.employeeId ??
    user.idEmployee ??
    null;

  return employeeId != null ? Number(employeeId) : null;
}

function getUserId(user) {
  if (!user) return null;

  return user.id ?? user.userId ?? null;
}

function formatDate(date) {
  if (!date) return '—';

  return new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function calculateDays(startDate, endDate) {
  if (!startDate || !endDate) return 0;

  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  const difference =
    Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;

  return difference > 0 ? difference : 0;
}

function getEmployeeName(row) {
  return (
    row?.employeeName ||
    row?.name ||
    `${row?.firstName || ''} ${row?.lastName || ''}`.trim() ||
    `Employee #${row?.employeeId ?? '—'}`
  );
}

const LEAVE_TYPES = [
  'CASUAL',
  'SICK',
  'ANNUAL',
  'MATERNITY',
  'PATERNITY',
  'UNPAID',
];

const LEAVE_TYPE_LABELS = {
  CASUAL: 'Casual Leave',
  SICK: 'Sick Leave',
  ANNUAL: 'Annual Leave',
  MATERNITY: 'Maternity Leave',
  PATERNITY: 'Paternity Leave',
  UNPAID: 'Unpaid Leave',
};

const LEAVE_TYPE_DESCRIPTIONS = {
  CASUAL: 'For personal or short-term needs.',
  SICK: 'For illness or medical recovery.',
  ANNUAL: 'For planned vacations or personal time.',
  MATERNITY: 'Maternity-related leave.',
  PATERNITY: 'Paternity-related leave.',
  UNPAID: 'Leave without paid entitlement.',
};

const STATUS_CLASSES = {
  PENDING: 'border-amber-200 bg-amber-50 text-amber-700',
  APPROVED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  REJECTED: 'border-rose-200 bg-rose-50 text-rose-700',
  CANCELLED: 'border-slate-200 bg-slate-50 text-slate-500',
};

function LeaveStatus({ status }) {
  if (!status) {
    return <span className="text-gray-400">—</span>;
  }

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${
        STATUS_CLASSES[status] ||
        'border-slate-200 bg-slate-50 text-slate-500'
      }`}
    >
      {String(status).replaceAll('_', ' ')}
    </span>
  );
}

function StatCard({ label, value, description }) {
  return (
    <div className="rounded-2xl border border-purple-100 bg-white p-5 shadow-sm shadow-purple-100/50">
      <p className="text-sm text-gray-500">{label}</p>

      <div className="mt-3 text-3xl font-semibold tracking-tight text-gray-900">
        {value}
      </div>

      {description ? (
        <p className="mt-1 text-sm text-gray-400">{description}</p>
      ) : null}
    </div>
  );
}

function BalanceCard({ balance, leaveType }) {
  const total = Number(balance?.availableDays ?? 12);
  const used = Number(balance?.usedDays ?? 0);

  const remaining =
    balance?.remainingDays != null
      ? Number(balance.remainingDays)
      : Math.max(0, total - used);

  const percentage =
    total > 0
      ? Math.min(100, Math.round((remaining / total) * 100))
      : 0;

  return (
    <div className="rounded-2xl border border-purple-100 bg-white p-5 shadow-sm shadow-purple-100/50 transition hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-medium text-gray-900">
            {LEAVE_TYPE_LABELS[leaveType]}
          </h3>

          <p className="mt-1 text-xs text-gray-400">
            {LEAVE_TYPE_DESCRIPTIONS[leaveType]}
          </p>
        </div>

        <span className="rounded-lg border border-purple-100 bg-purple-50 px-2 py-1 text-[10px] font-medium tracking-wide text-purple-600">
          {leaveType}
        </span>
      </div>

      <div className="mt-6 flex items-end justify-between">
        <div>
          <p className="text-3xl font-semibold text-gray-900">
            {remaining}
          </p>

          <p className="mt-1 text-xs text-gray-400">
            days remaining
          </p>
        </div>

        <div className="text-right text-xs text-gray-500">
          <p>Used: {used}</p>
          <p>Total: {total}</p>
        </div>
      </div>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-purple-100">
        <div
          className="h-full rounded-full bg-purple-500 transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function ApprovalModal({
  request,
  remarks,
  setRemarks,
  loading,
  onClose,
  onConfirm,
}) {
  if (!request) return null;

  const isApprove = request.action === 'approve';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-purple-100 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-black/10 p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-purple-400">
              Leave Request
            </p>

            <h2 className="mt-2 text-xl font-semibold text-gray-900">
              {isApprove ? 'Approve Leave' : 'Reject Leave'}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-purple-100 bg-purple-50 text-purple-500 transition hover:bg-purple-100 hover:text-purple-700"
          >
            ×
          </button>
        </div>

        <div className="space-y-5 p-6">
          <div className="rounded-xl border border-purple-100 bg-purple-50/40 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium text-gray-900">
                  {getEmployeeName(request)}
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  Employee ID: {request.employeeId ?? '—'}
                </p>
              </div>

              <LeaveStatus status={request.status} />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-400">Leave Type</p>

                <p className="mt-1 text-gray-700">
                  {LEAVE_TYPE_LABELS[request.leaveType] ||
                    request.leaveType}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-400">Duration</p>

                <p className="mt-1 text-gray-700">
                  {calculateDays(
                    request.startDate,
                    request.endDate
                  )}{' '}
                  days
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-400">Start Date</p>

                <p className="mt-1 text-gray-700">
                  {formatDate(request.startDate)}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-400">End Date</p>

                <p className="mt-1 text-gray-700">
                  {formatDate(request.endDate)}
                </p>
              </div>
            </div>

            {request.reason && (
              <div className="mt-4 border-t border-black/10 pt-4">
                <p className="text-xs text-gray-400">Reason</p>

                <p className="mt-1 text-sm leading-6 text-gray-600">
                  {request.reason}
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Remarks
            </label>

            <textarea
              value={remarks}
              onChange={(event) => setRemarks(event.target.value)}
              rows={4}
              placeholder={
                isApprove
                  ? 'Enter approval remarks...'
                  : 'Enter reason for rejection...'
              }
              className="w-full resize-none rounded-xl border border-purple-100 bg-purple-50/40 px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 transition focus:border-purple-300 focus:bg-white"
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-purple-100 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-purple-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={loading || !remarks.trim()}
              className={`rounded-xl px-5 py-2.5 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-40 ${
                isApprove
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {loading
                ? 'Processing...'
                : isApprove
                  ? 'Approve Leave'
                  : 'Reject Leave'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LeavePage() {
  const { user: authUser } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('overview');

  const [form, setForm] = useState({
    leaveType: 'CASUAL',
    startDate: '',
    endDate: '',
    reason: '',
  });

  const [search, setSearch] = useState('');

  const [actionRequest, setActionRequest] = useState(null);
  const [remarks, setRemarks] = useState('');

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
  const employeeId = getEmployeeId(user);
  const userId = getUserId(user);

  const isEmployee = role === 'EMPLOYEE';
  const isHr = role === 'HR';
  const isManager = role === 'MANAGER';

  const canApprove = isHr || isManager;

  const {
    data: historyResponse,
    isLoading: historyLoading,
    error: historyError,
  } = useQuery({
    queryKey: ['leave-history', employeeId],
    queryFn: async () => {
      const response = await api.get(
        `/api/v1/leaves/history/${employeeId}`
      );

      return response.data?.data ?? [];
    },
    enabled:
      Boolean(employeeId) &&
      (isEmployee || isManager),
  });

  const history = Array.isArray(historyResponse)
    ? historyResponse
    : [];

  const {
    data: balanceResponse,
    isLoading: balanceLoading,
    error: balanceError,
  } = useQuery({
    queryKey: ['leave-balances', employeeId],
    queryFn: async () => {
      const responses = await Promise.all(
        LEAVE_TYPES.map(async (leaveType) => {
          try {
            const response = await api.get(
              `/api/v1/leaves/balance/${employeeId}`,
              {
                params: {
                  leaveType,
                },
              }
            );

            return response.data?.data ?? null;
          } catch (error) {
            console.error(
              `Unable to load ${leaveType} balance`,
              error
            );

            return null;
          }
        })
      );

      return responses.filter(Boolean);
    },
    enabled:
      Boolean(employeeId) &&
      (isEmployee || isManager),
  });

  const balances = Array.isArray(balanceResponse)
    ? balanceResponse
    : [];

  const {
    data: teamLeaveResponse,
    isLoading: teamLeaveLoading,
    error: teamLeaveError,
  } = useQuery({
    queryKey: ['team-leaves'],
    queryFn: async () => {
      const response = await api.get(
        '/api/v1/leaves/team'
      );

      return response.data?.data ?? [];
    },
    enabled: isManager,
  });

  const teamLeaves = Array.isArray(teamLeaveResponse)
    ? teamLeaveResponse
    : [];

  const {
    data: pendingResponse,
    isLoading: pendingLoading,
    error: pendingError,
  } = useQuery({
    queryKey: ['pending-leaves'],
    queryFn: async () => {
      const response = await api.get(
        '/api/v1/leaves/pending'
      );

      return response.data?.data ?? [];
    },
    enabled: canApprove,
  });

  const pendingLeaves = Array.isArray(pendingResponse)
    ? pendingResponse
    : [];

  const applyMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await api.post(
        '/api/v1/leaves',
        payload
      );

      return response.data;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['leave-history', employeeId],
      });

      queryClient.invalidateQueries({
        queryKey: ['leave-balances', employeeId],
      });

      queryClient.invalidateQueries({
        queryKey: ['team-leaves'],
      });

      queryClient.invalidateQueries({
        queryKey: ['pending-leaves'],
      });

      setForm({
        leaveType: 'CASUAL',
        startDate: '',
        endDate: '',
        reason: '',
      });

      setActiveTab('history');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (leaveId) => {
      const response = await api.post(
        `/api/v1/leaves/${leaveId}/cancel`
      );

      return response.data;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['leave-history', employeeId],
      });

      queryClient.invalidateQueries({
        queryKey: ['leave-balances', employeeId],
      });

      queryClient.invalidateQueries({
        queryKey: ['team-leaves'],
      });

      queryClient.invalidateQueries({
        queryKey: ['pending-leaves'],
      });
    },
  });

  const actionMutation = useMutation({
    mutationFn: async ({ id, action, remarks }) => {
      const response = await api.post(
        `/api/v1/leaves/${id}/${action}`,
        {
          remarks: remarks.trim(),
          approverId: userId,
        }
      );

      return response.data;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['pending-leaves'],
      });

      queryClient.invalidateQueries({
        queryKey: ['leave-history'],
      });

      queryClient.invalidateQueries({
        queryKey: ['team-leaves'],
      });

      queryClient.invalidateQueries({
        queryKey: ['leave-balances'],
      });

      setActionRequest(null);
      setRemarks('');
    },
  });

  const handleApply = (event) => {
    event.preventDefault();

    if (!employeeId) return;

    if (!form.startDate || !form.endDate) return;

    if (
      new Date(`${form.startDate}T00:00:00`) >
      new Date(`${form.endDate}T00:00:00`)
    ) {
      return;
    }

    applyMutation.mutate({
      employeeId,
      leaveType: form.leaveType,
      startDate: form.startDate,
      endDate: form.endDate,
      reason: form.reason.trim() || null,
    });
  };

  const statistics = useMemo(() => {
    const pending = history.filter(
      (item) => item.status === 'PENDING'
    ).length;

    const approved = history.filter(
      (item) => item.status === 'APPROVED'
    ).length;

    const rejected = history.filter(
      (item) => item.status === 'REJECTED'
    ).length;

    const cancelled = history.filter(
      (item) => item.status === 'CANCELLED'
    ).length;

    return {
      pending,
      approved,
      rejected,
      cancelled,
    };
  }, [history]);

  const teamStatistics = useMemo(() => {
    const pending = teamLeaves.filter(
      (item) => item.status === 'PENDING'
    ).length;

    const approved = teamLeaves.filter(
      (item) => item.status === 'APPROVED'
    ).length;

    const rejected = teamLeaves.filter(
      (item) => item.status === 'REJECTED'
    ).length;

    const cancelled = teamLeaves.filter(
      (item) => item.status === 'CANCELLED'
    ).length;

    return {
      pending,
      approved,
      rejected,
      cancelled,
    };
  }, [teamLeaves]);

  const totalRemaining = useMemo(() => {
    return balances.reduce((total, balance) => {
      const available = Number(
        balance?.availableDays ?? 0
      );

      const used = Number(
        balance?.usedDays ?? 0
      );

      return total + Math.max(0, available - used);
    }, 0);
  }, [balances]);

  const filteredPendingLeaves = useMemo(() => {
    if (!search.trim()) {
      return pendingLeaves;
    }

    const keyword = search.toLowerCase();

    return pendingLeaves.filter((leave) => {
      const employeeName =
        getEmployeeName(leave).toLowerCase();

      const employeeIdText =
        String(leave.employeeId ?? '').toLowerCase();

      const leaveType =
        String(leave.leaveType ?? '').toLowerCase();

      const reason =
        String(leave.reason ?? '').toLowerCase();

      return (
        employeeName.includes(keyword) ||
        employeeIdText.includes(keyword) ||
        leaveType.includes(keyword) ||
        reason.includes(keyword)
      );
    });
  }, [pendingLeaves, search]);

  const filteredTeamLeaves = useMemo(() => {
    if (!search.trim()) {
      return teamLeaves;
    }

    const keyword = search.toLowerCase();

    return teamLeaves.filter((leave) => {
      const employeeName =
        getEmployeeName(leave).toLowerCase();

      const employeeIdText =
        String(leave.employeeId ?? '').toLowerCase();

      const leaveType =
        String(leave.leaveType ?? '').toLowerCase();

      const status =
        String(leave.status ?? '').toLowerCase();

      return (
        employeeName.includes(keyword) ||
        employeeIdText.includes(keyword) ||
        leaveType.includes(keyword) ||
        status.includes(keyword)
      );
    });
  }, [teamLeaves, search]);

  if (meLoading) {
    return (
      <Spinner label="Loading user information..." />
    );
  }

  if (meError) {
    return (
      <ErrorState
        description="Unable to load your account information."
      />
    );
  }

  if (!role) {
    return (
      <ErrorState
        description="Unable to determine your account role."
      />
    );
  }

  if (
    (isEmployee || isManager) &&
    !employeeId
  ) {
    return (
      <ErrorState
        description="Employee ID was not found for your account."
      />
    );
  }

  if (
    historyLoading ||
    balanceLoading ||
    (isManager && teamLeaveLoading)
  ) {
    return (
      <Spinner label="Loading leave information..." />
    );
  }

  if (historyError || balanceError) {
    return (
      <ErrorState
        description="Unable to load leave information."
      />
    );
  }

  return (
    <>
      <div className="min-h-screen space-y-6 bg-gradient-to-b from-purple-50 via-[#F8F6FC] to-purple-50 p-4 md:p-6">

        {/* Header */}
        <div className="flex flex-col justify-between gap-4 border-b border-black/10 pb-5 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-purple-500">
              Workforce
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900">
              Leave Management
            </h1>

            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              {isHr
                ? 'Manage employee leave requests, balances and approvals across the organization.'
                : isManager
                  ? 'Review team leave requests and monitor leave activity.'
                  : 'Apply for leave, monitor your requests and view your leave balance.'}
            </p>
          </div>

          {canApprove && (
            <div className="rounded-xl border border-purple-100 bg-white px-4 py-3 shadow-sm shadow-purple-100/50">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-purple-400">
                Pending Requests
              </p>

              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {pendingLeaves.length}
              </p>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto rounded-2xl border border-purple-100 bg-white p-2 shadow-sm shadow-purple-100/50">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition ${
              activeTab === 'overview'
                ? 'bg-purple-600 text-white'
                : 'text-gray-500 hover:bg-purple-50 hover:text-gray-900'
            }`}
          >
            Overview
          </button>

          {(isEmployee || isManager) && (
            <button
              type="button"
              onClick={() => setActiveTab('apply')}
              className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                activeTab === 'apply'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-500 hover:bg-purple-50 hover:text-gray-900'
              }`}
            >
              Apply Leave
            </button>
          )}

          {(isEmployee || isManager) && (
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                activeTab === 'history'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-500 hover:bg-purple-50 hover:text-gray-900'
              }`}
            >
              History
            </button>
          )}

          {isManager && (
            <button
              type="button"
              onClick={() => setActiveTab('team-history')}
              className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                activeTab === 'team-history'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-500 hover:bg-purple-50 hover:text-gray-900'
              }`}
            >
              Team History
            </button>
          )}

          {canApprove && (
            <button
              type="button"
              onClick={() => setActiveTab('approvals')}
              className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                activeTab === 'approvals'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-500 hover:bg-purple-50 hover:text-gray-900'
              }`}
            >
              Approvals

              {pendingLeaves.length > 0 && (
                <span className="ml-2 rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                  {pendingLeaves.length}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-6">

            <div>
              <h3 className="mb-3 text-sm font-semibold text-gray-700">
                My Leave Summary
              </h3>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  label="My Available Leaves"
                  value={totalRemaining}
                  description="Days remaining"
                />

                <StatCard
                  label="My Pending"
                  value={statistics.pending}
                  description="Awaiting approval"
                />

                <StatCard
                  label="My Approved"
                  value={statistics.approved}
                  description="Approved requests"
                />

                <StatCard
                  label="My Cancelled"
                  value={statistics.cancelled}
                  description="Cancelled requests"
                />
              </div>
            </div>

            {isManager && (
              <div>
                <h3 className="mb-3 text-sm font-semibold text-gray-700">
                  Team Leave Summary
                </h3>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <StatCard
                    label="Team Pending"
                    value={teamStatistics.pending}
                    description="Awaiting approval"
                  />

                  <StatCard
                    label="Team Approved"
                    value={teamStatistics.approved}
                    description="Approved requests"
                  />

                  <StatCard
                    label="Team Rejected"
                    value={teamStatistics.rejected}
                    description="Rejected requests"
                  />

                  <StatCard
                    label="Team Cancelled"
                    value={teamStatistics.cancelled}
                    description="Cancelled requests"
                  />
                </div>
              </div>
            )}

            <section>
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Leave Balance
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Your current leave entitlement by type.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {LEAVE_TYPES.map((leaveType) => {
                  const balance = balances.find(
                    (item) =>
                      String(
                        item?.leaveType ?? ''
                      ).toUpperCase() === leaveType
                  );

                  return (
                    <BalanceCard
                      key={leaveType}
                      leaveType={leaveType}
                      balance={balance}
                    />
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {/* Apply Leave */}
        {activeTab === 'apply' &&
          (isEmployee || isManager) && (
            <section className="rounded-2xl border border-purple-100 bg-white shadow-sm shadow-purple-100/50">
              <div className="border-b border-black/10 px-5 py-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-400">
                  New Request
                </p>

                <h2 className="mt-1 text-lg font-semibold text-gray-900">
                  Apply for Leave
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Submit your leave request for manager or HR approval.
                </p>
              </div>

              <form
                onSubmit={handleApply}
                className="space-y-6 p-5"
              >
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-600">
                      Leave Type
                    </label>

                    <select
                      value={form.leaveType}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          leaveType: event.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-purple-100 bg-purple-50/40 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-purple-300 focus:bg-white"
                    >
                      {LEAVE_TYPES.map((type) => (
                        <option
                          key={type}
                          value={type}
                        >
                          {LEAVE_TYPE_LABELS[type]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div />

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-600">
                      Start Date
                    </label>

                    <input
                      type="date"
                      value={form.startDate}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          startDate: event.target.value,
                        }))
                      }
                      required
                      className="w-full rounded-xl border border-purple-100 bg-purple-50/40 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-purple-300 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-600">
                      End Date
                    </label>

                    <input
                      type="date"
                      value={form.endDate}
                      min={form.startDate || undefined}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          endDate: event.target.value,
                        }))
                      }
                      required
                      className="w-full rounded-xl border border-purple-100 bg-purple-50/40 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-purple-300 focus:bg-white"
                    />
                  </div>
                </div>

                {form.startDate && form.endDate && (
                  <div className="rounded-xl border border-purple-100 bg-purple-50/60 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-purple-400">
                      Requested Duration
                    </p>

                    <p className="mt-1 text-2xl font-semibold text-gray-900">
                      {calculateDays(
                        form.startDate,
                        form.endDate
                      )}{' '}
                      days
                    </p>
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-600">
                    Reason
                  </label>

                  <textarea
                    value={form.reason}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        reason: event.target.value,
                      }))
                    }
                    rows={5}
                    placeholder="Enter the reason for your leave..."
                    className="w-full resize-none rounded-xl border border-purple-100 bg-purple-50/40 px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 transition focus:border-purple-300 focus:bg-white"
                  />
                </div>

                {applyMutation.error && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                    {applyMutation.error?.response?.data?.message ||
                      'Unable to submit leave request.'}
                  </div>
                )}

                <div className="flex justify-end border-t border-black/10 pt-5">
                  <button
                    type="submit"
                    disabled={applyMutation.isPending}
                    className="rounded-xl bg-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-purple-200 transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {applyMutation.isPending
                      ? 'Submitting...'
                      : 'Submit Request'}
                  </button>
                </div>
              </form>
            </section>
          )}

        {/* Personal History */}
        {activeTab === 'history' &&
          (isEmployee || isManager) && (
            <section className="overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-sm shadow-purple-100/50">
              <div className="flex flex-col justify-between gap-2 border-b border-black/10 px-5 py-5 md:flex-row md:items-center">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-400">
                    Leave Records
                  </p>

                  <h2 className="mt-1 text-lg font-semibold text-gray-900">
                    My Leave History
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Review your previous and current leave requests.
                  </p>
                </div>

                <span className="text-sm font-medium text-gray-500">
                  {history.length} request
                  {history.length !== 1 ? 's' : ''}
                </span>
              </div>

              {!history.length ? (
                <div className="p-10 text-center">
                  <p className="text-sm text-gray-500">
                    No leave records found.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-purple-100 text-sm">
                    <thead className="bg-purple-50 text-left text-gray-900">
                      <tr>
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.15em]">
                          Leave
                        </th>

                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.15em]">
                          Dates
                        </th>

                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.15em]">
                          Days
                        </th>

                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.15em]">
                          Status
                        </th>

                        <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-[0.15em]">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-purple-100">
                      {history.map((leave) => (
                        <tr
                          key={leave.id}
                          className="transition hover:bg-purple-50/60"
                        >
                          <td className="px-5 py-4">
                            <p className="font-medium text-gray-900">
                              {LEAVE_TYPE_LABELS[
                                leave.leaveType
                              ] || leave.leaveType}
                            </p>

                            <p className="mt-1 max-w-xs truncate text-xs text-gray-400">
                              {leave.reason ||
                                'No reason provided'}
                            </p>
                          </td>

                          <td className="px-5 py-4 text-gray-600">
                            {formatDate(leave.startDate)}
                            {' — '}
                            {formatDate(leave.endDate)}
                          </td>

                          <td className="px-5 py-4 text-gray-600">
                            {calculateDays(
                              leave.startDate,
                              leave.endDate
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <LeaveStatus
                              status={leave.status}
                            />
                          </td>

                          <td className="px-5 py-4 text-right">
                            {(leave.status === 'PENDING' ||
                              leave.status === 'APPROVED') && (
                              <button
                                type="button"
                                onClick={() =>
                                  cancelMutation.mutate(
                                    leave.id
                                  )
                                }
                                disabled={
                                  cancelMutation.isPending
                                }
                                className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600 transition hover:bg-rose-100 disabled:opacity-40"
                              >
                                {cancelMutation.isPending
                                  ? 'Cancelling...'
                                  : 'Cancel'}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

        {/* Team History */}
        {activeTab === 'team-history' &&
          isManager && (
            <section className="overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-sm shadow-purple-100/50">
              <div className="flex flex-col justify-between gap-2 border-b border-black/10 px-5 py-5 md:flex-row md:items-center">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-400">
                    Team Records
                  </p>

                  <h2 className="mt-1 text-lg font-semibold text-gray-900">
                    Team Leave History
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Review all leave requests from your team members.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative w-full md:max-w-xs">
                    <input
                      type="text"
                      value={search}
                      onChange={(event) =>
                        setSearch(event.target.value)
                      }
                      placeholder="Search employee or leave..."
                      className="w-full rounded-xl border border-purple-100 bg-purple-50/40 px-4 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-400 transition focus:border-purple-300 focus:bg-white"
                    />
                  </div>

                  <span className="whitespace-nowrap text-sm font-medium text-gray-500">
                    {filteredTeamLeaves.length} request
                    {filteredTeamLeaves.length !== 1
                      ? 's'
                      : ''}
                  </span>
                </div>
              </div>

              {teamLeaveError ? (
                <div className="p-6">
                  <ErrorState
                    description="Unable to load team leave history."
                  />
                </div>
              ) : !filteredTeamLeaves.length ? (
                <div className="p-10 text-center">
                  <p className="text-sm text-gray-500">
                    No team leave records found.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-purple-100 text-sm">
                    <thead className="bg-purple-50 text-left text-gray-900">
                      <tr>
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.15em]">
                          Employee
                        </th>

                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.15em]">
                          Leave Type
                        </th>

                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.15em]">
                          Dates
                        </th>

                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.15em]">
                          Days
                        </th>

                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.15em]">
                          Reason
                        </th>

                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.15em]">
                          Status
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-purple-100">
                      {filteredTeamLeaves.map((leave) => (
                        <tr
                          key={leave.id}
                          className="transition hover:bg-purple-50/60"
                        >
                          <td className="px-5 py-4">
                            <p className="font-medium text-gray-900">
                              {getEmployeeName(leave)}
                            </p>

                            <p className="mt-1 text-xs text-gray-400">
                              ID: {leave.employeeId ?? '—'}
                            </p>
                          </td>

                          <td className="px-5 py-4 text-gray-700">
                            {LEAVE_TYPE_LABELS[
                              leave.leaveType
                            ] || leave.leaveType}
                          </td>

                          <td className="px-5 py-4 text-gray-600">
                            {formatDate(leave.startDate)}
                            {' — '}
                            {formatDate(leave.endDate)}
                          </td>

                          <td className="px-5 py-4 text-gray-600">
                            {calculateDays(
                              leave.startDate,
                              leave.endDate
                            )}
                          </td>

                          <td className="max-w-xs px-5 py-4">
                            <p className="truncate text-gray-500">
                              {leave.reason || '—'}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <LeaveStatus
                              status={leave.status}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

        {/* Approvals */}
        {activeTab === 'approvals' &&
          canApprove && (
            <section className="overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-sm shadow-purple-100/50">
              <div className="border-b border-black/10 px-5 py-5">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-400">
                      Management
                    </p>

                    <h2 className="mt-1 text-lg font-semibold text-gray-900">
                      Leave Approvals
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                      Review pending leave requests from employees.
                    </p>
                  </div>

                  <div className="relative w-full md:max-w-xs">
                    <input
                      type="text"
                      value={search}
                      onChange={(event) =>
                        setSearch(event.target.value)
                      }
                      placeholder="Search employee or leave..."
                      className="w-full rounded-xl border border-purple-100 bg-purple-50/40 px-4 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-400 transition focus:border-purple-300 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {pendingError ? (
                <div className="p-6">
                  <ErrorState
                    description="Unable to load pending leave requests."
                  />
                </div>
              ) : pendingLoading ? (
                <div className="p-10">
                  <Spinner label="Loading pending requests..." />
                </div>
              ) : !filteredPendingLeaves.length ? (
                <div className="p-10 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700">
                    ✓
                  </div>

                  <p className="mt-4 font-medium text-gray-900">
                    No pending requests
                  </p>

                  <p className="mt-1 text-sm text-gray-400">
                    All leave requests have been processed.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-[1050px] divide-y divide-purple-100 text-sm">
                    <thead className="bg-purple-50 text-left text-gray-900">
                      <tr>
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.15em]">
                          Employee
                        </th>

                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.15em]">
                          Leave Type
                        </th>

                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.15em]">
                          Dates
                        </th>

                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.15em]">
                          Days
                        </th>

                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.15em]">
                          Reason
                        </th>

                        <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-[0.15em]">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-purple-100">
                      {filteredPendingLeaves.map((leave) => (
                        <tr
                          key={leave.id}
                          className="transition hover:bg-purple-50/60"
                        >
                          <td className="px-5 py-4">
                            <p className="font-medium text-gray-900">
                              {getEmployeeName(leave)}
                            </p>

                            <p className="mt-1 text-xs text-gray-400">
                              ID: {leave.employeeId ?? '—'}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <p className="text-gray-700">
                              {LEAVE_TYPE_LABELS[
                                leave.leaveType
                              ] || leave.leaveType}
                            </p>
                          </td>

                          <td className="px-5 py-4 text-gray-600">
                            {formatDate(leave.startDate)}
                            {' — '}
                            {formatDate(leave.endDate)}
                          </td>

                          <td className="px-5 py-4 text-gray-600">
                            {calculateDays(
                              leave.startDate,
                              leave.endDate
                            )}
                          </td>

                          <td className="max-w-xs px-5 py-4">
                            <p className="truncate text-gray-500">
                              {leave.reason || '—'}
                            </p>
                          </td>

                          <td className="px-5 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setActionRequest({
                                    ...leave,
                                    action: 'approve',
                                  });

                                  setRemarks('');
                                }}
                                className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100"
                              >
                                Approve
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setActionRequest({
                                    ...leave,
                                    action: 'reject',
                                  });

                                  setRemarks('');
                                }}
                                className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600 transition hover:bg-rose-100"
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
      </div>

      <ApprovalModal
        request={actionRequest}
        remarks={remarks}
        setRemarks={setRemarks}
        loading={actionMutation.isPending}
        onClose={() => {
          setActionRequest(null);
          setRemarks('');
        }}
        onConfirm={() => {
          if (!actionRequest || !remarks.trim()) {
            return;
          }

          actionMutation.mutate({
            id: actionRequest.id,
            action: actionRequest.action,
            remarks: remarks.trim(),
          });
        }}
      />
    </>
  );
}