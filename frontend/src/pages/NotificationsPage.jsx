import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  BellRing,
  Check,
  CheckCheck,
  Clock3,
  FileText,
  Info,
  ShieldCheck,
  Users,
  UserCheck,
  CalendarDays,
  BriefcaseBusiness,
  AlertCircle,
  CircleDot,
  Sparkles,
} from 'lucide-react';

import { api } from '../services/api';
import Spinner from '../components/Spinner';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../hooks/useAuth';


/* =========================================================
   CONSTANTS
========================================================= */

const cardClass =
  'rounded-2xl border border-purple-100 bg-white shadow-sm shadow-purple-100/50';

const roleConfig = {
  EMPLOYEE: {
    label: 'Employee',
    eyebrow: 'Personal Inbox',
    title: 'My Notifications',
    description:
      'Stay updated with your attendance, leave, tasks, performance, and other workplace activities.',
    icon: UserCheck,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-500',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700',
  },

  MANAGER: {
    label: 'Manager',
    eyebrow: 'Team Inbox',
    title: 'Manager Notifications',
    description:
      'Monitor important updates related to your team, approvals, attendance, leave, and performance.',
    icon: Users,
    iconBg: 'bg-purple-50',
    iconColor: 'text-purple-500',
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-700',
  },

  HR: {
    label: 'HR',
    eyebrow: 'Organization Inbox',
    title: 'HR Notifications',
    description:
      'Review organization-wide alerts, employee activities, approvals, attendance, and HR operations.',
    icon: ShieldCheck,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-500',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
  },
};


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
    .toUpperCase();
}


function normalizeNotifications(response) {
  const data = response?.data;

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  if (Array.isArray(data?.content)) {
    return data.content;
  }

  return [];
}


function normalizeUnreadCount(response) {
  const data = response?.data;

  if (typeof data === 'number') {
    return data;
  }

  if (typeof data?.data === 'number') {
    return data.data;
  }

  if (typeof data?.count === 'number') {
    return data.count;
  }

  return 0;
}


function formatNotificationDate(value) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}


function getNotificationType(notification) {
  return String(
    notification?.notificationType ||
      notification?.type ||
      'GENERAL'
  )
    .replace(/-/g, '_')
    .replace(/\s+/g, '_')
    .toUpperCase();
}


function getTypeConfig(type) {
  const configs = {
    ATTENDANCE: {
      label: 'Attendance',
      icon: Clock3,
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-100',
    },

    LEAVE: {
      label: 'Leave',
      icon: CalendarDays,
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      border: 'border-amber-100',
    },

    PERFORMANCE: {
      label: 'Performance',
      icon: Sparkles,
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      border: 'border-purple-100',
    },

    GOAL: {
      label: 'Goal',
      icon: CircleDot,
      bg: 'bg-indigo-50',
      text: 'text-indigo-600',
      border: 'border-indigo-100',
    },

    DOCUMENT: {
      label: 'Document',
      icon: FileText,
      bg: 'bg-cyan-50',
      text: 'text-cyan-600',
      border: 'border-cyan-100',
    },

    EMPLOYEE: {
      label: 'Employee',
      icon: UserCheck,
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-emerald-100',
    },

    TEAM: {
      label: 'Team',
      icon: Users,
      bg: 'bg-violet-50',
      text: 'text-violet-600',
      border: 'border-violet-100',
    },

    SYSTEM: {
      label: 'System',
      icon: ShieldCheck,
      bg: 'bg-slate-50',
      text: 'text-slate-600',
      border: 'border-slate-100',
    },

    ALERT: {
      label: 'Alert',
      icon: AlertCircle,
      bg: 'bg-rose-50',
      text: 'text-rose-600',
      border: 'border-rose-100',
    },

    GENERAL: {
      label: 'General',
      icon: Info,
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      border: 'border-purple-100',
    },
  };

  return configs[type] || configs.GENERAL;
}


