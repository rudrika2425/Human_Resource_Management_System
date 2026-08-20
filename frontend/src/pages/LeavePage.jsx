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
  'UNPAID',
];

const LEAVE_TYPE_LABELS = {
  CASUAL: 'Casual Leave',
  SICK: 'Sick Leave',
  ANNUAL: 'Annual Leave',
  UNPAID: 'Unpaid Leave',
};

const LEAVE_TYPE_DESCRIPTIONS = {
  CASUAL: 'For personal or short-term needs.',
  SICK: 'For illness or medical recovery.',
  ANNUAL: 'For planned vacations or personal time.',
  UNPAID: 'Leave without paid entitlement.',
};

const STATUS_CLASSES = {
  PENDING: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400',
  APPROVED: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400',
  REJECTED: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400',
  CANCELLED: 'border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-500/30 dark:bg-slate-500/10 dark:text-slate-400',
};

function LeaveStatus({ status }) {
  if (!status) {
    return <span className="text-gray-400 dark:text-gray-500">—</span>;
  }

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${
        STATUS_CLASSES[status] ||
        'border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-500/30 dark:bg-slate-500/10 dark:text-slate-400'
      }`}
    >
      {String(status).replaceAll('_', ' ')}
    </span>
  );
}

function StatCard({ label, value, description }) {
  return (
    <div className="rounded-2xl border border-purple-100 bg-white p-4 sm:p-5 shadow-sm shadow-purple-100/50 dark:border-gray-800 dark:bg-gray-900 dark:shadow-black/30">
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>

      <div className="mt-3 text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
        {value}
      </div>

      {description ? (
        <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">{description}</p>
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
    <div className="rounded-2xl border border-purple-100 bg-white p-4 sm:p-5 shadow-sm shadow-purple-100/50 transition hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:shadow-black/30 dark:hover:shadow-black/40">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-medium text-gray-900 dark:text-gray-100">
            {LEAVE_TYPE_LABELS[leaveType]}
          </h3>

          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            {LEAVE_TYPE_DESCRIPTIONS[leaveType]}
          </p>
        </div>

        <span className="shrink-0 rounded-lg border border-purple-100 bg-purple-50 px-2 py-1 text-[10px] font-medium tracking-wide text-purple-600 dark:border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-300">
          {leaveType}
        </span>
      </div>

      <div className="mt-6 flex items-end justify-between">
        <div>
          <p className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-gray-100">
            {remaining}
          </p>

          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            days remaining
          </p>
        </div>

        <div className="text-right text-xs text-gray-500 dark:text-gray-400">
          <p>Used: {used}</p>
          <p>Total: {total}</p>
        </div>
      </div>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-purple-100 dark:bg-gray-800">
        <div
          className="h-full rounded-full bg-purple-500 transition-all dark:bg-purple-500"
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
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-purple-100 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-start justify-between border-b border-black/10 p-4 sm:p-6 dark:border-white/10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-purple-400 dark:text-purple-400">
              Leave Request
            </p>

            <h2 className="mt-2 text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">
              {isApprove ? 'Approve Leave' : 'Reject Leave'}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-purple-100 bg-purple-50 text-purple-500 transition hover:bg-purple-100 hover:text-purple-700 dark:border-gray-700 dark:bg-gray-800 dark:text-purple-400 dark:hover:bg-gray-700 dark:hover:text-purple-300"
          >
            ×
          </button>
        </div>

        <div className="space-y-5 p-4 sm:p-6">
          <div className="rounded-xl border border-purple-100 bg-purple-50/40 p-4 dark:border-gray-700 dark:bg-gray-800/60">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {getEmployeeName(request)}
                </p>

                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                  Employee ID: {request.employeeId ?? '—'}
                </p>
              </div>

              <LeaveStatus status={request.status} />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500">Leave Type</p>

                <p className="mt-1 text-gray-700 dark:text-gray-300">
                  {LEAVE_TYPE_LABELS[request.leaveType] ||
                    request.leaveType}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500">Duration</p>

                <p className="mt-1 text-gray-700 dark:text-gray-300">
                  {calculateDays(
                    request.startDate,
                    request.endDate
                  )}{' '}
                  days
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500">Start Date</p>

                <p className="mt-1 text-gray-700 dark:text-gray-300">
                  {formatDate(request.startDate)}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500">End Date</p>

                <p className="mt-1 text-gray-700 dark:text-gray-300">
                  {formatDate(request.endDate)}
                </p>
              </div>
            </div>

            {request.reason && (
              <div className="mt-4 border-t border-black/10 pt-4 dark:border-white/10">
                <p className="text-xs text-gray-400 dark:text-gray-500">Reason</p>

                <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-300">
                  {request.reason}
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
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
              className="w-full resize-none rounded-xl border border-purple-100 bg-purple-50/40 px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 transition focus:border-purple-300 focus:bg-white dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-purple-500 dark:focus:bg-gray-800"
            />
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-purple-100 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-purple-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={loading || !remarks.trim()}
              className={`rounded-xl px-5 py-2.5 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-40 ${
                isApprove
                  ? 'bg-emerald-600 hover:bg-emerald-700 dark:hover:bg-emerald-500'
                  : 'bg-rose-600 hover:bg-rose-700 dark:hover:bg-rose-500'
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
  const canApply = isEmployee || isManager || isHr;

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
    enabled: Boolean(employeeId) && canApply,
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
    enabled: Boolean(employeeId) && canApply,
  });

  const balances = Array.isArray(balanceResponse)
    ? balanceResponse
    : [];

  const {
    data: managerInfo,
    isLoading: managerInfoLoading,
  } = useQuery({
    queryKey: ['reporting-manager', employeeId],
    queryFn: async () => {
      const response = await api.get(
        `/api/v1/employees/${employeeId}/manager`
      );

      return response.data?.data ?? null;
    },
    enabled: Boolean(employeeId) && canApply,
  });

  const hasManager = Boolean(managerInfo?.managerId);

 const {
  data: teamLeaveResponse,
  isLoading: teamLeaveLoading,
  error: teamLeaveError,
} = useQuery({
  queryKey: ['team-leaves', employeeId],
  queryFn: async () => {
    const response = await api.get('/api/v1/leaves/team', {
      params: { managerId: employeeId },
    });
    return response.data?.data ?? [];
  },
  enabled: isManager && Boolean(employeeId),
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

    if (!employeeId || !hasManager) return;

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

  if (canApply && !employeeId) {
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
      <div className="min-h-screen space-y-6 bg-gradient-to-b from-purple-50 via-[#F8F6FC] to-purple-50 p-4 md:p-6 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">

        {/* Header */}
        <div className="flex flex-col justify-between gap-4 border-b border-black/10 pb-5 md:flex-row md:items-end dark:border-white/10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-purple-500 dark:text-purple-400">
              Workforce
            </p>

            <h1 className="mt-1 text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Leave Management
            </h1>

            <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
              {isHr
                ? 'Manage employee leave requests, balances and approvals across the organization.'
                : isManager
                  ? 'Review team leave requests and monitor leave activity.'
                  : 'Apply for leave, monitor your requests and view your leave balance.'}
            </p>
          </div>

          {canApprove && (
            <div className="rounded-xl border border-purple-100 bg-white px-4 py-3 shadow-sm shadow-purple-100/50 dark:border-gray-800 dark:bg-gray-900 dark:shadow-black/30">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-purple-400 dark:text-purple-400">
                Pending Requests
              </p>

              <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">
                {pendingLeaves.length}
              </p>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto rounded-2xl border border-purple-100 bg-white p-2 shadow-sm shadow-purple-100/50 dark:border-gray-800 dark:bg-gray-900 dark:shadow-black/30">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`shrink-0 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition ${
              activeTab === 'overview'
                ? 'bg-purple-600 text-white'
                : 'text-gray-500 hover:bg-purple-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100'
            }`}
          >
            Overview
          </button>

          {canApply && (
            <button
              type="button"
              onClick={() => setActiveTab('apply')}
              className={`shrink-0 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                activeTab === 'apply'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-500 hover:bg-purple-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100'
              }`}
            >
              Apply Leave
            </button>
          )}

          {canApply && (
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`shrink-0 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                activeTab === 'history'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-500 hover:bg-purple-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100'
              }`}
            >
              History
            </button>
          )}

          {isManager && (
            <button
              type="button"
              onClick={() => setActiveTab('team-history')}
              className={`shrink-0 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                activeTab === 'team-history'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-500 hover:bg-purple-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100'
              }`}
            >
              Team History
            </button>
          )}

          {canApprove && (
            <button
              type="button"
              onClick={() => setActiveTab('approvals')}
              className={`shrink-0 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                activeTab === 'approvals'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-500 hover:bg-purple-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100'
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
              <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
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
                <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
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
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Leave Balance
                </h2>

                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
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
        {activeTab === 'apply' && canApply && (
            <section className="rounded-2xl border border-purple-100 bg-white shadow-sm shadow-purple-100/50 dark:border-gray-800 dark:bg-gray-900 dark:shadow-black/30">
              <div className="border-b border-black/10 px-4 py-5 sm:px-5 dark:border-white/10">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-400 dark:text-purple-400">
                  New Request
                </p>

                <h2 className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Apply for Leave
                </h2>

                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Submit your leave request for manager or HR approval.
                </p>
              </div>

              <div className="px-4 pt-5 sm:px-5">
                {managerInfoLoading ? (
                  <div className="rounded-xl border border-purple-100 bg-purple-50/40 p-4 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-400">
                    Checking your reporting manager...
                  </div>
                ) : hasManager ? (
                  <div className="rounded-xl border border-purple-100 bg-purple-50/40 p-4 dark:border-gray-700 dark:bg-gray-800/60">
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-purple-400 dark:text-purple-400">
                      Reporting Manager
                    </p>
                    <p className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">
                      {managerInfo.managerName}
                    </p>
                    <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                      Your request will be routed to this manager for approval.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-500/30 dark:bg-rose-500/10">
                    <p className="text-sm font-semibold text-rose-700 dark:text-rose-400">
                      No manager assigned
                    </p>
                    <p className="mt-1 text-sm text-rose-600 dark:text-rose-400">
                      You don't have a manager assigned yet. Please contact HR to get a
                      manager assigned before applying for leave.
                    </p>
                  </div>
                )}
              </div>

              <form
                onSubmit={handleApply}
                className="space-y-6 p-4 sm:p-5"
              >
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">
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
                      className="w-full rounded-xl border border-purple-100 bg-purple-50/40 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-purple-300 focus:bg-white dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-100 dark:focus:border-purple-500 dark:focus:bg-gray-800"
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
                    <label className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">
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
                      className="w-full rounded-xl border border-purple-100 bg-purple-50/40 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-purple-300 focus:bg-white dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-100 dark:focus:border-purple-500 dark:focus:bg-gray-800 dark:[color-scheme:dark]"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">
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
                      className="w-full rounded-xl border border-purple-100 bg-purple-50/40 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-purple-300 focus:bg-white dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-100 dark:focus:border-purple-500 dark:focus:bg-gray-800 dark:[color-scheme:dark]"
                    />
                  </div>
                </div>

                {form.startDate && form.endDate && (
                  <div className="rounded-xl border border-purple-100 bg-purple-50/60 p-4 dark:border-gray-700 dark:bg-gray-800/60">
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-purple-400 dark:text-purple-400">
                      Requested Duration
                    </p>

                    <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">
                      {calculateDays(
                        form.startDate,
                        form.endDate
                      )}{' '}
                      days
                    </p>
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">
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
                    className="w-full resize-none rounded-xl border border-purple-100 bg-purple-50/40 px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 transition focus:border-purple-300 focus:bg-white dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-purple-500 dark:focus:bg-gray-800"
                  />
                </div>

                {applyMutation.error && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">
                    {applyMutation.error?.response?.data?.message ||
                      'Unable to submit leave request.'}
                  </div>
                )}

                <div className="flex justify-end border-t border-black/10 pt-5 dark:border-white/10">
                  <button
                    type="submit"
                    disabled={applyMutation.isPending || managerInfoLoading || !hasManager}
                    className="w-full sm:w-auto rounded-xl bg-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-purple-200 transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-40 dark:shadow-black/30 dark:hover:bg-purple-500"
                  >
                    {applyMutation.isPending
                      ? 'Submitting...'
                      : !hasManager
                        ? 'No manager assigned'
                        : 'Submit Request'}
                  </button>
                </div>
              </form>
            </section>
          )}

        {/* Personal History */}
        {activeTab === 'history' && canApply && (
            <section className="overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-sm shadow-purple-100/50 dark:border-gray-800 dark:bg-gray-900 dark:shadow-black/30">
              <div className="flex flex-col justify-between gap-2 border-b border-black/10 px-4 py-5 sm:px-5 md:flex-row md:items-center dark:border-white/10">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-400 dark:text-purple-400">
                    Leave Records
                  </p>

                  <h2 className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
                    My Leave History
                  </h2>

                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Review your previous and current leave requests.
                  </p>
                </div>

                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {history.length} request
                  {history.length !== 1 ? 's' : ''}
                </span>
              </div>

              {!history.length ? (
                <div className="p-10 text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No leave records found.
                  </p>
                </div>
              ) : (
                <>
                  {/* Desktop table */}
                  <div className="hidden overflow-x-auto sm:block">
                    <table className="min-w-full divide-y divide-purple-100 text-sm dark:divide-gray-800">
                      <thead className="bg-purple-50 text-left text-gray-900 dark:bg-gray-800/60 dark:text-gray-100">
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

                      <tbody className="divide-y divide-purple-100 dark:divide-gray-800">
                        {history.map((leave) => (
                          <tr
                            key={leave.id}
                            className="transition hover:bg-purple-50/60 dark:hover:bg-gray-800/50"
                          >
                            <td className="px-5 py-4">
                              <p className="font-medium text-gray-900 dark:text-gray-100">
                                {LEAVE_TYPE_LABELS[
                                  leave.leaveType
                                ] || leave.leaveType}
                              </p>

                              <p className="mt-1 max-w-xs truncate text-xs text-gray-400 dark:text-gray-500">
                                {leave.reason ||
                                  'No reason provided'}
                              </p>
                            </td>

                            <td className="px-5 py-4 text-gray-600 dark:text-gray-300">
                              {formatDate(leave.startDate)}
                              {' — '}
                              {formatDate(leave.endDate)}
                            </td>

                            <td className="px-5 py-4 text-gray-600 dark:text-gray-300">
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
                                  className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600 transition hover:bg-rose-100 disabled:opacity-40 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20"
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

                  {/* Mobile cards */}
                  <div className="space-y-3 p-4 sm:hidden">
                    {history.map((leave) => (
                      <div
                        key={leave.id}
                        className="rounded-xl border border-purple-100 bg-purple-50/30 p-4 dark:border-gray-700 dark:bg-gray-800/40"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {LEAVE_TYPE_LABELS[leave.leaveType] || leave.leaveType}
                            </p>
                            <p className="mt-1 truncate text-xs text-gray-400 dark:text-gray-500">
                              {leave.reason || 'No reason provided'}
                            </p>
                          </div>
                          <LeaveStatus status={leave.status} />
                        </div>

                        <div className="mt-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                          <span>
                            {formatDate(leave.startDate)} — {formatDate(leave.endDate)}
                          </span>
                          <span>{calculateDays(leave.startDate, leave.endDate)} days</span>
                        </div>

                        {(leave.status === 'PENDING' || leave.status === 'APPROVED') && (
                          <button
                            type="button"
                            onClick={() => cancelMutation.mutate(leave.id)}
                            disabled={cancelMutation.isPending}
                            className="mt-3 w-full rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600 transition hover:bg-rose-100 disabled:opacity-40 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20"
                          >
                            {cancelMutation.isPending ? 'Cancelling...' : 'Cancel'}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </section>
          )}

        {/* Team History */}
        {activeTab === 'team-history' &&
          isManager && (
            <section className="overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-sm shadow-purple-100/50 dark:border-gray-800 dark:bg-gray-900 dark:shadow-black/30">
              <div className="flex flex-col justify-between gap-3 border-b border-black/10 px-4 py-5 sm:px-5 md:flex-row md:items-center dark:border-white/10">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-400 dark:text-purple-400">
                    Team Records
                  </p>

                  <h2 className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Team Leave History
                  </h2>

                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Review all leave requests from your team members.
                  </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                  <div className="relative w-full md:max-w-xs">
                    <input
                      type="text"
                      value={search}
                      onChange={(event) =>
                        setSearch(event.target.value)
                      }
                      placeholder="Search employee or leave..."
                      className="w-full rounded-xl border border-purple-100 bg-purple-50/40 px-4 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-400 transition focus:border-purple-300 focus:bg-white dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-purple-500 dark:focus:bg-gray-800"
                    />
                  </div>

                  <span className="whitespace-nowrap text-sm font-medium text-gray-500 dark:text-gray-400">
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
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No team leave records found.
                  </p>
                </div>
              ) : (
                <>
                  {/* Desktop table */}
                  <div className="hidden overflow-x-auto sm:block">
                    <table className="min-w-full divide-y divide-purple-100 text-sm dark:divide-gray-800">
                      <thead className="bg-purple-50 text-left text-gray-900 dark:bg-gray-800/60 dark:text-gray-100">
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

                      <tbody className="divide-y divide-purple-100 dark:divide-gray-800">
                        {filteredTeamLeaves.map((leave) => (
                          <tr
                            key={leave.id}
                            className="transition hover:bg-purple-50/60 dark:hover:bg-gray-800/50"
                          >
                            <td className="px-5 py-4">
                              <p className="font-medium text-gray-900 dark:text-gray-100">
                                {getEmployeeName(leave)}
                              </p>

                              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                                ID: {leave.employeeId ?? '—'}
                              </p>
                            </td>

                            <td className="px-5 py-4 text-gray-700 dark:text-gray-300">
                              {LEAVE_TYPE_LABELS[
                                leave.leaveType
                              ] || leave.leaveType}
                            </td>

                            <td className="px-5 py-4 text-gray-600 dark:text-gray-300">
                              {formatDate(leave.startDate)}
                              {' — '}
                              {formatDate(leave.endDate)}
                            </td>

                            <td className="px-5 py-4 text-gray-600 dark:text-gray-300">
                              {calculateDays(
                                leave.startDate,
                                leave.endDate
                              )}
                            </td>

                            <td className="max-w-xs px-5 py-4">
                              <p className="truncate text-gray-500 dark:text-gray-400">
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

                  {/* Mobile cards */}
                  <div className="space-y-3 p-4 sm:hidden">
                    {filteredTeamLeaves.map((leave) => (
                      <div
                        key={leave.id}
                        className="rounded-xl border border-purple-100 bg-purple-50/30 p-4 dark:border-gray-700 dark:bg-gray-800/40"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {getEmployeeName(leave)}
                            </p>
                            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                              ID: {leave.employeeId ?? '—'} • {LEAVE_TYPE_LABELS[leave.leaveType] || leave.leaveType}
                            </p>
                          </div>
                          <LeaveStatus status={leave.status} />
                        </div>

                        <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(leave.startDate)} — {formatDate(leave.endDate)} · {calculateDays(leave.startDate, leave.endDate)} days
                        </div>

                        {leave.reason && (
                          <p className="mt-2 truncate text-xs text-gray-500 dark:text-gray-400">
                            {leave.reason}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </section>
          )}

        {/* Approvals */}
        {activeTab === 'approvals' &&
          canApprove && (
            <section className="overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-sm shadow-purple-100/50 dark:border-gray-800 dark:bg-gray-900 dark:shadow-black/30">
              <div className="border-b border-black/10 px-4 py-5 sm:px-5 dark:border-white/10">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-400 dark:text-purple-400">
                      Management
                    </p>

                    <h2 className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Leave Approvals
                    </h2>

                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
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
                      className="w-full rounded-xl border border-purple-100 bg-purple-50/40 px-4 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-400 transition focus:border-purple-300 focus:bg-white dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-purple-500 dark:focus:bg-gray-800"
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
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400">
                    ✓
                  </div>

                  <p className="mt-4 font-medium text-gray-900 dark:text-gray-100">
                    No pending requests
                  </p>

                  <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
                    All leave requests have been processed.
                  </p>
                </div>
              ) : (
                <>
                  {/* Desktop table */}
                  <div className="hidden overflow-x-auto sm:block">
                    <table className="min-w-[1050px] divide-y divide-purple-100 text-sm dark:divide-gray-800">
                      <thead className="bg-purple-50 text-left text-gray-900 dark:bg-gray-800/60 dark:text-gray-100">
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

                      <tbody className="divide-y divide-purple-100 dark:divide-gray-800">
                        {filteredPendingLeaves.map((leave) => (
                          <tr
                            key={leave.id}
                            className="transition hover:bg-purple-50/60 dark:hover:bg-gray-800/50"
                          >
                            <td className="px-5 py-4">
                              <p className="font-medium text-gray-900 dark:text-gray-100">
                                {getEmployeeName(leave)}
                              </p>

                              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                                ID: {leave.employeeId ?? '—'}
                              </p>
                            </td>

                            <td className="px-5 py-4">
                              <p className="text-gray-700 dark:text-gray-300">
                                {LEAVE_TYPE_LABELS[
                                  leave.leaveType
                                ] || leave.leaveType}
                              </p>
                            </td>

                            <td className="px-5 py-4 text-gray-600 dark:text-gray-300">
                              {formatDate(leave.startDate)}
                              {' — '}
                              {formatDate(leave.endDate)}
                            </td>

                            <td className="px-5 py-4 text-gray-600 dark:text-gray-300">
                              {calculateDays(
                                leave.startDate,
                                leave.endDate
                              )}
                            </td>

                            <td className="max-w-xs px-5 py-4">
                              <p className="truncate text-gray-500 dark:text-gray-400">
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
                                  className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20"
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
                                  className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600 transition hover:bg-rose-100 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20"
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

                  {/* Mobile cards */}
                  <div className="space-y-3 p-4 sm:hidden">
                    {filteredPendingLeaves.map((leave) => (
                      <div
                        key={leave.id}
                        className="rounded-xl border border-purple-100 bg-purple-50/30 p-4 dark:border-gray-700 dark:bg-gray-800/40"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {getEmployeeName(leave)}
                          </p>
                          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                            ID: {leave.employeeId ?? '—'} • {LEAVE_TYPE_LABELS[leave.leaveType] || leave.leaveType}
                          </p>
                        </div>

                        <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(leave.startDate)} — {formatDate(leave.endDate)} · {calculateDays(leave.startDate, leave.endDate)} days
                        </div>

                        {leave.reason && (
                          <p className="mt-2 truncate text-xs text-gray-500 dark:text-gray-400">
                            {leave.reason}
                          </p>
                        )}

                        <div className="mt-3 flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setActionRequest({ ...leave, action: 'approve' });
                              setRemarks('');
                            }}
                            className="flex-1 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20"
                          >
                            Approve
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setActionRequest({ ...leave, action: 'reject' });
                              setRemarks('');
                            }}
                            className="flex-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600 transition hover:bg-rose-100 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
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