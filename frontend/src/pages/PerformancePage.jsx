import { useMemo, useState } from 'react';
import {
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import {
  LayoutGrid,
  ClipboardList,
  Target,
  Circle,
  Clock,
  CheckCircle2,
  Star,
  Plus,
  PlusCircle,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

import { api } from '../services/api';
import Spinner from '../components/Spinner';
import ErrorState from '../components/ErrorState';
import { useAuth } from '../hooks/useAuth';

import Goals from './Goals';
import Review from './Review';

const cardClass =
  'rounded-2xl border border-purple-100 bg-white shadow-sm shadow-purple-100/50';

/* =========================================================
   HELPERS
========================================================= */

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
    .toUpperCase()
    .trim();
}

function getEmployeeId(user) {
  if (!user) return null;

  return (
    user.employee?.id ??
    user.employee?.employeeId ??
    user.employeeId ??
    user.employee_id ??
    null
  );
}

function getActualEmployeeId(employee) {
  if (!employee) return null;

  return (
    employee.id ??
    employee.employee?.id ??
    employee.employee?.employeeId ??
    employee.employeeId ??
    employee.employee_id ??
    null
  );
}

function getEmployeeRole(employee) {
  if (!employee) return '';

  const role =
    employee.assignedRole ||
    employee.assigned_role ||
    employee.role ||
    employee.user?.assignedRole ||
    employee.user?.assigned_role ||
    employee.user?.role ||
    '';

  return String(role)
    .replace(/^ROLE_/, '')
    .toUpperCase()
    .trim();
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  label,
  value,
  description,
  icon: Icon,
}) {
  return (
    <div
      className={`${cardClass} group p-5 transition duration-200 hover:border-purple-200`}
    >
      <div className="flex items-start justify-between">
        <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
          {label}
        </p>

        {Icon ? (
          <Icon
            size={16}
            className="text-purple-300 transition group-hover:text-purple-500"
            strokeWidth={1.75}
          />
        ) : null}
      </div>

      <p className="mt-3 text-2xl font-semibold tabular-nums text-gray-900">
        {value}
      </p>

      {description ? (
        <p className="mt-1 text-sm text-gray-400">
          {description}
        </p>
      ) : null}
    </div>
  );
}

/* =========================================================
   TABS
========================================================= */

