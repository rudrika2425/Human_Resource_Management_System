import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';  // ✅ v6 syntax
import { Lock, CheckCircle, AlertCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import api from '../services/api';
import { toast } from 'react-hot-toast';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();  // ✅ v6: useSearchParams
  const navigate = useNavigate();  // ✅ v6: useNavigate
  const token = searchParams.get('token');

  const [form, setForm] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(true);

  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      setError('No reset token provided');
      toast.error('Invalid reset link');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.newPassword !== form.confirmPassword) {
      setError('Passwords do not match');
      toast.error('Passwords do not match');
      return;
    }

    if (form.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/api/v1/auth/reset-password', {
        token: token,
        newPassword: form.newPassword,
        confirmPassword: form.confirmPassword,
      });
      setSuccess(true);
      toast.success('Password reset successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 3000);  // ✅ v6: navigate
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to reset password';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // If token is invalid
  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-[#F8F6FC] to-purple-100">
        <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 py-12">
          <div className="w-full max-w-md overflow-hidden rounded-[2rem] border border-purple-100 bg-white shadow-2xl shadow-purple-200/40 p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-100">
              <AlertCircle className="h-8 w-8 text-rose-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Invalid Reset Link</h2>
            <p className="mt-2 text-gray-500">
              The password reset link is missing or invalid.
            </p>
            <Link
              to="/forgot-password"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-purple-200 transition hover:scale-[1.02] hover:shadow-purple-300"
            >
              <ArrowLeft className="h-4 w-4" />
              Request new reset link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-[#F8F6FC] to-purple-100">
      <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 py-12">
        <div className="w-full max-w-md overflow-hidden rounded-[2rem] border border-purple-100 bg-white shadow-2xl shadow-purple-200/40">
          {/* Header with purple gradient */}
          <div className="bg-gradient-to-r from-purple-600 via-purple-500 to-violet-600 px-8 py-6 text-center">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
              <Lock className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">Create New Password</h2>
            <p className="mt-1 text-sm text-purple-100">
              Enter your new password below
            </p>
          </div>

          <div className="p-8">
            {success ? (
              <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-green-800">
                  Password Reset Successful!
                </h3>
                <p className="mt-1 text-sm text-green-700">
                  Your password has been reset successfully.
                </p>
                <p className="mt-1 text-xs text-green-600">
                  Redirecting to login...
                </p>
                <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-green-200">
                  <div className="h-full w-full animate-pulse bg-green-500" />
                </div>
                <Link
                  to="/login"
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-purple-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-purple-700"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Go to login
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    New Password
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="w-full rounded-xl border border-purple-200 bg-purple-50/50 py-3 pl-10 pr-12 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-purple-400 focus:bg-white focus:ring-2 focus:ring-purple-200"
                      placeholder="Enter new password"
                      value={form.newPassword}
                      onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    Must be at least 6 characters
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      className="w-full rounded-xl border border-purple-200 bg-purple-50/50 py-3 pl-10 pr-12 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-purple-400 focus:bg-white focus:ring-2 focus:ring-purple-200"
                      placeholder="Confirm new password"
                      value={form.confirmPassword}
                      onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {form.newPassword && form.confirmPassword && (
                    <p className={`mt-1 text-xs ${form.newPassword === form.confirmPassword ? 'text-green-600' : 'text-rose-600'}`}>
                      {form.newPassword === form.confirmPassword ? (
                        <span className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Passwords match
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Passwords do not match
                        </span>
                      )}
                    </p>
                  )}
                </div>

                {error && (
                  <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-purple-600 via-purple-500 to-violet-600 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-200 transition duration-300 hover:scale-[1.02] hover:shadow-purple-300 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        className="h-5 w-5 animate-spin text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Resetting Password...
                    </span>
                  ) : (
                    'Reset Password'
                  )}
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-purple-100" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white px-2 text-gray-400">or</span>
                  </div>
                </div>

                <Link
                  to="/login"
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-purple-200 bg-white py-2.5 text-sm font-medium text-purple-600 transition hover:bg-purple-50 hover:border-purple-300"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to login
                </Link>
              </form>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-purple-100 bg-purple-50/30 px-8 py-4 text-center">
            <p className="text-xs text-gray-400">
              Need help? Contact your HR department
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}