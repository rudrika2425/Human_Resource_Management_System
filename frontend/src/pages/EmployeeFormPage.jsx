import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api';
import { useQuery } from '@tanstack/react-query';
import { Calendar } from 'lucide-react';
import Spinner from '../components/Spinner';
import ErrorState from '../components/ErrorState';

const initialForm = {
  employeeId: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  profileImageUrl: '',
  dateOfBirth: '',
  address: '',
  emergencyContact: '',
  joiningDate: '',
  departmentId: '',
  designationId: '',
  managerId: '',
  assignedRole: 'EMPLOYEE',
  employmentType: 'FULL_TIME',
  employmentStatus: 'ACTIVE',
  workLocation: '',
  skills: '',
  education: '',
  experience: '',
  active: true,
};

const dateFields = ['dateOfBirth', 'joiningDate'];

export default function EmployeeFormPage({ mode }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const dateInputRefs = useRef({});

  const openDatePicker = (field) => {
    const input = dateInputRefs.current[field];

    if (input?.showPicker) {
      input.showPicker();
    } else {
      input?.focus();
    }
  };

  const {
    data,
    isLoading,
    error: loadError,
  } = useQuery({
    queryKey: ['employee', id],
    enabled: mode === 'edit' && Boolean(id),
    queryFn: async () =>
      (await api.get(`/api/v1/employees/${id}`)).data.data,
  });

  useEffect(() => {
    if (data) {
      setForm({
        ...initialForm,
        ...data,

        departmentId: data.departmentId || '',
        designationId: data.designationId || '',
        managerId: data.managerId || '',

        assignedRole: data.assignedRole || 'EMPLOYEE',

        dateOfBirth: data.dateOfBirth || '',
        joiningDate: data.joiningDate || '',
      });
    }
  }, [data]);

  if (mode === 'edit' && isLoading) {
    return <Spinner />;
  }

  if (loadError) {
    return <ErrorState error={loadError} />;
  }

  const onChange = (event) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const submit = async (event) => {
    event.preventDefault();

    setSaving(true);
    setError('');

    const payload = {
      ...form,

      departmentId: form.departmentId
        ? Number(form.departmentId)
        : null,

      designationId: form.designationId
        ? Number(form.designationId)
        : null,

      managerId: form.managerId
        ? Number(form.managerId)
        : null,

      assignedRole: form.assignedRole,

      dateOfBirth: form.dateOfBirth || null,

      joiningDate: form.joiningDate || null,
    };

    console.log('Employee payload:', payload);

    try {
      if (mode === 'create') {
        await api.post(
          '/api/v1/employees',
          payload
        );
      } else {
        await api.put(
          `/api/v1/employees/${id}`,
          payload
        );
      }

      navigate('/employees');
    } catch (err) {
      console.error('Employee save error:', err);

      setError(
        err?.response?.data?.message ||
          'Unable to save employee'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen space-y-6 bg-gradient-to-b from-purple-50 via-[#F8F6FC] to-purple-50 p-4 sm:p-6 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">

      {}
      <div className="border-b border-black/10 pb-5 dark:border-white/10">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-purple-500 dark:text-purple-400">
          People
        </p>

        <h1 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-100">
          {mode === 'create'
            ? 'Create employee'
            : 'Edit employee'}
        </h1>
      </div>

      {}
      <form
        onSubmit={submit}
        className="space-y-6 rounded-2xl border border-purple-100 bg-white p-4 shadow-sm shadow-purple-100/50 sm:p-6 dark:border-gray-800 dark:bg-gray-900 dark:shadow-black/30"
      >

        {}
        <div className="grid gap-4 sm:grid-cols-2">

          {[
            'employeeId',
            'firstName',
            'lastName',
            'email',
            'phone',
            'profileImageUrl',
            'dateOfBirth',
            'address',
            'emergencyContact',
            'joiningDate',
            'departmentId',
            'designationId',
            'managerId',
            'workLocation',
          ].map((field) => {
            const isDateField = dateFields.includes(field);

            return (
              <div key={field}>

                <label className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-400">
                  {field}
                </label>

                <div className="relative">

                  <input
                    ref={
                      isDateField
                        ? (el) => (dateInputRefs.current[field] = el)
                        : undefined
                    }

                    name={field}

                    type={isDateField ? 'date' : 'text'}

                    className={`w-full rounded-xl border border-purple-100 bg-purple-50/40 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 transition focus:border-purple-300 focus:bg-white dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-purple-500 dark:focus:bg-gray-800 ${
                      isDateField
                        ? 'pl-4 pr-10 [&::-webkit-calendar-picker-indicator]:opacity-0'
                        : 'px-4'
                    }`}

                    value={form[field] || ''}

                    onChange={onChange}
                  />

                  {isDateField ? (
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => openDatePicker(field)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400 transition hover:text-purple-600 dark:text-purple-400 dark:hover:text-purple-300"
                    >
                      <Calendar size={16} strokeWidth={1.75} />
                    </button>
                  ) : null}

                </div>

              </div>
            );
          })}

          {}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-400">
              Assigned role
            </label>

            <select
              name="assignedRole"
              className="w-full rounded-xl border border-purple-100 bg-purple-50/40 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-purple-300 focus:bg-white dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-100 dark:focus:border-purple-500 dark:focus:bg-gray-800"
              value={form.assignedRole}
              onChange={onChange}
            >
              <option value="EMPLOYEE">
                EMPLOYEE
              </option>

              <option value="MANAGER">
                MANAGER
              </option>

              <option value="HR">
                HR
              </option>
            </select>
          </div>

          {}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-400">
              Employment type
            </label>

            <select
              name="employmentType"
              className="w-full rounded-xl border border-purple-100 bg-purple-50/40 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-purple-300 focus:bg-white dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-100 dark:focus:border-purple-500 dark:focus:bg-gray-800"
              value={form.employmentType}
              onChange={onChange}
            >
              <option value="FULL_TIME">
                FULL_TIME
              </option>

              <option value="PART_TIME">
                PART_TIME
              </option>

              <option value="CONTRACT">
                CONTRACT
              </option>

              <option value="INTERN">
                INTERN
              </option>
            </select>
          </div>

          {}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-400">
              Employment status
            </label>

            <select
              name="employmentStatus"
              className="w-full rounded-xl border border-purple-100 bg-purple-50/40 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-purple-300 focus:bg-white dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-100 dark:focus:border-purple-500 dark:focus:bg-gray-800"
              value={form.employmentStatus}
              onChange={onChange}
            >
              <option value="ACTIVE">
                ACTIVE
              </option>

              <option value="INACTIVE">
                INACTIVE
              </option>

              <option value="ON_LEAVE">
                ON_LEAVE
              </option>

              <option value="PROBATION">
                PROBATION
              </option>

              <option value="TERMINATED">
                TERMINATED
              </option>
            </select>
          </div>

        </div>

        {}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

          {[
            'skills',
            'education',
            'experience',
          ].map((field) => (
            <div
              key={field}
              className="lg:col-span-1"
            >

              <label className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-400">
                {field}
              </label>

              <textarea
                name={field}
                rows={5}
                className="w-full rounded-xl border border-purple-100 bg-purple-50/40 px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 transition focus:border-purple-300 focus:bg-white dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-purple-500 dark:focus:bg-gray-800"
                value={form[field] || ''}
                onChange={onChange}
              />

            </div>
          ))}

        </div>

        {}
        <label className="flex items-center gap-3 text-sm font-medium text-gray-600 dark:text-gray-400">

          <input
            type="checkbox"
            name="active"
            checked={form.active}
            onChange={onChange}
            className="h-4 w-4 rounded border-purple-200 text-purple-600 focus:ring-purple-400 dark:border-gray-600 dark:bg-gray-800 dark:focus:ring-purple-500"
          />

          Active

        </label>

        {}
        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">
            {error}
          </div>
        ) : null}

        {}
        <div className="flex flex-col-reverse justify-end gap-3 border-t border-black/10 pt-5 sm:flex-row dark:border-white/10">

          <button
            type="button"
            className="rounded-xl border border-purple-100 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-purple-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
            onClick={() => navigate('/employees')}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-purple-200 transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60 dark:shadow-black/30 dark:hover:bg-purple-500"
            disabled={saving}
          >
            {saving
              ? 'Saving...'
              : 'Save employee'}
          </button>

        </div>

      </form>
    </div>
  );
}