const TABS = [
  {
    key: 'overview',
    label: 'Overview',
    icon: LayoutGrid,
    managerOnly: false,
  },
  {
    key: 'goals',
    label: 'Goals',
    icon: Target,
    managerOnly: false,
  },
  {
    key: 'create-goal',
    label: 'Create Goal',
    icon: Plus,
    managerOnly: true,
  },
  {
    key: 'reviews',
    label: 'Reviews',
    icon: ClipboardList,
    managerOnly: false,
  },
  {
    key: 'create-review',
    label: 'Add Review',
    icon: PlusCircle,
    managerOnly: true,
  },
];

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function PerformancePage() {
  const { user: authUser } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('overview');

  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  /* =======================================================
     CURRENT USER
  ======================================================= */

  const {
    data: meUser,
    isLoading: meLoading,
    error: meError,
  } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const response = await api.get(
        '/api/v1/auth/me'
      );

      return response.data?.data;
    },
  });

  const user = meUser || authUser;

  const role = getRole(user);

  const loggedInEmployeeId =
    getEmployeeId(user);

  const isEmployee = role === 'EMPLOYEE';
  const isHr = role === 'HR';
  const isManager = role === 'MANAGER';

  const canManage = isHr || isManager;

  /* =======================================================
     EMPLOYEES
  ======================================================= */

  const {
    data: employeeData,
    isLoading: employeesLoading,
    error: employeesError,
    refetch: refetchEmployees,
  } = useQuery({
    queryKey: ['performance-employees'],
    queryFn: async () => {
      const response = await api.get(
        '/api/v1/employees',
        {
          params: {
            page: 0,
            size: 100,
          },
        }
      );

      return response.data?.data ?? [];
    },
    enabled: canManage || isEmployee,
  });

  const employees = useMemo(() => {
    if (Array.isArray(employeeData)) {
      return employeeData;
    }

    if (Array.isArray(employeeData?.content)) {
      return employeeData.content;
    }

    if (Array.isArray(employeeData?.data)) {
      return employeeData.data;
    }

    return [];
  }, [employeeData]);

  /* =======================================================
     RESOLVED EMPLOYEE ID
  ======================================================= */

  const resolvedEmployeeId = useMemo(() => {
    if (!user) return null;

    if (
      user.employee?.id !== null &&
      user.employee?.id !== undefined
    ) {
      return user.employee.id;
    }

    if (
      user.employee?.employeeId !== null &&
      user.employee?.employeeId !== undefined
    ) {
      return user.employee.employeeId;
    }

    if (
      user.employeeId !== null &&
      user.employeeId !== undefined
    ) {
      return user.employeeId;
    }

    const foundEmployee = employees.find(
      (employee) => {
        const employeeUserId =
          employee.userId ??
          employee.user?.id ??
          employee.user?.userId ??
          null;

        return (
          employeeUserId !== null &&
          String(employeeUserId) ===
            String(user.id)
        );
      }
    );

    if (foundEmployee) {
      return getActualEmployeeId(
        foundEmployee
      );
    }

    return loggedInEmployeeId;
  }, [
    user,
    employees,
    loggedInEmployeeId,
  ]);

  /* =======================================================
     CURRENT EMPLOYEE
  ======================================================= */

  const currentEmployee = useMemo(() => {
    if (
      resolvedEmployeeId === null ||
      resolvedEmployeeId === undefined
    ) {
      return null;
    }

    return (
      employees.find(
        (employee) =>
          String(
            getActualEmployeeId(employee)
          ) === String(resolvedEmployeeId)
      ) || null
    );
  }, [
    employees,
    resolvedEmployeeId,
  ]);

  /* =======================================================
     MANAGER TEAM
  ======================================================= */

  const {
    data: teamData,
    isLoading: teamLoading,
    error: teamError,
    refetch: refetchTeam,
  } = useQuery({
    queryKey: ['performance-my-team'],
    queryFn: async () => {
      const response = await api.get(
        '/api/v1/employees/my-team'
      );

      return response.data?.data ?? [];
    },
    enabled: isManager,
  });

  const teamMembers = useMemo(() => {
    if (Array.isArray(teamData)) {
      return teamData;
    }

    if (Array.isArray(teamData?.content)) {
      return teamData.content;
    }

    if (Array.isArray(teamData?.data)) {
      return teamData.data;
    }

    return [];
  }, [teamData]);

  const managerTeamEmployees = useMemo(() => {
    if (!isManager) return [];

    return teamMembers.filter(
      (employee) =>
        getEmployeeRole(employee) ===
        'EMPLOYEE'
    );
  }, [
    teamMembers,
    isManager,
  ]);

  const managerTeamEmployeeIds = useMemo(() => {
    return new Set(
      managerTeamEmployees
        .map((employee) =>
          getActualEmployeeId(employee)
        )
        .filter(
          (id) =>
            id !== null &&
            id !== undefined
        )
        .map((id) => String(id))
    );
  }, [managerTeamEmployees]);

  /* =======================================================
     EMPLOYEE OPTIONS
  ======================================================= */

  const employeeOptions = useMemo(() => {
    if (isHr) {
      return employees.filter(
        (employee) =>
          getEmployeeRole(employee) ===
          'EMPLOYEE'
      );
    }

    if (isManager) {
      return managerTeamEmployees;
    }

    return [];
  }, [
    employees,
    isHr,
    isManager,
    managerTeamEmployees,
  ]);

  /* =======================================================
     MANAGER OPTIONS
  ======================================================= */

  const managerOptions = useMemo(() => {
    if (isHr) {
      return employees.filter(
        (employee) =>
          getEmployeeRole(employee) ===
          'MANAGER'
      );
    }

    if (isManager) {
      const self = employees.find(
        (employee) =>
          String(
            getActualEmployeeId(employee)
          ) === String(resolvedEmployeeId)
      );

      return self ? [self] : [];
    }

    return [];
  }, [
    employees,
    isHr,
    isManager,
    resolvedEmployeeId,
  ]);

  /* =======================================================
     GOALS
  ======================================================= */

  const {
    data: goalsResponse,
    isLoading: goalsLoading,
    error: goalsError,
    refetch: refetchGoals,
  } = useQuery({
    queryKey: ['performance-goals'],
    queryFn: async () => {
      const response = await api.get(
        '/api/v1/goals'
      );

      return response.data?.data ?? [];
    },
  });

  const allGoals = useMemo(() => {
    if (Array.isArray(goalsResponse)) {
      return goalsResponse;
    }

    if (
      Array.isArray(
        goalsResponse?.content
      )
    ) {
      return goalsResponse.content;
    }

    if (
      Array.isArray(
        goalsResponse?.data
      )
    ) {
      return goalsResponse.data;
    }

    return [];
  }, [goalsResponse]);

  /* =======================================================
     REVIEWS
  ======================================================= */

  const {
    data: reviewsResponse,
    isLoading: reviewsLoading,
    error: reviewsError,
    refetch: refetchReviews,
  } = useQuery({
    queryKey: ['performance-reviews'],
    queryFn: async () => {
      const response = await api.get(
        '/api/v1/performance-reviews'
      );

      return response.data?.data ?? [];
    },
  });

  const allReviews = useMemo(() => {
    if (Array.isArray(reviewsResponse)) {
      return reviewsResponse;
    }

    if (
      Array.isArray(
        reviewsResponse?.content
      )
    ) {
      return reviewsResponse.content;
    }

    if (
      Array.isArray(
        reviewsResponse?.data
      )
    ) {
      return reviewsResponse.data;
    }

    return [];
  }, [reviewsResponse]);

  /* =======================================================
     GOAL FILTER
  ======================================================= */

  const goals = useMemo(() => {
    
    if (isHr) {
      return allGoals;
    }

    
    if (isEmployee) {
      if (
        resolvedEmployeeId === null ||
        resolvedEmployeeId === undefined
      ) {
        return [];
      }

      return allGoals.filter((goal) => {
        const employeeId =
          goal.employeeId ??
          goal.employee_id ??
          goal.employee?.id ??
          goal.employee?.employeeId ??
          goal.employee?.employee_id ??
          goal.employee?.user?.id ??
          null;

        return (
          employeeId !== null &&
          employeeId !== undefined &&
          String(employeeId) ===
            String(resolvedEmployeeId)
        );
      });
    }

    
    if (isManager) {
      return allGoals.filter((goal) => {
        const employeeId =
          goal.employeeId ??
          goal.employee_id ??
          goal.employee?.id ??
          goal.employee?.employeeId ??
          goal.employee?.employee_id ??
          goal.employee?.user?.id ??
          null;

        const managerId =
          goal.managerId ??
          goal.manager_id ??
          goal.manager?.id ??
          goal.manager?.employeeId ??
          goal.manager?.employee_id ??
          goal.manager?.user?.id ??
          null;

        const isOwnGoal =
          employeeId !== null &&
          String(employeeId) ===
            String(resolvedEmployeeId);

        const isTeamGoal =
          employeeId !== null &&
          managerTeamEmployeeIds.has(
            String(employeeId)
          );

        const isManagedByCurrentManager =
          managerId !== null &&
          String(managerId) ===
            String(resolvedEmployeeId);

        return (
          isOwnGoal ||
          isTeamGoal ||
          isManagedByCurrentManager
        );
      });
    }

    return [];
  }, [
    allGoals,
    isHr,
    isEmployee,
    isManager,
    resolvedEmployeeId,
    managerTeamEmployeeIds,
  ]);

  /* =======================================================
     REVIEW FILTER
     
     HR:
       ALL REVIEWS

     MANAGER:
       OWN REVIEW
       +
       TEAM MEMBER REVIEWS

     EMPLOYEE:
       ONLY OWN REVIEW
  ======================================================= */

  const reviews = useMemo(() => {
    /* -------------------------------------------------------
       HR
       ------------------------------------------------------- */

    if (isHr) {
      return allReviews;
    }

    /* -------------------------------------------------------
       EMPLOYEE
       ------------------------------------------------------- */

    if (isEmployee) {
      if (
        resolvedEmployeeId === null ||
        resolvedEmployeeId === undefined
      ) {
        return [];
      }

      return allReviews.filter((review) => {
        const employeeId =
          review.employeeId ??
          review.employee_id ??
          review.employee?.id ??
          review.employee?.employeeId ??
          review.employee?.employee_id ??
          review.employee?.user?.id ??
          review.employee?.user?.employeeId ??
          review.employee?.user?.employeeIdNumber ??
          null;

        return (
          employeeId !== null &&
          employeeId !== undefined &&
          String(employeeId) ===
            String(resolvedEmployeeId)
        );
      });
    }

    /* -------------------------------------------------------
       MANAGER

       Manager can see:
       1. His own review
       2. Reviews of his team members

       We intentionally do NOT show reviews belonging
       to unrelated employees.
       ------------------------------------------------------- */

    if (isManager) {
      return allReviews.filter((review) => {
        const employeeId =
          review.employeeId ??
          review.employee_id ??
          review.employee?.id ??
          review.employee?.employeeId ??
          review.employee?.employee_id ??
          review.employee?.user?.id ??
          review.employee?.user?.employeeId ??
          null;

        if (
          employeeId === null ||
          employeeId === undefined
        ) {
          return false;
        }

        
        const isOwnReview =
          String(employeeId) ===
          String(resolvedEmployeeId);

        
        const isTeamReview =
          managerTeamEmployeeIds.has(
            String(employeeId)
          );

        return (
          isOwnReview ||
          isTeamReview
        );
      });
    }

    return [];
  }, [
    allReviews,
    isHr,
    isEmployee,
    isManager,
    resolvedEmployeeId,
    managerTeamEmployeeIds,
  ]);

  /* =======================================================
     STATISTICS
  ======================================================= */

  const goalStatistics = useMemo(() => {
    return {
      total: goals.length,

      open: goals.filter(
        (goal) =>
          String(goal.status || '')
            .toUpperCase() === 'OPEN'
      ).length,

      inProgress: goals.filter(
        (goal) =>
          String(goal.status || '')
            .toUpperCase() ===
          'IN_PROGRESS'
      ).length,

      completed: goals.filter(
        (goal) =>
          String(goal.status || '')
            .toUpperCase() ===
          'COMPLETED'
      ).length,
    };
  }, [goals]);

  const reviewStatistics = useMemo(() => {
    if (!reviews.length) {
      return {
        total: 0,
        average: '0.0',
      };
    }

    const total = reviews.reduce(
      (sum, review) =>
        sum +
        Number(
          review.overallRating || 0
        ),
      0
    );

    return {
      total: reviews.length,
      average: (
        total / reviews.length
      ).toFixed(1),
    };
  }, [reviews]);

  /* =======================================================
     LOADING / ERRORS
  ======================================================= */

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

  if (goalsLoading) {
    return (
      <Spinner label="Loading performance information..." />
    );
  }

  if (goalsError) {
    return (
      <ErrorState
        description="Unable to load performance goals."
        onRetry={refetchGoals}
      />
    );
  }

  if (canManage && employeesLoading) {
    return (
      <Spinner label="Loading employees..." />
    );
  }

  if (canManage && employeesError) {
    return (
      <ErrorState
        description="Unable to load employees for performance management."
        onRetry={refetchEmployees}
      />
    );
  }

  if (isManager && teamLoading) {
    return (
      <Spinner label="Loading your team..." />
    );
  }

  if (isManager && teamError) {
    return (
      <ErrorState
        description="Unable to load your team members."
        onRetry={refetchTeam}
      />
    );
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="min-h-full space-y-6 bg-gradient-to-b from-purple-50 via-[#F8F6FC] to-purple-50 p-4 md:p-6">

      {}

      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">

        <div className="flex items-center gap-3">

          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-purple-100 bg-white shadow-sm shadow-purple-100/50">
            <Sparkles
              size={20}
              className="text-purple-500"
              strokeWidth={1.75}
            />
          </div>

          <div>

            <p className="text-xs font-medium uppercase tracking-[0.2em] text-purple-500">
              Workforce
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900">
              Performance Management
            </h1>

            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              {isHr
                ? 'Manage employee goals and performance reviews across the organization.'
                : isManager
                  ? 'Manage your personal performance and the performance of your team.'
                  : 'Track your assigned goals and performance reviews.'}
            </p>

          </div>

        </div>

        <div
          className={`${cardClass} flex items-center gap-3 px-4 py-3`}
        >
          <ShieldCheck
            size={16}
            className="text-purple-500"
            strokeWidth={1.75}
          />

          <div>
            <p className="text-xs uppercase tracking-[0.15em] text-gray-400">
              Role
            </p>

            <p className="mt-0.5 text-lg font-semibold leading-none text-gray-900">
              {role}
            </p>
          </div>
        </div>

      </div>

      {}

      {message ? (
        <div className="flex items-center gap-2.5 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2
            size={16}
            className="shrink-0"
          />

          {message}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="flex items-center gap-2.5 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      {}

      <div className="flex gap-2 overflow-x-auto rounded-2xl border border-purple-100 bg-white p-2 shadow-sm shadow-purple-100/50">

        {TABS.filter(
          (tab) =>
            !tab.managerOnly || canManage
        ).map((tab) => {
          const Icon = tab.icon;

          const isActive =
            activeTab === tab.key;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setActiveTab(tab.key);
                setMessage('');
                setErrorMessage('');
              }}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                isActive
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-500 hover:bg-purple-50 hover:text-purple-700'
              }`}
            >
              <Icon
                size={14}
                strokeWidth={2}
              />

              {tab.label}
            </button>
          );
        })}

      </div>

      {/* ===================================================
          OVERVIEW
      =================================================== */}

      {activeTab === 'overview' && (
        <div className="space-y-6">

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <StatCard
              label="Total Goals"
              value={goalStatistics.total}
              description={
                isEmployee
                  ? 'Your assigned goals'
                  : isManager
                    ? 'Your + team goals'
                    : 'Performance goals'
              }
              icon={Target}
            />

            <StatCard
              label="Open"
              value={goalStatistics.open}
              description="Goals not started"
              icon={Circle}
            />

            <StatCard
              label="In Progress"
              value={goalStatistics.inProgress}
              description="Active goals"
              icon={Clock}
            />

            <StatCard
              label="Completed"
              value={goalStatistics.completed}
              description="Completed goals"
              icon={CheckCircle2}
            />

          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

            <StatCard
              label="Reviews"
              value={
                reviewsLoading
                  ? '...'
                  : reviewStatistics.total
              }
              description={
                isEmployee
                  ? 'Reviews assigned to you'
                  : isManager
                    ? 'Your + team reviews'
                    : 'Performance reviews'
              }
              icon={ClipboardList}
            />

            <StatCard
              label="Average Rating"
              value={
                reviewsLoading
                  ? '...'
                  : reviewStatistics.average
              }
              description="Overall rating"
              icon={Star}
            />

          </div>

          {isEmployee && (
            <div className={`${cardClass} p-6`}>

              <div className="flex items-center justify-between gap-4">

                <div>

                  <p className="text-xs uppercase tracking-[0.2em] text-purple-500">
                    My Goals
                  </p>

                  <h2 className="mt-2 text-xl font-semibold text-gray-900">
                    Your assigned performance goals
                  </h2>

                  <p className="mt-2 text-sm text-gray-400">
                    Goals assigned to you by your manager or HR
                    are reflected here automatically.
                  </p>

                </div>

                <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-50 sm:flex">
                  <Target
                    size={22}
                    className="text-purple-500"
                  />
                </div>

              </div>

              {goals.length > 0 ? (
                <div className="mt-5 space-y-3">

                  {goals.slice(0, 5).map((goal) => (
                    <div
                      key={goal.id}
                      className="flex flex-col justify-between gap-3 rounded-xl border border-purple-100 bg-purple-50/40 p-4 sm:flex-row sm:items-center"
                    >

                      <div className="min-w-0">

                        <p className="truncate font-medium text-gray-900">
                          {goal.title || 'Untitled Goal'}
                        </p>

                        {goal.target ? (
                          <p className="mt-1 truncate text-sm text-gray-500">
                            {goal.target}
                          </p>
                        ) : null}

                        <p className="mt-1 text-xs text-gray-400">
                          Due: {goal.dueDate || '—'}
                        </p>

                      </div>

                      <div className="flex shrink-0 items-center gap-2">

                        <span className="rounded-full border border-purple-100 bg-purple-50 px-2.5 py-1 text-xs text-gray-500">
                          {goal.priority || '—'}
                        </span>

                        <span className="rounded-full border border-purple-100 bg-purple-50 px-2.5 py-1 text-xs text-gray-500">
                          {String(
                            goal.status || '—'
                          ).replaceAll('_', ' ')}
                        </span>

                      </div>

                    </div>
                  ))}

                  {goals.length > 5 ? (
                    <button
                      type="button"
                      onClick={() =>
                        setActiveTab('goals')
                      }
                      className="mt-2 text-sm font-medium text-purple-600 hover:text-purple-700"
                    >
                      View all {goals.length} goals →
                    </button>
                  ) : null}

                </div>
              ) : (
                <div className="mt-5 rounded-xl border border-dashed border-purple-200 bg-purple-50/30 p-6 text-center">

                  <Target
                    size={22}
                    className="mx-auto text-purple-300"
                  />

                  <p className="mt-3 text-sm font-medium text-gray-700">
                    No goals assigned yet
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    Your assigned goals will appear here.
                  </p>

                </div>
              )}

            </div>
          )}

          <div className={`${cardClass} p-6`}>

            <p className="text-xs uppercase tracking-[0.2em] text-purple-500">
              Performance
            </p>

            <h2 className="mt-2 text-xl font-semibold text-gray-900">
              {isEmployee
                ? 'Your performance'
                : isManager
                  ? 'Your team performance'
                  : 'Organization performance'}
            </h2>

            <p className="mt-2 text-sm text-gray-400">
              {isEmployee
                ? 'Review goals assigned to you and performance reviews completed for you.'
                : isManager
                  ? 'Review your own performance and manage performance goals and reviews for employees reporting to you.'
                  : 'Manage employee objectives and performance evaluations across the organization.'}
            </p>

          </div>

        </div>
      )}

      {/* ===================================================
          GOALS
      =================================================== */}

      {(activeTab === 'goals' ||
        activeTab === 'create-goal') && (
        <Goals
          mode={activeTab}
          role={role}
          isHr={isHr}
          isManager={isManager}
          isEmployee={isEmployee}
          canManage={canManage}
          employees={employees}
          employeeOptions={employeeOptions}
          managerOptions={managerOptions}
          managerTeamEmployeeIds={
            managerTeamEmployeeIds
          }
          currentEmployee={currentEmployee}
          resolvedEmployeeId={
            resolvedEmployeeId
          }
          currentManagerEmployeeId={
            resolvedEmployeeId
          }
          goals={goals}
          onSuccess={(text) => {
            setMessage(text);
            setErrorMessage('');
          }}
          onError={(text) => {
            setMessage('');
            setErrorMessage(text);
          }}
        />
      )}

      {/* ===================================================
          REVIEWS
      =================================================== */}

      {(activeTab === 'reviews' ||
        activeTab === 'create-review') && (
        <Review
          mode={activeTab}
          role={role}

          
          isHr={isHr}
          isManager={isManager}
          isEmployee={isEmployee}

          canManage={canManage}

          employees={employees}

          employeeOptions={
            employeeOptions
          }

          managerOptions={
            managerOptions
          }

          managerTeamEmployeeIds={
            managerTeamEmployeeIds
          }

          currentEmployee={
            currentEmployee
          }

          resolvedEmployeeId={
            resolvedEmployeeId
          }

          currentManagerEmployeeId={
            resolvedEmployeeId
          }

          reviews={reviews}
          reviewsLoading={
            reviewsLoading
          }
          reviewsError={
            reviewsError
          }
          refetchReviews={
            refetchReviews
          }

          onSuccess={(text) => {
            setMessage(text);
            setErrorMessage('');
          }}

          onError={(text) => {
            setMessage('');
            setErrorMessage(text);
          }}
        />
      )}

    </div>
  );
}