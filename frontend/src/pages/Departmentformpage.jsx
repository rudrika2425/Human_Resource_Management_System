import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api';
import { useQuery } from '@tanstack/react-query';
import Spinner from '../components/Spinner';
import ErrorState from '../components/ErrorState';

const initialForm = {
  name: '',
  description: '',
  managerId: '',
  active: true,
};

export default function DepartmentFormPage({ mode }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const { data, isLoading, error: loadError } = useQuery({
    queryKey: ['department', id],
    enabled: mode === 'edit' && Boolean(id),
    queryFn: async () =>
      (await api.get(`/api/v1/departments/${id}`)).data.data,
  });

  useEffect(() => {
    if (data) {
      setForm({
        ...initialForm,
        ...data,
        managerId: data.managerId || '',
      });
    }
  }, [data]);

  if (mode === 'edit' && isLoading) {
    return <Spinner label="Loading department..." />;
  }

  if (loadError) {
    return (
      <ErrorState
        description="Unable to load the department record."
      />
    );
  }

  const onChange = (event) => {
    const { name, value, type, checked } = event.target;

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
      managerId: form.managerId ? Number(form.managerId) : null,
    };

    try {
      if (mode === 'create') {
        await api.post('/api/v1/departments', payload);
      } else {
        await api.put(`/api/v1/departments/${id}`, payload);
      }

      navigate('/departments');
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          'Unable to save department'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto min-h-screen max-w-3xl space-y-4 sm:space-y-6 bg-gradient-to-b from-purple-50 via-[#F8F6FC] to-purple-50 p-4 sm:p-6 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">

      {}
      <div className="border-b border-black/10 pb-4 sm:pb-5 dark:border-white/10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] sm:tracking-[0.3em] text-purple-500 dark:text-purple-400">
          Organization
        </p>

        <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
          {mode === 'create'
            ? 'Create department'
            : 'Edit department'}
        </h1>
      </div>

      {}
      <form
        onSubmit={submit}
        className="space-y-6 rounded-2xl border border-purple-100 bg-white p-4 sm:p-6 shadow-sm shadow-purple-100/50 dark:border-gray-800 dark:bg-gray-900 dark:shadow-black/30"
      >

        <div className="grid gap-4 sm:grid-cols-2">

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">
              Name
            </label>

            <input
              name="name"
              type="text"
              className="w-full rounded-xl border border-purple-100 bg-purple-50/40 px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 transition focus:border-purple-300 focus:bg-white dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-purple-500 dark:focus:bg-gray-800"
              value={form.name}
              onChange={onChange}
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">
              Manager ID
            </label>

            <input
              name="managerId"
              type="text"
              className="w-full rounded-xl border border-purple-100 bg-purple-50/40 px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 transition focus:border-purple-300 focus:bg-white dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-purple-500 dark:focus:bg-gray-800"
              value={form.managerId}
              onChange={onChange}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">
              Description
            </label>

            <textarea
              name="description"
              rows={4}
              className="w-full rounded-xl border border-purple-100 bg-purple-50/40 px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 transition focus:border-purple-300 focus:bg-white dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-purple-500 dark:focus:bg-gray-800"
              value={form.description || ''}
              onChange={onChange}
            />
          </div>

        </div>

        {}
        <label className="flex items-center gap-3 text-sm font-medium text-gray-600 dark:text-gray-300">
          <input
            type="checkbox"
            name="active"
            checked={form.active}
            onChange={onChange}
            className="h-4 w-4 rounded border-purple-200 text-purple-600 focus:ring-purple-400 dark:border-gray-600 dark:bg-gray-800 dark:focus:ring-purple-500 dark:focus:ring-offset-gray-900"
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
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 border-t border-black/10 pt-5 dark:border-white/10">
          <button
            type="button"
            className="rounded-xl border border-purple-100 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-purple-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
            onClick={() => navigate('/departments')}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-purple-200 transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60 dark:shadow-black/30 dark:hover:bg-purple-500"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save department'}
          </button>
        </div>

      </form>
    </div>
  );
}