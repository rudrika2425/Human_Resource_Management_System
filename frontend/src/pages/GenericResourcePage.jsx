import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import Spinner from '../components/Spinner';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';

const PencilIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="h-4 w-4"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
    />
  </svg>
);

const PlusIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="h-4 w-4"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 4.5v15m7.5-7.5h-15"
    />
  </svg>
);

function prettyValue(value) {
  if (value === null || value === undefined || value === '') {
    return '—';
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
}

export default function GenericResourcePage({
  title,
  endpoint,
  createPath,
  createLabel,
  editPath,
  roles = [],
  requiredRole = 'HR',
  showCreateButton = false,
}) {
  const navigate = useNavigate();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['resource', endpoint],
    queryFn: async () => (await api.get(endpoint)).data.data,
  });

  const rows = Array.isArray(data) ? data : data?.data || [];

  const normalizedRoles = roles.map((role) =>
    String(role).replace(/^ROLE_/, '').trim().toUpperCase()
  );

  const isHR = normalizedRoles.includes('HR');

  const hasRequiredRole = normalizedRoles.includes(
    String(requiredRole).replace(/^ROLE_/, '').trim().toUpperCase()
  );

  const shouldShowCreateButton =
    showCreateButton || (createPath && hasRequiredRole);

  if (isLoading) {
    return <Spinner label={`Loading ${title.toLowerCase()}...`} />;
  }

  if (error) {
    return (
      <ErrorState
        description={`Unable to load ${title.toLowerCase()}.`}
        onRetry={refetch}
      />
    );
  }

  const singularTitle = title.replace(/s$/, '');

  const header = (
    <div className="flex items-center justify-between border-b border-black/10 pb-5 dark:border-white/10">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-purple-500 dark:text-purple-400">
          Module
        </p>

        <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
          {title}
        </h1>
      </div>

      {shouldShowCreateButton && (
        <div className="flex items-center gap-3">
          {title.toLowerCase() === 'departments' && (
            <button
              type="button"
              className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-purple-200 transition hover:bg-purple-700 dark:shadow-black/30"
              onClick={() => navigate('/departments/create')}
            >
              <PlusIcon />
              Add Department
            </button>
          )}

          {title.toLowerCase() === 'designations' && (
            <button
              type="button"
              className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-purple-200 transition hover:bg-purple-700 dark:shadow-black/30"
              onClick={() => navigate('/designations/create')}
            >
              <PlusIcon />
              Add Designation
            </button>
          )}

          {!['departments', 'designations'].includes(
            title.toLowerCase()
          ) && (
            <button
              type="button"
              className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-purple-200 transition hover:bg-purple-700 dark:shadow-black/30"
              onClick={() => navigate(createPath)}
            >
              <PlusIcon />
              {createLabel || `Add ${singularTitle}`}
            </button>
          )}
        </div>
      )}
    </div>
  );

  if (!rows.length) {
    return (
      <div className="min-h-screen space-y-6 bg-gradient-to-b from-purple-50 via-[#F8F6FC] to-purple-50 p-6 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        {header}

        <EmptyState
          title={`No ${title.toLowerCase()} found`}
          description={`Add a record to see ${title.toLowerCase()} here.`}
        />
      </div>
    );
  }

  const columns = Object.keys(rows[0]).slice(0, 6);

  return (
    <div className="min-h-screen space-y-6 bg-gradient-to-b from-purple-50 via-[#F8F6FC] to-purple-50 p-6 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {header}

      <div className="overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-sm shadow-purple-100/50 dark:border-gray-800 dark:bg-gray-900 dark:shadow-black/30">
        <table className="min-w-full divide-y divide-purple-100 text-sm dark:divide-gray-800">
          <thead className="bg-purple-50 text-left text-gray-900 dark:bg-gray-800/60 dark:text-gray-100">
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.15em]"
                >
                  {column.toLowerCase() === 'active'
                    ? 'Status'
                    : column}
                </th>
              ))}

              {editPath && isHR && (
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.15em]">
                  Actions
                </th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-purple-100 dark:divide-gray-800">
            {rows.map((row) => (
              <tr
                key={row.id || JSON.stringify(row)}
                className="transition hover:bg-purple-50/60 dark:hover:bg-gray-800/50"
              >
                {columns.map((column) => {
                  const value = row[column];

                  if (column.toLowerCase() === 'active') {
                    return (
                      <td
                        key={column}
                        className="px-4 py-3"
                      >
                        {value ? (
                          <span className="inline-flex cursor-default items-center rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-500/10 dark:text-green-400">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex cursor-default items-center rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 dark:bg-red-500/10 dark:text-red-400">
                            Disabled
                          </span>
                        )}
                      </td>
                    );
                  }

                  return (
                    <td
                      key={column}
                      className="px-4 py-3 text-gray-700 dark:text-gray-300"
                    >
                      {typeof value === 'string' &&
                      /status|type/i.test(column) ? (
                        <StatusBadge value={value} />
                      ) : (
                        prettyValue(value)
                      )}
                    </td>
                  );
                })}

                {editPath && isHR && (
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(editPath(row));
                      }}
                      className="inline-flex items-center justify-center rounded-lg p-1.5 text-purple-600 transition hover:bg-purple-100 hover:text-purple-700 dark:text-purple-400 dark:hover:bg-purple-500/10 dark:hover:text-purple-300"
                      title={`Edit ${singularTitle}`}
                    >
                      <PencilIcon />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}