/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  label,
  value,
  description,
  icon: Icon,
  iconClass = 'text-purple-500',
}) {
  return (
    <div
      className={`${cardClass} group p-5 transition duration-200 hover:border-purple-200`}
    >
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-gray-400">
          {label}
        </p>

        <Icon
          size={17}
          className={`${iconClass} transition group-hover:scale-110`}
          strokeWidth={1.75}
        />
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
   TYPE BADGE
========================================================= */

function NotificationTypeBadge({ type }) {
  const config = getTypeConfig(type);
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${config.bg} ${config.text} ${config.border}`}
    >
      <Icon size={12} strokeWidth={2} />
      {config.label}
    </span>
  );
}


/* =========================================================
   NOTIFICATION ITEM
========================================================= */

function NotificationItem({
  notification,
  onMarkRead,
  isMarkingRead,
}) {
  const type = getNotificationType(notification);
  const config = getTypeConfig(type);
  const TypeIcon = config.icon;

  const isRead = Boolean(notification?.read);

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border bg-white p-5 transition duration-200 ${
        isRead
          ? 'border-purple-100 hover:border-purple-200'
          : 'border-purple-200 bg-purple-50/20 shadow-sm shadow-purple-100/40'
      }`}
    >
      {!isRead && (
        <div className="absolute left-0 top-0 h-full w-1 bg-purple-500" />
      )}

      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 gap-4">
          {}
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${config.bg}`}
          >
            <TypeIcon
              size={19}
              className={config.text}
              strokeWidth={1.75}
            />
          </div>

          {}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3
                className={`text-sm ${
                  isRead
                    ? 'font-medium text-gray-800'
                    : 'font-semibold text-gray-900'
                }`}
              >
                {notification.title || 'Notification'}
              </h3>

              <NotificationTypeBadge type={type} />

              {!isRead && (
                <span className="inline-flex items-center gap-1 rounded-full bg-purple-600 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  New
                </span>
              )}
            </div>

            {notification.message ? (
              <p className="mt-2 text-sm leading-6 text-gray-500">
                {notification.message}
              </p>
            ) : (
              <p className="mt-2 text-sm text-gray-400">
                No additional message.
              </p>
            )}

            <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-400">
              <Clock3 size={12} />
              {formatNotificationDate(notification.createdAt)}
            </div>
          </div>
        </div>

        {}
        <div className="flex shrink-0 items-center gap-2 md:pl-4">
          {isRead ? (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-500">
              <Check size={13} />
              Read
            </span>
          ) : (
            <button
              type="button"
              onClick={() => onMarkRead(notification.id)}
              disabled={isMarkingRead}
              className="inline-flex items-center gap-1.5 rounded-lg border border-purple-100 bg-purple-50 px-3 py-2 text-xs font-medium text-purple-700 transition hover:border-purple-200 hover:bg-purple-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Check size={13} />

              {isMarkingRead
                ? 'Marking...'
                : 'Mark as read'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


/* =========================================================
   MAIN PAGE
========================================================= */

export default function NotificationsPage() {
  const { user: authUser } = useAuth();

  const queryClient = useQueryClient();

  const role = getRole(authUser);

  const config =
    roleConfig[role] || roleConfig.EMPLOYEE;

  const RoleIcon = config.icon;

  /* -------------------------------------------------------
     CURRENT USER
  ------------------------------------------------------- */

  const {
    data: meResponse,
    isLoading: meLoading,
    error: meError,
  } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const response = await api.get('/api/v1/auth/me');

      return response.data?.data;
    },
    enabled: !authUser,
  });

  const user = authUser || meResponse;

  const finalRole = getRole(user);

  const finalConfig =
    roleConfig[finalRole] || config;

  /* -------------------------------------------------------
     NOTIFICATIONS
  ------------------------------------------------------- */

  const {
    data: notificationsResponse,
    isLoading: notificationsLoading,
    error: notificationsError,
    refetch: refetchNotifications,
  } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await api.get(
        '/api/v1/notifications'
      );

      return response;
    },
    enabled: Boolean(user),
    refetchInterval: 30000,
  });

  const notifications = useMemo(
    () => normalizeNotifications(notificationsResponse),
    [notificationsResponse]
  );

  /* -------------------------------------------------------
     UNREAD COUNT
  ------------------------------------------------------- */

  const {
    data: unreadResponse,
    isLoading: unreadLoading,
  } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: async () => {
      const response = await api.get(
        '/api/v1/notifications/unread-count'
      );

      return response;
    },
    enabled: Boolean(user),
    refetchInterval: 30000,
  });

  const unreadCount = normalizeUnreadCount(
    unreadResponse
  );

  /* -------------------------------------------------------
     MARK READ
  ------------------------------------------------------- */

  const markReadMutation = useMutation({
    mutationFn: async (notificationId) => {
      const response = await api.post(
        `/api/v1/notifications/${notificationId}/read`
      );

      return response.data;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['notifications'],
      });

      queryClient.invalidateQueries({
        queryKey: ['notifications-unread-count'],
      });
    },
  });

  /* -------------------------------------------------------
     STATISTICS
  ------------------------------------------------------- */

  const statistics = useMemo(() => {
    const total = notifications.length;

    const unread = notifications.filter(
      (notification) => !notification.read
    ).length;

    const read = notifications.filter(
      (notification) => notification.read
    ).length;

    const types = new Set(
      notifications.map((notification) =>
        getNotificationType(notification)
      )
    );

    return {
      total,
      unread,
      read,
      categories: types.size,
    };
  }, [notifications]);

  /* -------------------------------------------------------
     ROLE-SPECIFIC TYPE SUMMARY
  ------------------------------------------------------- */

  const typeSummary = useMemo(() => {
    const counts = {};

    notifications.forEach((notification) => {
      const type = getNotificationType(notification);

      counts[type] = (counts[type] || 0) + 1;
    });

    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  }, [notifications]);

  /* -------------------------------------------------------
     LOADING
  ------------------------------------------------------- */

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

  if (notificationsLoading) {
    return (
      <Spinner label="Loading notifications..." />
    );
  }

  if (notificationsError) {
    return (
      <ErrorState
        description="Unable to load notifications."
        onRetry={refetchNotifications}
      />
    );
  }

  /* -------------------------------------------------------
     UI
  ------------------------------------------------------- */

  return (
    <div className="min-h-full space-y-6 bg-gradient-to-b from-purple-50 via-[#F8F6FC] to-purple-50 p-4 md:p-6">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">

        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-purple-100 bg-white shadow-sm shadow-purple-100/50">
            <BellRing
              size={21}
              className="text-purple-500"
              strokeWidth={1.75}
            />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-purple-500">
              {finalConfig.eyebrow}
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">
              {finalConfig.title}
            </h1>

            <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500">
              {finalConfig.description}
            </p>
          </div>
        </div>

        {}
        <div
          className={`${cardClass} flex items-center gap-3 px-4 py-3`}
        >
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-lg ${finalConfig.iconBg}`}
          >
            <RoleIcon
              size={17}
              className={finalConfig.iconColor}
              strokeWidth={1.75}
            />
          </div>

          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-gray-400">
              Account Role
            </p>

            <p className="mt-0.5 text-sm font-semibold text-gray-900">
              {finalRole || 'User'}
            </p>
          </div>
        </div>
      </div>


      {/* =================================================
          QUICK STATUS
      ================================================= */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

        <StatCard
          label="Total"
          value={statistics.total}
          description="All notifications"
          icon={Bell}
          iconClass="text-purple-500"
        />

        <StatCard
          label="Unread"
          value={
            unreadLoading
              ? '...'
              : unreadCount
          }
          description="Require your attention"
          icon={BellRing}
          iconClass="text-rose-500"
        />

        <StatCard
          label="Read"
          value={statistics.read}
          description="Already reviewed"
          icon={CheckCheck}
          iconClass="text-emerald-500"
        />

        <StatCard
          label="Categories"
          value={statistics.categories}
          description="Notification types"
          icon={FileText}
          iconClass="text-blue-500"
        />
      </div>


      {/* =================================================
          ROLE INFORMATION
      ================================================= */}

      <div
        className={`${cardClass} overflow-hidden`}
      >
        <div className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">

          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${finalConfig.iconBg}`}
            >
              <RoleIcon
                size={18}
                className={finalConfig.iconColor}
                strokeWidth={1.75}
              />
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-900">
                {finalRole === 'HR'
                  ? 'Organization updates'
                  : finalRole === 'MANAGER'
                    ? 'Team updates'
                    : 'Your workplace updates'}
              </p>

              <p className="mt-0.5 text-xs text-gray-400">
                Notifications are automatically refreshed every 30 seconds.
              </p>
            </div>
          </div>

          {}
          {typeSummary.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {typeSummary.map(([type, count]) => (
                <div
                  key={type}
                  className="flex items-center gap-2 rounded-lg border border-purple-100 bg-purple-50/50 px-3 py-2"
                >
                  <NotificationTypeBadge type={type} />

                  <span className="text-xs font-semibold text-gray-600">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>


      {/* =================================================
          EMPTY STATE
      ================================================= */}

      {!notifications.length ? (
        <div className={`${cardClass} p-10`}>
          <EmptyState
            title={
              finalRole === 'HR'
                ? 'No organization notifications'
                : finalRole === 'MANAGER'
                  ? 'No team notifications'
                  : 'No notifications'
            }
            description={
              finalRole === 'HR'
                ? 'There are currently no HR or organization updates requiring your attention.'
                : finalRole === 'MANAGER'
                  ? 'There are currently no team-related updates requiring your attention.'
                  : 'You are all caught up. New workplace notifications will appear here.'
            }
          />
        </div>
      ) : (
        <>
          {/* =============================================
              UNREAD SECTION
          ============================================= */}

          {notifications.some(
            (notification) => !notification.read
          ) && (
            <section className="space-y-3">

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BellRing
                    size={17}
                    className="text-purple-500"
                  />

                  <h2 className="text-lg font-semibold text-gray-900">
                    Needs Your Attention
                  </h2>

                  <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700">
                    {unreadCount}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {notifications
                  .filter(
                    (notification) =>
                      !notification.read
                  )
                  .map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkRead={(id) =>
                        markReadMutation.mutate(id)
                      }
                      isMarkingRead={
                        markReadMutation.isPending &&
                        markReadMutation.variables ===
                          notification.id
                      }
                    />
                  ))}
              </div>
            </section>
          )}


          {/* =============================================
              ALL NOTIFICATIONS
          ============================================= */}

          <section className="space-y-3">

            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50">
                <BriefcaseBusiness
                  size={15}
                  className="text-purple-500"
                />
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  All Notifications
                </h2>

                <p className="text-xs text-gray-400">
                  Complete notification history
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkRead={(id) =>
                    markReadMutation.mutate(id)
                  }
                  isMarkingRead={
                    markReadMutation.isPending &&
                    markReadMutation.variables ===
                      notification.id
                  }
                />
              ))}
            </div>
          </section>
        </>
      )}


      {/* =================================================
          FOOTER INFORMATION
      ================================================= */}

      <div className="flex items-center gap-2 rounded-xl border border-purple-100 bg-white/70 px-4 py-3 text-xs text-gray-400">
        <Info size={13} className="shrink-0 text-purple-400" />

        <span>
          {finalRole === 'HR'
            ? 'HR notifications may include organization-wide employee, attendance, leave, document, and performance updates.'
            : finalRole === 'MANAGER'
              ? 'Manager notifications may include team attendance, leave requests, goals, reviews, and employee updates.'
              : 'Employee notifications may include your attendance, leave, goals, performance, documents, and other personal updates.'}
        </span>
      </div>
    </div>
  );
}