import { useState } from 'react';
import {
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';

import {
  Target,
  Plus,
  Edit3,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

import { api } from '../services/api';

const cardClass =
  'rounded-2xl border border-purple-100 bg-white shadow-sm shadow-purple-100/50 dark:border-gray-800 dark:bg-gray-900 dark:shadow-black/30';

const inputClass =
  'relative z-[9999] w-full rounded-xl border border-purple-100 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm transition placeholder:text-gray-300 focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-100 cursor-pointer dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-purple-500 dark:focus:ring-purple-500/20';

const primaryButtonClass =
  'rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-purple-200 transition hover:bg-purple-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 dark:shadow-black/30 dark:hover:bg-purple-500';

/* =========================================================
   HELPERS
========================================================= */

function getActualEmployeeId(employee) {
  if (!employee) return null;

  return (
    employee.id ??
    employee.employee?.id ??
    employee.employee?.employeeId ??
    null
  );
}

function getEmployeeCode(employee) {
  if (!employee) return '—';

  return (
    employee.employeeId ??
    employee.employee_id ??
    '—'
  );
}

function getEmployeeName(employee) {
  if (!employee) return '—';

  const fullName =
    `${employee.firstName || ''} ${employee.lastName || ''}`.trim();

  return (
    employee.employeeName ||
    employee.name ||
    fullName ||
    `Employee #${
      getActualEmployeeId(employee) ?? '—'
    }`
  );
}

function formatDate(date) {
  if (!date) return '—';

  const parsedDate = new Date(
    `${date}T00:00:00`
  );

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return parsedDate.toLocaleDateString(
    'en-IN',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }
  );
}

/* =========================================================
   BADGES
========================================================= */

function StatusBadge({ status }) {
  const classes = {
    OPEN: 'border-blue-100 bg-blue-50 text-blue-600 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400',
    IN_PROGRESS:
      'border-amber-100 bg-amber-50 text-amber-600 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400',
    COMPLETED:
      'border-emerald-100 bg-emerald-50 text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400',
    CANCELLED:
      'border-rose-100 bg-rose-50 text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400',
  };

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${
        classes[status] ||
        'border-purple-100 bg-purple-50 text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400'
      }`}
    >
      {String(status || '—').replaceAll(
        '_',
        ' '
      )}
    </span>
  );
}

function PriorityBadge({ priority }) {
  const classes = {
    LOW: 'border-purple-100 bg-purple-50 text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400',
    MEDIUM:
      'border-blue-100 bg-blue-50 text-blue-600 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400',
    HIGH:
      'border-orange-100 bg-orange-50 text-orange-600 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-400',
    URGENT:
      'border-rose-100 bg-rose-50 text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400',
  };

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${
        classes[priority] ||
        'border-purple-100 bg-purple-50 text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400'
      }`}
    >
      {priority || '—'}
    </span>
  );
}

/* =========================================================
   STATUS MODAL
========================================================= */

