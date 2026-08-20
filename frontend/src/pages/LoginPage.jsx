import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(form);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-[#F8F6FC] to-purple-100 text-gray-900 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 dark:text-gray-100">
      <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-3 py-8 sm:px-4 sm:py-12">
        <div className="grid w-full max-w-6xl overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-2xl shadow-purple-200/40 dark:border-gray-800 dark:bg-gray-900 dark:shadow-black/40 sm:rounded-[2rem] lg:grid-cols-[1.1fr_0.9fr]">
          <div className="relative hidden overflow-hidden border-r border-purple-100 bg-gradient-to-br from-purple-600 via-purple-500 to-violet-600 p-8 text-white dark:border-gray-800 lg:block lg:p-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.18),_transparent_45%)]" />
            <div className="relative z-10 flex h-full flex-col justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-white"><Sparkles size={20} /></div>
                <div>
                  <p className="text-sm text-white/70">HRMS</p>
                  <h1 className="text-2xl font-semibold">Human Resource Management System</h1>
                </div>
              </div>
              <div className="max-w-xl space-y-4">
                <p className="text-3xl font-semibold leading-tight xl:text-4xl">Premium HR operations, built for real teams.</p>
                <p className="text-white/80">Manage employees, leave, attendance, payroll, recruitment, documents, notifications, and dashboards from a single modular monolith.</p>
              </div>
              
            </div>
          </div>

          <div className="p-5 sm:p-8 lg:p-12">
            <div className="mb-6 sm:mb-8">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-purple-500 dark:text-purple-400">Secure access</p>
              <h2 className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100 sm:text-3xl">Sign in to HRMS</h2>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Use the seeded local admin account on first run.</p>
            </div>

            <form onSubmit={submit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-400">Email</label>
                <input
                  className="w-full rounded-xl border border-purple-100 bg-purple-50/40 px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 transition focus:border-purple-300 focus:bg-white dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-purple-500 dark:focus:bg-gray-800"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                  placeholder="abcd@gmail.com"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-400">Password</label>
                <input
                  type="password"
                  className="w-full rounded-xl border border-purple-100 bg-purple-50/40 px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 transition focus:border-purple-300 focus:bg-white dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-purple-500 dark:focus:bg-gray-800"
                  value={form.password}
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
                  placeholder="password@1234"
                />
              </div>
              {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">{error}</div> : null}
              <button
                className="w-full rounded-xl bg-purple-600 py-3 text-sm font-semibold text-white shadow-sm shadow-purple-200 transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60 dark:shadow-black/30 dark:hover:bg-purple-500"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
              <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
                <Link to="/forgot-password" className="font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300">
                  Forgot password?
                </Link>
              </p>

              <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                Don&apos;t have an account?{' '}
                <Link to="/register" className="font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300">
                  Sign up
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}