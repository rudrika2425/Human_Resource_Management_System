import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Sparkles,
  User,
  Mail,
  Lock,
  AlertCircle,
  Database,
  FileStack,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function RegisterPage() {
  const auth = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);


  const onChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');

    const email = form.email.trim().toLowerCase();

    if (!email) {
      setError('Email is required');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!form.firstName.trim()) {
      setError('First name is required');
      return;
    }

    if (!form.lastName.trim()) {
      setError('Last name is required');
      return;
    }

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    

    /*
     * Important:
     * Your useAuth() hook must expose register().
     */
    if (typeof auth.register !== 'function') {
      console.error('useAuth() does not expose register().', auth);

      setError(
        'Registration service is not configured. Please check useAuth().'
      );

      return;
    }

    const payload = {
      email,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      password: form.password,
      
    };

    console.log('Registration payload:', payload);

    setLoading(true);

    try {
      await auth.register(payload);

      navigate('/login', {
        replace: true,
      });
    } catch (err) {
      console.error('Registration error:', err);

      console.error('Status:', err?.response?.status);

      console.error('Response:', err?.response?.data);

      const backendMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.response?.data?.data?.message;

      if (err?.response?.status === 403) {
        setError(
          backendMessage ||
            'This email is not authorized for registration.'
        );
      } else if (err?.response?.status === 409) {
        setError(
          backendMessage ||
            'An account with this email already exists.'
        );
      } else if (err?.response?.status === 400) {
        setError(
          backendMessage ||
            'Please check the registration details.'
        );
      } else {
        setError(
          backendMessage ||
            'Registration failed. Please try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-[#F8F6FC] to-purple-100 text-gray-900 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 dark:text-gray-100">
      <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-3 py-8 sm:px-4 sm:py-12">
        <div className="grid w-full max-w-6xl overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-2xl shadow-purple-200/40 dark:border-gray-800 dark:bg-gray-900 dark:shadow-black/40 sm:rounded-[2rem] lg:grid-cols-[1.1fr_0.9fr]">

          {/* Left panel — hidden below lg, unchanged above */}
          <div className="relative hidden overflow-hidden border-r border-purple-100 bg-gradient-to-br from-purple-600 via-purple-500 to-violet-600 p-8 text-white dark:border-gray-800 lg:block lg:p-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.18),_transparent_45%)]" />

            <div className="relative z-10 flex h-full flex-col justify-between">

              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-white">
                  <Sparkles size={20} />
                </div>

                <div>
                  <p className="text-sm text-white/70">
                    HRMS
                  </p>

                  <h1 className="text-2xl font-semibold">
                    Human Resource Management System
                  </h1>
                </div>
              </div>

              <div className="max-w-xl space-y-4">
                <p className="text-3xl font-semibold leading-tight xl:text-4xl">
                  Join the platform built for real HR teams.
                </p>

                <p className="text-white/80">
                  Create an account to manage employees, leave,
                  attendance, payroll, recruitment, documents,
                  notifications, and dashboards from a single
                  modular monolith.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm text-white/90">


               

                

              </div>
            </div>
          </div>

          {/* Right panel — form */}
          <div className="p-5 sm:p-8 lg:p-12">

            <div className="mb-6 sm:mb-8">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-purple-500 dark:text-purple-400">
                Create account
              </p>

              <h2 className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100 sm:text-3xl">
                Sign up for HRMS
              </h2>

              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Use the email assigned to you by HR.
              </p>
            </div>

            <form onSubmit={submit} className="space-y-5">

              {/* First / last name */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-400">
                    First name
                  </label>

                  <div className="relative">
                    <User
                      size={16}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-300 dark:text-purple-500"
                    />

                    <input
                      name="firstName"
                      className="w-full rounded-xl border border-purple-100 bg-purple-50/40 py-3 pl-9 pr-4 text-sm text-gray-900 outline-none placeholder:text-gray-400 transition focus:border-purple-300 focus:bg-white dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-purple-500 dark:focus:bg-gray-800"
                      value={form.firstName}
                      onChange={onChange}
                      placeholder="First Name"
                      autoComplete="given-name"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-400">
                    Last name
                  </label>

                  <div className="relative">
                    <User
                      size={16}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-300 dark:text-purple-500"
                    />

                    <input
                      name="lastName"
                      className="w-full rounded-xl border border-purple-100 bg-purple-50/40 py-3 pl-9 pr-4 text-sm text-gray-900 outline-none placeholder:text-gray-400 transition focus:border-purple-300 focus:bg-white dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-purple-500 dark:focus:bg-gray-800"
                      value={form.lastName}
                      onChange={onChange}
                      placeholder="Last Name"
                      autoComplete="family-name"
                    />
                  </div>
                </div>

              </div>

              {/* Email */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-400">
                  Email
                </label>

                <div className="relative">
                  <Mail
                    size={16}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-300 dark:text-purple-500"
                  />

                  <input
                    name="email"
                    type="email"
                    className="w-full rounded-xl border border-purple-100 bg-purple-50/40 py-3 pl-9 pr-4 text-sm text-gray-900 outline-none placeholder:text-gray-400 transition focus:border-purple-300 focus:bg-white dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-purple-500 dark:focus:bg-gray-800"
                    value={form.email}
                    onChange={onChange}
                    placeholder="exmaple@company.com"
                    autoComplete="email"
                    required
                  />
                </div>

                <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                  Your email must already be registered in the HRMS
                  employee database.
                </p>
              </div>

              {/* Password */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-400">
                  Password
                </label>

                <div className="relative">
                  <Lock
                    size={16}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-300 dark:text-purple-500"
                  />

                  <input
                    name="password"
                    type="password"
                    className="w-full rounded-xl border border-purple-100 bg-purple-50/40 py-3 pl-9 pr-4 text-sm text-gray-900 outline-none placeholder:text-gray-400 transition focus:border-purple-300 focus:bg-white dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-purple-500 dark:focus:bg-gray-800"
                    value={form.password}
                    onChange={onChange}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    required
                  />
                </div>
              </div>

              

              {/* Error */}
              {error ? (
                <div className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">
                  <AlertCircle size={16} className="shrink-0" />
                  {error}
                </div>
              ) : null}

              {/* Submit */}
              <button
                type="submit"
                className="w-full rounded-xl bg-purple-600 py-3 text-sm font-semibold text-white shadow-sm shadow-purple-200 transition hover:bg-purple-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 dark:shadow-black/30 dark:hover:bg-purple-500"
                disabled={loading}
              >
                {loading
                  ? 'Creating account...'
                  : 'Sign up'}
              </button>

              <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                Already have an account?{' '}

                <Link
                  to="/login"
                  className="font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                >
                  Sign in
                </Link>
              </p>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
}