function UpdateGoalStatusModal({
  goal,
  newStatus,
  setNewStatus,
  loading,
  onClose,
  onConfirm,
}) {
  if (!goal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-purple-100 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900 dark:shadow-black/50">

        <div className="flex items-start justify-between border-b border-black/10 p-6 dark:border-white/10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-purple-400 dark:text-purple-400">
              Update Status
            </p>

            <h2 className="mt-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
              Update Goal Status
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-purple-100 bg-purple-50 text-purple-500 transition hover:bg-purple-100 hover:text-purple-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-purple-400 dark:hover:bg-gray-700 dark:hover:text-purple-300"
          >
            ×
          </button>
        </div>

        <div className="space-y-5 p-6">

          <div className="rounded-xl border border-purple-100 bg-purple-50/40 p-4 dark:border-gray-700 dark:bg-gray-800/60">
            <p className="font-medium text-gray-900 dark:text-gray-100">
              {goal.title || 'Untitled Goal'}
            </p>

            {goal.target ? (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Target: {goal.target}
              </p>
            ) : null}

            <div className="mt-3 flex items-center gap-3">
              <span className="text-xs text-gray-400 dark:text-gray-500">
                Current:
              </span>

              <StatusBadge status={goal.status} />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              New Status
            </label>

            <select
              value={newStatus}
              onChange={(event) =>
                setNewStatus(
                  event.target.value
                )
              }
              className={inputClass}
              disabled={loading}
            >
              <option value="OPEN">
                Open
              </option>

              <option value="IN_PROGRESS">
                In Progress
              </option>

              <option value="COMPLETED">
                Completed
              </option>

              <option value="CANCELLED">
                Cancelled
              </option>
            </select>
          </div>

          <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-purple-100 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={
                loading ||
                !newStatus ||
                newStatus === goal.status
              }
              className="rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-purple-500"
            >
              {loading
                ? 'Updating...'
                : 'Update Status'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   EMPTY FORM
========================================================= */

const emptyGoal = {
  title: '',
  description: '',
  target: '',
  dueDate: '',
  priority: 'MEDIUM',
  status: 'OPEN',
  employeeId: '',
  managerId: '',
};

/* =========================================================
   COMPONENT
========================================================= */

export default function Goals({
  mode,
  isHr,
  isManager,
  isEmployee,
  canManage,
  employeeOptions,
  managerOptions,
  managerTeamEmployeeIds,
  currentEmployee,
  currentManagerEmployeeId,
  goals,
  onSuccess,
  onError,
}) {
  const queryClient = useQueryClient();

  const [goalForm, setGoalForm] =
    useState(emptyGoal);

  const [updatingGoal, setUpdatingGoal] =
    useState(null);

  const [newGoalStatus, setNewGoalStatus] =
    useState('');

  /* =======================================================
     CREATE GOAL
  ======================================================= */

  const createGoalMutation =
    useMutation({
      mutationFn: async (payload) => {
        console.log(
          'FINAL GOAL PAYLOAD SENT TO BACKEND:',
          payload
        );

        const response = await api.post(
          '/api/v1/goals',
          payload
        );

        return response.data;
      },

      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ['performance-goals'],
        });

        setGoalForm({
          ...emptyGoal,
        });

        onSuccess(
          'Goal created successfully.'
        );
      },

      onError: (error) => {
        console.error(
          'CREATE GOAL ERROR:',
          error?.response?.data || error
        );

        onError(
          error?.response?.data?.message ||
            error?.response?.data?.error ||
            'Unable to create goal.'
        );
      },
    });

  /* =======================================================
     UPDATE STATUS
  ======================================================= */

  const updateGoalStatusMutation =
    useMutation({
      mutationFn: async ({
        goalId,
        status,
      }) => {
        const response = await api.patch(
          `/api/v1/goals/${goalId}/status`,
          {
            status,
          }
        );

        return response.data;
      },

      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ['performance-goals'],
        });

        onSuccess(
          'Goal status updated successfully.'
        );

        setUpdatingGoal(null);
        setNewGoalStatus('');
      },

      onError: (error) => {
        onError(
          error?.response?.data?.message ||
            error?.response?.data?.error ||
            'Unable to update goal status.'
        );
      },
    });

  /* =======================================================
     SUBMIT
  ======================================================= */

  const handleGoalSubmit = (event) => {
    event.preventDefault();

    if (!canManage) return;

    if (
      !goalForm.title.trim() ||
      !goalForm.target.trim() ||
      !goalForm.dueDate
    ) {
      onError(
        'Please complete all required goal fields.'
      );
      return;
    }

    const employeeIdNum = Number(
      goalForm.employeeId
    );

    if (
      !Number.isInteger(employeeIdNum) ||
      employeeIdNum <= 0
    ) {
      onError(
        'Please select a valid employee.'
      );
      return;
    }

    const managerIdValue = isManager
      ? currentManagerEmployeeId
      : goalForm.managerId;

    const managerIdNum = Number(
      managerIdValue
    );

    if (
      !Number.isInteger(managerIdNum) ||
      managerIdNum <= 0
    ) {
      onError(
        'Please select a valid manager.'
      );
      return;
    }

    if (isManager) {
      const selectedEmployeeIsInTeam =
        managerTeamEmployeeIds.has(
          String(employeeIdNum)
        );

      if (!selectedEmployeeIsInTeam) {
        onError(
          'You can create goals only for employees in your team.'
        );
        return;
      }

      if (!currentManagerEmployeeId) {
        onError(
          'Unable to determine your manager employee ID.'
        );
        return;
      }
    }

    const payload = {
      title: goalForm.title.trim(),

      description:
        goalForm.description.trim() || null,

      target: goalForm.target.trim(),

      dueDate: goalForm.dueDate,

      priority: goalForm.priority,

      status: goalForm.status,

      employeeId: employeeIdNum,

      managerId: managerIdNum,
    };

    console.log(
      'FINAL GOAL PAYLOAD:',
      payload
    );

    createGoalMutation.mutate(payload);
  };

  /* =======================================================
     STATUS HANDLERS
  ======================================================= */

  const handleUpdateGoalStatus = (goal) => {
    if (!goal) return;

    setUpdatingGoal(goal);

    setNewGoalStatus(
      String(
        goal.status || 'OPEN'
      ).toUpperCase()
    );
  };

  const handleConfirmStatusUpdate = () => {
    if (
      !updatingGoal?.id ||
      !newGoalStatus
    ) {
      return;
    }

    updateGoalStatusMutation.mutate({
      goalId: updatingGoal.id,
      status: newGoalStatus,
    });
  };

  const handleCloseStatusModal = () => {
    if (
      updateGoalStatusMutation.isPending
    ) {
      return;
    }

    setUpdatingGoal(null);
    setNewGoalStatus('');
  };

  /* =======================================================
     CREATE GOAL PAGE
  ======================================================= */

  if (mode === 'create-goal') {
    return (
      <section className={cardClass}>

        <div className="flex items-center gap-2.5 border-b border-purple-100 px-5 py-5 dark:border-gray-800">
          <Plus
            size={16}
            className="text-purple-500 dark:text-purple-400"
          />

          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-gray-400 dark:text-gray-500">
              New Objective
            </p>

            <h2 className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
              Create Performance Goal
            </h2>

            <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
              {isManager
                ? 'Assign a measurable goal to an employee in your team.'
                : 'Assign a measurable goal to an employee.'}
            </p>
          </div>
        </div>

        <form
          onSubmit={handleGoalSubmit}
          className="space-y-6 p-4 sm:p-5"
        >

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

            {}

            <div>
              <label className="mb-2 block text-sm text-gray-600 dark:text-gray-400">
                Goal Title
              </label>

              <input
                type="text"
                value={goalForm.title}
                onChange={(event) =>
                  setGoalForm(
                    (current) => ({
                      ...current,
                      title:
                        event.target.value,
                    })
                  )
                }
                className={inputClass}
                placeholder="Improve project delivery"
                required
              />
            </div>

            {}

            <div>
              <label className="mb-2 block text-sm text-gray-600 dark:text-gray-400">
                Target
              </label>

              <input
                type="text"
                value={goalForm.target}
                onChange={(event) =>
                  setGoalForm(
                    (current) => ({
                      ...current,
                      target:
                        event.target.value,
                    })
                  )
                }
                className={inputClass}
                placeholder="Complete 95% tasks on time"
                required
              />
            </div>

            {}

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm text-gray-600 dark:text-gray-400">
                Description
              </label>

              <textarea
                rows={4}
                value={
                  goalForm.description
                }
                onChange={(event) =>
                  setGoalForm(
                    (current) => ({
                      ...current,
                      description:
                        event.target.value,
                    })
                  )
                }
                className={`${inputClass} resize-none`}
                placeholder="Describe the objective..."
              />
            </div>

            {}

            <div>
              <label className="mb-2 block text-sm text-gray-600 dark:text-gray-400">
                {isManager
                  ? 'Team Employee'
                  : 'Employee'}
              </label>

              <select
                value={
                  goalForm.employeeId ?? ''
                }
                onChange={(event) =>
                  setGoalForm(
                    (current) => ({
                      ...current,
                      employeeId:
                        event.target.value,
                    })
                  )
                }
                className={inputClass}
                required
              >
                <option value="">
                  Select employee
                </option>

                {employeeOptions.map(
                  (employee) => {
                    const employeeId =
                      getActualEmployeeId(
                        employee
                      );

                    if (
                      employeeId === null ||
                      employeeId === undefined
                    ) {
                      return null;
                    }

                    return (
                      <option
                        key={String(
                          employeeId
                        )}
                        value={String(
                          employeeId
                        )}
                      >
                        {getEmployeeCode(
                          employee
                        )}{' '}
                        —{' '}
                        {getEmployeeName(
                          employee
                        )}
                      </option>
                    );
                  }
                )}
              </select>

              {employeeOptions.length ===
                0 && (
                <p className="mt-1.5 text-xs text-rose-500 dark:text-rose-400">
                  {isManager
                    ? 'No employees are currently assigned to your team.'
                    : 'No employees with EMPLOYEE role found.'}
                </p>
              )}
            </div>

            {}

            <div>
              <label className="mb-2 block text-sm text-gray-600 dark:text-gray-400">
                Manager
              </label>

              {isManager ? (
                <>
                  <input
                    type="text"
                    value={
                      currentEmployee
                        ? `${getEmployeeCode(
                            currentEmployee
                          )} — ${getEmployeeName(
                            currentEmployee
                          )}`
                        : 'Current Manager'
                    }
                    className={`${inputClass} bg-gray-50 dark:bg-gray-800`}
                    readOnly
                  />

                  <p className="mt-1.5 text-xs text-purple-500 dark:text-purple-400">
                    Goals created by you are automatically assigned to you as manager.
                  </p>
                </>
              ) : (
                <select
                  value={
                    goalForm.managerId ?? ''
                  }
                  onChange={(event) =>
                    setGoalForm(
                      (current) => ({
                        ...current,
                        managerId:
                          event.target.value,
                      })
                    )
                  }
                  className={inputClass}
                  required
                >
                  <option value="">
                    Select manager
                  </option>

                  {managerOptions.map(
                    (manager) => {
                      const managerId =
                        getActualEmployeeId(
                          manager
                        );

                      if (
                        managerId === null ||
                        managerId === undefined
                      ) {
                        return null;
                      }

                      return (
                        <option
                          key={String(
                            managerId
                          )}
                          value={String(
                            managerId
                          )}
                        >
                          {getEmployeeCode(
                            manager
                          )}{' '}
                          —{' '}
                          {getEmployeeName(
                            manager
                          )}
                        </option>
                      );
                    }
                  )}
                </select>
              )}
            </div>

            {}

            <div>
              <label className="mb-2 block text-sm text-gray-600 dark:text-gray-400">
                Due Date
              </label>

              <input
                type="date"
                value={
                  goalForm.dueDate
                }
                onChange={(event) =>
                  setGoalForm(
                    (current) => ({
                      ...current,
                      dueDate:
                        event.target.value,
                    })
                  )
                }
                className={inputClass}
                required
              />
            </div>

            {}

            <div>
              <label className="mb-2 block text-sm text-gray-600 dark:text-gray-400">
                Priority
              </label>

              <select
                value={
                  goalForm.priority
                }
                onChange={(event) =>
                  setGoalForm(
                    (current) => ({
                      ...current,
                      priority:
                        event.target.value,
                    })
                  )
                }
                className={inputClass}
              >
                <option value="LOW">
                  Low
                </option>

                <option value="MEDIUM">
                  Medium
                </option>

                <option value="HIGH">
                  High
                </option>

                <option value="URGENT">
                  Urgent
                </option>
              </select>
            </div>

            {}

            <div>
              <label className="mb-2 block text-sm text-gray-600 dark:text-gray-400">
                Status
              </label>

              <select
                value={
                  goalForm.status
                }
                onChange={(event) =>
                  setGoalForm(
                    (current) => ({
                      ...current,
                      status:
                        event.target.value,
                    })
                  )
                }
                className={inputClass}
              >
                <option value="OPEN">
                  Open
                </option>

                <option value="IN_PROGRESS">
                  In Progress
                </option>

                <option value="COMPLETED">
                  Completed
                </option>

                <option value="CANCELLED">
                  Cancelled
                </option>
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className={`w-full sm:w-auto ${primaryButtonClass}`}
              disabled={
                createGoalMutation.isPending ||
                employeeOptions.length === 0 ||
                !goalForm.employeeId ||
                !goalForm.title.trim() ||
                !goalForm.target.trim() ||
                !goalForm.dueDate ||
                (isHr &&
                  !goalForm.managerId)
              }
            >
              {createGoalMutation.isPending
                ? 'Creating...'
                : 'Create Goal'}
            </button>
          </div>
        </form>
      </section>
    );
  }

  /* =======================================================
     GOALS TABLE
  ======================================================= */

  return (
    <>
      <section
        className={`${cardClass} overflow-hidden`}
      >

        <div className="flex items-center gap-2.5 border-b border-purple-100 p-4 sm:p-6 dark:border-gray-800">
          <Target
            size={16}
            className="text-purple-500 dark:text-purple-400"
          />

          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-purple-500 dark:text-purple-400">
              Objectives
            </p>

            <h2 className="mt-1 text-xl font-semibold text-gray-900 dark:text-gray-100">
              {isEmployee
                ? 'My Goals'
                : isManager
                  ? 'My & Team Goals'
                  : 'Employee Goals'}
            </h2>
          </div>
        </div>

        {!goals.length ? (
          <div className="p-10 text-center">

            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-purple-100 bg-purple-50 dark:border-gray-700 dark:bg-gray-800">
              <Target
                size={20}
                className="text-purple-400 dark:text-purple-400"
                strokeWidth={1.75}
              />
            </div>

            <p className="mt-4 font-medium text-gray-900 dark:text-gray-100">
              No goals found
            </p>

            <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">
              {isEmployee
                ? 'No performance goals have been assigned to you yet.'
                : isManager
                  ? 'You or your team members do not have any performance goals yet.'
                  : 'Create a goal to start tracking employee performance.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">

            <table className="min-w-[1200px] divide-y divide-purple-100 text-sm dark:divide-gray-800">

              <thead className="bg-purple-50/60 text-left text-gray-500 dark:bg-gray-800/60 dark:text-gray-400">
                <tr>

                  <th className="px-5 py-4 font-medium">
                    Goal
                  </th>

                  <th className="px-5 py-4 font-medium">
                    Employee
                  </th>

                  <th className="px-5 py-4 font-medium">
                    Manager
                  </th>

                  <th className="px-5 py-4 font-medium">
                    Target
                  </th>

                  <th className="px-5 py-4 font-medium">
                    Due Date
                  </th>

                  <th className="px-5 py-4 font-medium">
                    Priority
                  </th>

                  <th className="px-5 py-4 font-medium">
                    Status
                  </th>

                  {isEmployee && (
                    <th className="px-5 py-4 text-center font-medium">
                      Action
                    </th>
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-purple-100 dark:divide-gray-800">

                {goals.map((goal) => (
                  <tr
                    key={goal.id}
                    className="transition-colors duration-150 hover:bg-purple-50/50 dark:hover:bg-gray-800/50"
                  >

                    <td className="max-w-xs px-5 py-4">
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {goal.title ||
                          'Untitled Goal'}
                      </p>

                      {goal.description ? (
                        <p className="mt-1 truncate text-xs text-gray-400 dark:text-gray-500">
                          {goal.description}
                        </p>
                      ) : null}
                    </td>

                    <td className="px-5 py-4 text-gray-600 dark:text-gray-400">
                      {goal.employeeName ||
                        goal.employee?.name ||
                        `${goal.employee?.firstName || ''} ${
                          goal.employee?.lastName || ''
                        }`.trim() ||
                        '—'}
                    </td>

                    <td className="px-5 py-4 text-gray-600 dark:text-gray-400">
                      {goal.managerName ||
                        goal.manager?.name ||
                        `${goal.manager?.firstName || ''} ${
                          goal.manager?.lastName || ''
                        }`.trim() ||
                        '—'}
                    </td>

                    <td className="max-w-xs px-5 py-4 text-gray-500 dark:text-gray-400">
                      <p className="truncate">
                        {goal.target || '—'}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-gray-500 dark:text-gray-400">
                      {formatDate(
                        goal.dueDate
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <PriorityBadge
                        priority={
                          goal.priority
                        }
                      />
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge
                        status={
                          goal.status
                        }
                      />
                    </td>

                    {isEmployee && (
                      <td className="px-5 py-4 text-center">

                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateGoalStatus(
                              goal
                            )
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-600 transition hover:border-purple-300 hover:bg-purple-100 hover:text-purple-700 dark:border-purple-500/30 dark:bg-purple-500/10 dark:text-purple-400 dark:hover:border-purple-400/50 dark:hover:bg-purple-500/20 dark:hover:text-purple-300"
                        >
                          <Edit3
                            size={12}
                            strokeWidth={2}
                          />

                          Update
                        </button>
                      </td>
                    )}
                  </tr>
                ))}

              </tbody>
            </table>
          </div>
        )}
      </section>

      {isEmployee && (
        <UpdateGoalStatusModal
          goal={updatingGoal}
          newStatus={newGoalStatus}
          setNewStatus={setNewGoalStatus}
          loading={
            updateGoalStatusMutation.isPending
          }
          onClose={
            handleCloseStatusModal
          }
          onConfirm={
            handleConfirmStatusUpdate
          }
        />
      )}
    </>
  );
}