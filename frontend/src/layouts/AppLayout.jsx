import { NavLink } from 'react-router-dom';
import {
  Bell,
  LogOut,
  Menu,
  X,
  Sparkles,
  Users,
  LayoutDashboard,
  Building2,
  UserSquare2,
  CalendarCheck,
  Plane,
  Wallet,
  TrendingUp,
  FileText,
  User,
  Settings,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { useState } from 'react';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/employees', label: 'Employees', icon: Users },
  { to: '/departments', label: 'Departments', icon: Building2 },
  { to: '/designations', label: 'Designations', icon: UserSquare2 },
  { to: '/attendance', label: 'Attendance', icon: CalendarCheck },
  { to: '/leave', label: 'Leave', icon: Plane },
  { to: '/payroll', label: 'Payroll', icon: Wallet },
  { to: '/performance', label: 'Performance', icon: TrendingUp },
  { to: '/documents', label: 'Documents', icon: FileText },
  { to: '/profile', label: 'Profile', icon: User },
];

export default function AppLayout({ children }) {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-[#F8F6FC] to-purple-100 text-gray-900 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 dark:text-gray-100">

      {/* Main application container */}
      <div className="mx-auto flex min-h-screen max-w-[1600px]">

        {/* Mobile backdrop */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm md:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`
            fixed
            inset-y-0
            left-0
            z-40
            flex
            h-screen
            w-72
            flex-col
            border-r
            border-purple-100
            bg-white
            p-5
            shadow-xl
            shadow-purple-200/30
            transition-transform
            duration-300

            dark:border-gray-800
            dark:bg-gray-900
            dark:shadow-black/30

            md:sticky
            md:top-0
            md:h-screen
            md:translate-x-0

            ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >

          {/* Sidebar Header */}
          <div className="flex shrink-0 items-center justify-between gap-3 rounded-2xl border border-purple-100 bg-purple-50/60 p-4 dark:border-gray-800 dark:bg-gray-800/60">

            <div className="flex items-center gap-3">

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-600 text-white shadow-md shadow-purple-200 dark:shadow-purple-950/40">
                <Sparkles size={20} />
              </div>

              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Human Resource
                </p>

                <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  HRMS
                </h1>
              </div>

            </div>

            {/* Mobile close button */}
            <button
              type="button"
              className="rounded-lg p-1.5 text-gray-400 transition hover:bg-purple-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-200 md:hidden"
              onClick={() => setMobileOpen(false)}
            >
              <X size={18} />
            </button>

          </div>

          {/* Navigation */}
          <nav className="mt-6 flex-1 space-y-1 overflow-hidden pr-1 text-sm">

            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}  // ✅ v6 uses 'end' instead of 'exact'
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `
                    group
                    flex
                    items-center
                    gap-3
                    rounded-xl
                    px-4
                    py-2.5
                    transition-all
                    duration-200

                    ${
                      isActive
                        ? 'bg-purple-600 text-white shadow-sm shadow-purple-300/40'
                        : 'text-gray-500 hover:bg-purple-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100'
                    }
                    `
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        size={16}
                        strokeWidth={1.9}
                        className={
                          isActive
                            ? 'text-white'
                            : 'text-purple-300 transition group-hover:text-purple-500 dark:text-purple-500/60 dark:group-hover:text-purple-400'
                        }
                      />

                      <span className="truncate">
                        {item.label}
                      </span>
                    </>
                  )}
                </NavLink>
              );
            })}

          </nav>

          {/* Sidebar Footer */}
          <div className="mt-4 shrink-0 border-t border-purple-100 pt-4 dark:border-gray-800">
            <p className="text-center text-[10px] font-medium uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">
              HRMS Platform
            </p>
          </div>

        </aside>

        {/* Main Content Area */}
        <div className="flex min-w-0 flex-1 flex-col">

          {/* Top Header */}
          <header className="sticky top-0 z-20 border-b border-purple-100 bg-white/80 backdrop-blur-xl dark:border-gray-800 dark:bg-gray-900/80">

            <div className="flex items-center justify-between gap-4 px-4 py-4 md:px-8">

              {/* LEFT SIDE */}
              <div className="flex items-center gap-3">

                {/* Mobile menu */}
                <button
                  type="button"
                  className="rounded-xl border border-purple-100 bg-white p-2 text-gray-600 shadow-sm transition hover:bg-purple-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 md:hidden"
                  onClick={() => setMobileOpen((value) => !value)}
                >
                  {mobileOpen ? (
                    <X size={18} />
                  ) : (
                    <Menu size={18} />
                  )}
                </button>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-purple-500 dark:text-purple-400">
                    Premium HR SaaS
                  </p>

                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Operational control center
                  </h2>
                </div>

              </div>

              {/* RIGHT SIDE */}
              <div className="flex items-center gap-3">

                {/* THEME TOGGLE */}
                <button
                  type="button"
                  aria-label="Toggle theme"
                  className="flex items-center justify-center rounded-xl border border-purple-100 bg-white p-2.5 text-gray-600 shadow-sm transition hover:border-purple-200 hover:bg-purple-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-gray-700 dark:hover:bg-gray-800"
                  onClick={toggleTheme}
                >
                  {isDark ? <Sun size={18} /> : <Moon size={18} />}
                </button>

                {/* USER INFORMATION */}
                <div className="hidden items-center gap-3 rounded-2xl border border-purple-100 bg-purple-50/60 px-4 py-2 transition hover:border-purple-200 dark:border-gray-800 dark:bg-gray-800/60 dark:hover:border-gray-700 md:flex">

                  {/* Profile image */}
                  <div className="h-9 w-9 overflow-hidden rounded-full border border-purple-200 bg-purple-100 dark:border-purple-900/60 dark:bg-purple-950/40">

                    {user?.profileImageUrl ? (
                      <img
                        src={user.profileImageUrl}
                        alt={`${user?.firstName || ''} ${
                          user?.lastName || ''
                        }`}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';

                          if (e.currentTarget.nextElementSibling) {
                            e.currentTarget.nextElementSibling.style.display =
                              'flex';
                          }
                        }}
                      />
                    ) : null}

                    <div
                      className={`
                        h-full
                        w-full
                        items-center
                        justify-center
                        text-purple-500
                        dark:text-purple-400

                        ${
                          user?.profileImageUrl
                            ? 'hidden'
                            : 'flex'
                        }
                      `}
                    >
                      <Users size={16} />
                    </div>

                  </div>

                  {/* User details */}
                  <div className="text-left">

                    <p className="text-sm font-medium leading-tight text-gray-900 dark:text-gray-100">
                      {user?.firstName || 'User'}{' '}
                      {user?.lastName || ''}
                    </p>

                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {user?.roles?.join(', ') || 'Employee'}
                    </p>

                  </div>

                </div>

                {/* LOGOUT */}
                <button
                  type="button"
                  className="flex items-center rounded-xl border border-purple-100 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 shadow-sm transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-rose-900/60 dark:hover:bg-rose-950/30 dark:hover:text-rose-400"
                  onClick={logout}
                >
                  <LogOut
                    size={18}
                    className="mr-2"
                  />

                  Logout
                </button>

              </div>

            </div>

          </header>

          {/* PAGE CONTENT */}
          <main className="flex-1 p-4 md:p-8">
            {children}
          </main>

        </div>

      </div>
    </div>
  );
}