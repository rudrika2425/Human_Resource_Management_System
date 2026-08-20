import { useQuery } from '@tanstack/react-query';
import {
  IdCard,
  User,
  Briefcase,
  GraduationCap,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Building2,
  UserSquare2,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { api } from '../services/api';
import Spinner from '../components/Spinner';
import ErrorState from '../components/ErrorState';
import { useAuth } from '../hooks/useAuth';

const cardClass =
  'rounded-2xl border border-purple-100 bg-white shadow-sm shadow-purple-100/50 dark:border-gray-800 dark:bg-gray-900 dark:shadow-black/30';

function formatDate(value) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function ProfilePage() {
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ['me'],
    queryFn: async () => (await api.get('/api/v1/auth/me')).data.data,
  });

  if (isLoading) {
    return <Spinner label="Loading profile..." />;
  }

  if (error) {
    return <ErrorState description="Unable to load profile." />;
  }

  const profile = data || user;

  const fullName = `${profile?.firstName || ''} ${
    profile?.lastName || ''
  }`.trim();

  return (
    <div className="mx-auto max-w-5xl space-y-6 bg-gradient-to-b from-purple-50 via-[#F8F6FC] to-purple-50 p-4 sm:p-6 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">

      {}
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-purple-100 bg-white shadow-sm shadow-purple-100/50 dark:border-gray-800 dark:bg-gray-900 dark:shadow-black/30">
          <IdCard size={20} className="text-purple-500 dark:text-purple-400" strokeWidth={1.75} />
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-purple-500 dark:text-purple-400">
            Account
          </p>

          <h1 className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-100">
            My Profile
          </h1>
        </div>
      </div>

      <p className="-mt-4 text-gray-500 dark:text-gray-400">
        View your personal and employment information.
      </p>

      {}
      <div className={`${cardClass} overflow-hidden`}>

        <div className="h-20 bg-gradient-to-r from-purple-200/60 via-purple-100/40 to-transparent dark:from-purple-500/10 dark:via-purple-500/5 dark:to-transparent" />

        <div className="-mt-12 p-4 sm:p-6">

          <div className="flex flex-col gap-6 sm:flex-row sm:items-end">

            {}
            <div className="shrink-0">

              {profile?.profileImageUrl ? (
                <img
                  src={profile.profileImageUrl}
                  alt={fullName || 'Profile'}
                  className="h-28 w-28 rounded-full object-cover border-4 border-white shadow-xl ring-1 ring-purple-100 sm:h-32 sm:w-32 dark:border-gray-900 dark:ring-gray-800"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling.style.display = 'flex';
                  }}
                />
              ) : null}

              {}
              <div
                className={`h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-purple-200 to-purple-100 border-4 border-white shadow-xl ring-1 ring-purple-100 text-4xl font-semibold text-purple-700 sm:h-32 sm:w-32 dark:from-purple-500/30 dark:to-purple-500/10 dark:border-gray-900 dark:ring-gray-800 dark:text-purple-300 ${
                  profile?.profileImageUrl ? 'hidden' : 'flex'
                }`}
              >
                {profile?.firstName?.charAt(0)?.toUpperCase()}
                {profile?.lastName?.charAt(0)?.toUpperCase()}
              </div>

            </div>

            {}
            <div className="flex-1 pb-1">

              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                {fullName}
              </h2>

              <p className="mt-1 flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                <Briefcase size={14} className="text-gray-400 dark:text-gray-500" />
                {profile?.designationName || 'Employee'}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">

                {profile?.employeeCode && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 border border-purple-100 px-3 py-1 text-xs text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    <IdCard size={12} />
                    {profile.employeeCode}
                  </span>
                )}

                {profile?.roles?.map((role) => (
                  <span
                    key={role}
                    className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-xs text-purple-700 dark:bg-purple-500/15 dark:text-purple-300"
                  >
                    <ShieldCheck size={12} />
                    {role}
                  </span>
                ))}

                {profile?.active && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-100 px-3 py-1 text-xs text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Active
                  </span>
                )}

              </div>

            </div>

          </div>

        </div>
      </div>

      {}
      <section className={`${cardClass} p-4 sm:p-6`}>

        <div className="mb-5 flex items-center gap-2.5">
          <User size={16} className="text-purple-500 dark:text-purple-400" />

          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Personal Information
          </h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">

          <Info
            label="First Name"
            value={profile?.firstName}
          />

          <Info
            label="Last Name"
            value={profile?.lastName}
          />

          <Info
            icon={Mail}
            label="Email"
            value={profile?.email}
          />

          <Info
            icon={Phone}
            label="Phone"
            value={profile?.phone}
          />

          <Info
            icon={Calendar}
            label="Date of Birth"
            value={formatDate(profile?.dateOfBirth) || profile?.dateOfBirth}
          />

          <Info
            icon={Users}
            label="Emergency Contact"
            value={profile?.emergencyContact}
          />

          <div className="sm:col-span-2">
            <Info
              icon={MapPin}
              label="Address"
              value={profile?.address}
            />
          </div>

        </div>

      </section>

      {}
      <section className={`${cardClass} p-4 sm:p-6`}>

        <div className="mb-5 flex items-center gap-2.5">
          <Briefcase size={16} className="text-purple-500 dark:text-purple-400" />

          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Employment Information
          </h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">

          <Info
            icon={IdCard}
            label="Employee ID"
            value={profile?.employeeCode}
          />

          <Info
            icon={ShieldCheck}
            label="Role"
            value={profile?.assignedRole}
          />

          <Info
            icon={Building2}
            label="Department"
            value={profile?.departmentName}
          />

          <Info
            icon={UserSquare2}
            label="Designation"
            value={profile?.designationName}
          />

          <Info
            icon={Calendar}
            label="Joining Date"
            value={formatDate(profile?.joiningDate) || profile?.joiningDate}
          />

          <Info
            label="Employment Type"
            value={profile?.employmentType}
          />

          <Info
            label="Employment Status"
            value={profile?.employmentStatus}
          />

          <Info
            icon={MapPin}
            label="Work Location"
            value={profile?.workLocation}
          />

          <Info
            icon={Users}
            label="Manager"
            value={profile?.managerName}
          />

        </div>

      </section>

      {}
      <section className={`${cardClass} p-4 sm:p-6`}>

        <div className="mb-5 flex items-center gap-2.5">
          <GraduationCap size={16} className="text-purple-500 dark:text-purple-400" />

          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Professional Information
          </h2>
        </div>

        <div className="space-y-5">

          <Info
            label="Skills"
            value={profile?.skills}
          />

          <Info
            label="Education"
            value={profile?.education}
          />

          <Info
            label="Experience"
            value={profile?.experience}
          />

        </div>

      </section>

    </div>
  );
}

function Info({ label, value, icon: Icon }) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
        {Icon ? <Icon size={13} className="text-gray-400 dark:text-gray-500" /> : null}
        {label}
      </p>

      <p className="mt-1 break-words text-base text-gray-900 dark:text-gray-100">
        {value || <span className="text-gray-300 dark:text-gray-600">Not provided</span>}
      </p>
    </div>
  );
}