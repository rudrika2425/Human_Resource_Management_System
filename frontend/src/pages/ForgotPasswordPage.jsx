import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../services/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      await api.post('/auth/forgot-password', { email });
      setSuccess(true);
      toast.success('Password reset link sent to your email!');
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to send reset link';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-[#F8F6FC] to-purple-100">
      <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 py-12">
        <div className="w-full max-w-md overflow-hidden rounded-[2rem] border border-purple-100 bg-white shadow-2xl shadow-purple-200/40">
          {/* Header with purple gradient */}
          <div className="bg-gradient-to-r from-purple-600 via-purple-500 to-violet-600 px-8 py-6 text-center">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
              <Mail className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">Reset Password</h2>
            <p className="mt-1 text-sm text-purple-100">
              Enter your email to receive a reset link
            </p>
          </div>

          <div className="p-8">
            {success ? (
              <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-green-800">Check your email</h3>
                <p className="mt-1 text-sm text-green-700">
                  We've sent a password reset link to <br />
                  <span className="font-medium">{email}</span>
                </p>
                <div className="mt-3 rounded-lg bg-green-100/50 px-4 py-2">
                  <p className="text-xs text-green-600">
                    ⏰ The link will expire in 15 minutes
                  </p>
                </div>
                <Link
                  to="/login"
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-purple-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-purple-700"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to login
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      className="w-full rounded-xl border border-purple-200 bg-purple-50/50 py-3 pl-10 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-purple-400 focus:bg-white focus:ring-2 focus:ring-purple-200"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    Enter the email associated with your account
                  </p>
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
                      Sending...
                    </span>
                  ) : (
                    'Send Reset Link'
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