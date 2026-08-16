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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-[#F8F6FC] to-purple-100 text-gray-900">
      <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 py-12">
        <div className="grid w-full max-w-6xl overflow-hidden rounded-[2rem] border border-purple-100 bg-white shadow-2xl shadow-purple-200/40 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="relative hidden overflow-hidden border-r border-purple-100 bg-gradient-to-br from-purple-600 via-purple-500 to-violet-600 p-10 text-white lg:block">
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
                <p className="text-4xl font-semibold leading-tight">Premium HR operations, built for real teams.</p>
                <p className="text-white/80">Manage employees, leave, attendance, payroll, recruitment, documents, notifications, and dashboards from a single modular monolith.</p>
              </div>
              
            </div>
          </div>

          <div className="p-8 lg:p-12">
            <div className="mb-8">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-purple-500">Secure access</p>
              <h2 className="mt-2 text-3xl font-bold text-gray-900">Sign in to HRMS</h2>
              <p className="mt-2 text-sm text-gray-500">Use the seeded local admin account on first run.</p>
            </div>

            <form onSubmit={submit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-600">Email</label>
                <input
                  className="w-full rounded-xl border border-purple-100 bg-purple-50/40 px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 transition focus:border-purple-300 focus:bg-white"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                  placeholder="abcd@gmail.com"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-600">Password</label>
                <input
                  type="password"
                  className="w-full rounded-xl border border-purple-100 bg-purple-50/40 px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 transition focus:border-purple-300 focus:bg-white"
                  value={form.password}
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
                  placeholder="password@1234"
                />
              </div>
              {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
              <button
                className="w-full rounded-xl bg-purple-600 py-3 text-sm font-semibold text-white shadow-sm shadow-purple-200 transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>

              <p className="text-center text-sm text-gray-500">
                Don&apos;t have an account?{' '}
                <Link to="/register" className="font-medium text-purple-600 hover:text-purple-700">
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