import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Wallet,
  Calendar,
  User,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertCircle,
  FileText,
  Sparkles,
  Landmark,
} from 'lucide-react';
import { api } from '../services/api';
import Spinner from '../components/Spinner';
import ErrorState from '../components/ErrorState';

const currentMonth = new Date().toISOString().slice(0, 7);

const emptyStructure = {
  basicSalary: '',
  allowances: '',
  deductions: '',
  bonuses: '',
};

const cardClass =
  'rounded-2xl border border-purple-100 bg-white shadow-sm shadow-purple-100/50';

/*
 * ---------------------------------------------------------
 * Helpers
 * ---------------------------------------------------------
 */

function getRole(user) {
  if (!user) return '';

  const role =
    user.role ||
    user.assignedRole ||
    user.userRole ||
    (Array.isArray(user.roles) ? user.roles[0] : '') ||
    (Array.isArray(user.authorities)
      ? user.authorities[0]?.authority
      : '') ||
    '';

  return String(role)
    .replace(/^ROLE_/, '')
    .toUpperCase();
}

function getEmployeeId(user) {
  if (!user) return null;

  return (
    user.employeeId ??
    user.employee?.id ??
    user.employee?.employeeId ??
    null
  );
}

function getEmployeeObject(user) {
  if (!user) return null;

  return (
    user.employee ??
    user.employeeDetails ??
    user.employeeData ??
    null
  );
}

function money(value) {
  const amount = Number(value || 0);

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
}

function initials(first, last) {
  return `${(first || '')[0] || ''}${(last || '')[0] || ''}`.toUpperCase();
}

/*
 * ---------------------------------------------------------
 * UI Components
 * ---------------------------------------------------------
 */

function StatCard({
  label,
  value,
  description,
  icon: Icon,
  tone = 'default',
}) {
  const toneStyles = {
    default: 'text-gray-900',
    positive: 'text-emerald-600',
    negative: 'text-rose-600',
  };

  return (
    <div
      className={`${cardClass} group relative overflow-hidden p-5 transition duration-200 hover:border-purple-200`}
    >
      <div className="flex items-start justify-between">
        <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
          {label}
        </p>

        {Icon ? (
          <Icon
            size={16}
            className="text-purple-300 transition group-hover:text-purple-500"
            strokeWidth={1.75}
          />
        ) : null}
      </div>

      <p
        className={`mt-3 text-2xl font-semibold tabular-nums ${toneStyles[tone]}`}
      >
        {value}
      </p>

      {description ? (
        <p className="mt-1 text-sm text-gray-400">
          {description}
        </p>
      ) : null}
    </div>
  );
}

function Field({ label, name, value, onChange }) {
  return (
    <div>
      <label className="mb-2 block text-sm text-gray-600">
        {label}
      </label>

      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400">
          ₹
        </span>

        <input
          type="number"
          min="0"
          step="0.01"
          name={name}
          value={value}
          onChange={onChange}
          className="w-full rounded-xl border border-purple-100 bg-white py-2.5 pl-7 pr-3 text-sm text-gray-900 tabular-nums shadow-sm transition placeholder:text-gray-300 focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-100"
          placeholder="0.00"
        />
      </div>
    </div>
  );
}

/*
 * ---------------------------------------------------------
 * Payroll Page
 * ---------------------------------------------------------
 */

export default function PayrollPage() {
  const queryClient = useQueryClient();

  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [payrollMonth, setPayrollMonth] = useState(currentMonth);

  const [structureForm, setStructureForm] =
    useState(emptyStructure);

  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  /*
   * -------------------------------------------------------
   * Authenticated user
   *
   * Backend /me is the source of truth.
   * -------------------------------------------------------
   */

  const {
    data: meUser,
    isLoading: meLoading,
    error: meError,
  } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const response = await api.get('/api/v1/auth/me');

      return response.data?.data;
    },
  });

  const role = getRole(meUser);

  const loggedInEmployeeId = getEmployeeId(meUser);

  const loggedInEmployee = getEmployeeObject(meUser);

  const isHr = role === 'HR';
  const isManager = role === 'MANAGER';
  const isEmployee = role === 'EMPLOYEE';

  /*
   * Only HR can select/manage another employee.
   *
   * Manager and Employee always use their own employee ID.
   */
  const effectiveEmployeeId = isHr
    ? selectedEmployeeId
    : loggedInEmployeeId;

  /*
   * -------------------------------------------------------
   * Employee list
   *
   * ONLY HR needs this endpoint.
   *
   * Manager and Employee never load the complete employee
   * list, preventing unnecessary exposure of other employees.
   * -------------------------------------------------------
   */

  const {
    data: employeeData,
    isLoading: employeesLoading,
    error: employeesError,
    refetch: refetchEmployees,
  } = useQuery({
    queryKey: ['payroll-employees'],
    enabled: isHr,
    queryFn: async () =>
      (
        await api.get('/api/v1/employees', {
          params: {
            page: 0,
            size: 100,
          },
        })
      ).data.data,
  });

  const employees = useMemo(() => {
    if (Array.isArray(employeeData)) {
      return employeeData;
    }

    return employeeData?.data || employeeData?.content || [];
  }, [employeeData]);

  /*
   * -------------------------------------------------------
   * Set manager/employee's own employee ID automatically.
   * -------------------------------------------------------
   */

  useEffect(() => {
    if (!isHr && loggedInEmployeeId) {
      setSelectedEmployeeId(String(loggedInEmployeeId));
    }
  }, [isHr, loggedInEmployeeId]);

  /*
   * -------------------------------------------------------
   * Salary structure
   * -------------------------------------------------------
   */

  const {
    data: structure,
    isLoading: structureLoading,
    error: structureError,
    refetch: refetchStructure,
  } = useQuery({
    queryKey: [
      'salary-structure',
      effectiveEmployeeId,
    ],
    enabled: Boolean(effectiveEmployeeId),
    queryFn: async () =>
      (
        await api.get(
          `/api/v1/payroll/structure/${effectiveEmployeeId}`
        )
      ).data.data,
    retry: false,
  });

  /*
   * -------------------------------------------------------
   * Payroll history
   * -------------------------------------------------------
   */

  const {
  data: historyData,
  isLoading: historyLoading,
  error: historyError,
  refetch: refetchHistory,
} = useQuery({
  queryKey: [
    'payroll-history',
    isEmployee ? 'me' : effectiveEmployeeId,
  ],
  enabled: Boolean(effectiveEmployeeId),
  queryFn: async () => {
    const endpoint = isEmployee
      ? '/api/v1/payroll/my-history'
      : `/api/v1/payroll/history/${effectiveEmployeeId}`;

    return (
      await api.get(endpoint)
    ).data.data;
  },
});

  const history = Array.isArray(historyData)
    ? historyData
    : historyData?.data || [];

  /*
   * -------------------------------------------------------
   * Selected employee
   *
   * HR gets employee from employee selector.
   *
   * Manager/Employee gets employee from /me.
   * -------------------------------------------------------
   */

  const selectedEmployee = useMemo(() => {
    if (isHr) {
      return employees.find(
        (employee) =>
          String(employee.id) ===
          String(selectedEmployeeId)
      );
    }

    return loggedInEmployee;
  }, [
    isHr,
    employees,
    selectedEmployeeId,
    loggedInEmployee,
  ]);

  /*
   * -------------------------------------------------------
   * Populate salary structure form.
   *
   * The form is still populated for Manager/Employee so
   * their salary structure can be displayed using the same
   * component.
   * -------------------------------------------------------
   */

  useEffect(() => {
    if (structure) {
      setStructureForm({
        basicSalary: structure.basicSalary ?? '',
        allowances: structure.allowances ?? '',
        deductions: structure.deductions ?? '',
        bonuses: structure.bonuses ?? '',
      });
    } else {
      setStructureForm(emptyStructure);
    }
  }, [structure]);

  /*
   * -------------------------------------------------------
   * Save salary structure
   *
   * Only HR should be able to execute this mutation.
   * -------------------------------------------------------
   */

  const saveStructureMutation = useMutation({
    mutationFn: async () => {
      if (!isHr) {
        throw new Error(
          'Only HR can modify salary structures.'
        );
      }

      const payload = {
        employeeId: Number(selectedEmployeeId),
        basicSalary: Number(
          structureForm.basicSalary || 0
        ),
        allowances: Number(
          structureForm.allowances || 0
        ),
        deductions: Number(
          structureForm.deductions || 0
        ),
        bonuses: Number(
          structureForm.bonuses || 0
        ),
      };

      return (
        await api.post(
          '/api/v1/payroll/structure',
          payload
        )
      ).data;
    },

    onSuccess: () => {
      setMessage(
        'Salary structure saved successfully.'
      );

      setErrorMessage('');

      queryClient.invalidateQueries({
        queryKey: [
          'salary-structure',
          effectiveEmployeeId,
        ],
      });
    },

    onError: (error) => {
      setMessage('');

      setErrorMessage(
        error?.response?.data?.message ||
          error?.message ||
          'Unable to save salary structure.'
      );
    },
  });

  /*
   * -------------------------------------------------------
   * Generate payroll
   *
   * Only HR can generate payroll.
   * -------------------------------------------------------
   */

  const generatePayrollMutation = useMutation({
    mutationFn: async () => {
      if (!isHr) {
        throw new Error(
          'Only HR can generate payroll.'
        );
      }

      const payload = {
        employeeId: Number(selectedEmployeeId),
        payrollMonth,
      };

      return (
        await api.post(
          '/api/v1/payroll/generate',
          payload
        )
      ).data;
    },

    onSuccess: () => {
      setMessage(
        `Payroll generated successfully for ${payrollMonth}.`
      );

      setErrorMessage('');

      queryClient.invalidateQueries({
        queryKey: [
          'payroll-history',
          effectiveEmployeeId,
        ],
      });
    },

    onError: (error) => {
      setMessage('');

      setErrorMessage(
        error?.response?.data?.message ||
          error?.message ||
          'Unable to generate payroll.'
      );
    },
  });

  /*
   * -------------------------------------------------------
   * Structure input
   * -------------------------------------------------------
   */

  const onStructureChange = (event) => {
    const { name, value } = event.target;

    setStructureForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  /*
   * -------------------------------------------------------
   * Preview calculations
   * -------------------------------------------------------
   */

  const preview = useMemo(() => {
    const basic = Number(
      structureForm.basicSalary || 0
    );

    const allowances = Number(
      structureForm.allowances || 0
    );

    const deductions = Number(
      structureForm.deductions || 0
    );

    const bonuses = Number(
      structureForm.bonuses || 0
    );

    const isContract =
      selectedEmployee?.employmentType === 'CONTRACT';

    const gross = isContract
      ? basic + bonuses
      : basic + allowances + bonuses;

    const net = gross - deductions;

    return {
      basic,
      allowances,
      deductions,
      bonuses,
      gross,
      net,
      isContract,
    };
  }, [
    structureForm,
    selectedEmployee,
  ]);

  /*
   * -------------------------------------------------------
   * Loading states
   * -------------------------------------------------------
   */

  if (meLoading) {
    return (
      <Spinner label="Loading payroll..." />
    );
  }

  if (meError) {
    return (
      <ErrorState
        description="Unable to load your account information."
      />
    );
  }

  if (!role) {
    return (
      <ErrorState
        description="Unable to determine your account role."
      />
    );
  }

  /*
   * Manager / Employee must have an employee ID.
   */

  if (
    !isHr &&
    !loggedInEmployeeId
  ) {
    return (
      <ErrorState
        description="Employee ID was not found for your account."
      />
    );
  }

  /*
   * HR loads employee list.
   */

  if (isHr && employeesLoading) {
    return (
      <Spinner label="Loading payroll employees..." />
    );
  }

  if (isHr && employeesError) {
    return (
      <ErrorState
        description="Unable to load employees for payroll."
        onRetry={refetchEmployees}
      />
    );
  }

  return (
    <div className="min-h-screen space-y-6 bg-gradient-to-b from-purple-50 via-[#F8F6FC] to-purple-50 p-6">

      {/* ==================================================
          HEADER
          ================================================== */}

      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-purple-100 bg-white shadow-sm shadow-purple-100/50">
          <Landmark
            size={20}
            className="text-purple-500"
            strokeWidth={1.75}
          />
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-purple-500">
            Finance
          </p>

          <h1 className="mt-1 text-3xl font-bold text-gray-900">
            Payroll
          </h1>
        </div>
      </div>

      <p className="-mt-4 max-w-2xl text-sm text-gray-500">
        {isHr
          ? 'Manage salary structures, generate monthly payroll, and view employee payroll history.'
          : 'View your salary structure and payroll slip history.'}
      </p>

      {/* ==================================================
          HR EMPLOYEE SELECTION
          ================================================== */}

      {isHr ? (
        <div className={`${cardClass} p-6`}>
          <div className="grid gap-4 md:grid-cols-2">

            <div>
              <label className="mb-2 flex items-center gap-1.5 text-sm text-gray-600">
                <User
                  size={14}
                  className="text-purple-400"
                />
                Employee
              </label>

              <select
                value={selectedEmployeeId}
                onChange={(event) => {
                  setSelectedEmployeeId(
                    event.target.value
                  );

                  setMessage('');
                  setErrorMessage('');
                }}
                className="w-full rounded-xl border border-purple-100 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm transition focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-100"
              >
                <option value="">
                  Select employee
                </option>

                {employees.map((employee) => (
                  <option
                    key={employee.id}
                    value={employee.id}
                  >
                    {employee.employeeId} —{' '}
                    {employee.firstName}{' '}
                    {employee.lastName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 flex items-center gap-1.5 text-sm text-gray-600">
                <Calendar
                  size={14}
                  className="text-purple-400"
                />
                Payroll month
              </label>

              <input
                type="month"
                value={payrollMonth}
                onChange={(event) =>
                  setPayrollMonth(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-purple-100 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm transition focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-100"
              />
            </div>

          </div>

          {selectedEmployee ? (
            <div className="mt-5 flex items-center gap-4 rounded-xl border border-purple-100 bg-purple-50/60 p-4">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-purple-100 text-sm font-semibold text-purple-700">
                {initials(
                  selectedEmployee.firstName,
                  selectedEmployee.lastName
                ) || '—'}
              </div>

              <div className="flex flex-1 flex-wrap items-center justify-between gap-4">

                <div>
                  <p className="font-medium text-gray-900">
                    {selectedEmployee.firstName}{' '}
                    {selectedEmployee.lastName}
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    {selectedEmployee.employeeId}

                    {selectedEmployee.email
                      ? ` • ${selectedEmployee.email}`
                      : ''}
                  </p>
                </div>

                <div className="text-sm text-gray-600">
                  <span className="text-gray-400">
                    Employment:
                  </span>{' '}
                  {selectedEmployee.employmentType ||
                    '—'}
                </div>

              </div>
            </div>
          ) : null}
        </div>
      ) : (
        /*
         * =================================================
         * PERSONAL USER VIEW
         *
         * Same view for MANAGER and EMPLOYEE.
         * =================================================
         */

        <div className={`${cardClass} p-5`}>
          <div className="flex items-center gap-4">

            

            <div className="flex-1">
              <p className="font-semibold text-gray-900">
                {selectedEmployee?.firstName ||
                  meUser?.firstName ||
                  ''}{' '}
                {selectedEmployee?.lastName ||
                  meUser?.lastName ||
                  ''}
              </p>

              
            </div>

            <span className="rounded-full border border-purple-100 bg-purple-50 px-3 py-1 text-xs font-medium text-purple-600">
              {role}
            </span>

          </div>
        </div>
      )}

      {/* ==================================================
          HR HAS NOT SELECTED AN EMPLOYEE
          ================================================== */}

      {isHr && !selectedEmployeeId ? (
        <div className={`${cardClass} p-10 text-center`}>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-purple-100 bg-purple-50">
            <Wallet
              size={20}
              className="text-purple-400"
              strokeWidth={1.75}
            />
          </div>

          <p className="mt-4 text-lg font-medium text-gray-900">
            Select an employee
          </p>

          <p className="mt-2 text-sm text-gray-500">
            Choose an employee above to manage their
            salary structure and payroll history.
          </p>
        </div>
      ) : null}

      {/* ==================================================
          PAYROLL CONTENT
          ================================================== */}

      {effectiveEmployeeId ? (
        <>
          {/* =================================================
              MESSAGES
              ================================================= */}

          {message ? (
            <div className="flex items-center gap-2.5 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <CheckCircle2
                size={16}
                className="shrink-0"
              />
              {message}
            </div>
          ) : null}

          {errorMessage ? (
            <div className="flex items-center gap-2.5 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <AlertCircle
                size={16}
                className="shrink-0"
              />
              {errorMessage}
            </div>
          ) : null}

          {/* =================================================
              SALARY SUMMARY
              ================================================= */}

          <div>
            <p className="mb-3 text-xs uppercase tracking-[0.25em] text-gray-400">
              {isHr
                ? 'Salary overview'
                : 'My salary overview'}
            </p>

            {structureLoading ? (
              <Spinner label="Loading salary structure..." />
            ) : structureError ? (
              <div className={`${cardClass} p-5`}>
                <p className="text-sm text-gray-500">
                  No salary structure has been configured
                  for this employee yet.
                </p>

                {isHr ? (
                  <button
                    type="button"
                    onClick={refetchStructure}
                    className="mt-4 rounded-xl border border-purple-100 bg-white px-4 py-2 text-sm font-medium text-purple-700 shadow-sm transition hover:bg-purple-50"
                  >
                    Retry
                  </button>
                ) : null}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                <StatCard
                  label="Basic salary"
                  value={money(preview.basic)}
                  description="Monthly basic"
                  icon={Wallet}
                />

                <StatCard
                  label="Allowances"
                  value={money(preview.allowances)}
                  description="Monthly allowances"
                  icon={Sparkles}
                />

                <StatCard
                  label="Gross salary"
                  value={money(preview.gross)}
                  description={
                    preview.isContract
                      ? 'Basic + bonuses'
                      : 'Basic + allowances + bonuses'
                  }
                  icon={TrendingUp}
                  tone="positive"
                />

                <StatCard
                  label="Net salary"
                  value={money(preview.net)}
                  description="After deductions"
                  icon={TrendingDown}
                />

              </div>
            )}
          </div>

          {/* =================================================
              SALARY STRUCTURE
              ================================================= */}

          <div className={`${cardClass} p-6`}>

            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">

              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-purple-500">
                  Compensation
                </p>

                <h2 className="mt-1 text-xl font-semibold text-gray-900">
                  {isHr
                    ? 'Salary structure'
                    : 'My salary structure'}
                </h2>

                <p className="mt-1 text-sm text-gray-400">
                  {isHr
                    ? "Configure the employee's monthly salary components."
                    : 'View your current monthly salary components.'}
                </p>
              </div>

              {selectedEmployee?.employmentType ? (
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-medium ${
                    preview.isContract
                      ? 'border-indigo-100 bg-indigo-50 text-indigo-600'
                      : 'border-purple-100 bg-purple-50 text-purple-600'
                  }`}
                >
                  {selectedEmployee.employmentType}
                </span>
              ) : null}

            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">

              <Field
                label="Basic salary"
                name="basicSalary"
                value={structureForm.basicSalary}
                onChange={onStructureChange}
              />

              <Field
                label="Allowances"
                name="allowances"
                value={structureForm.allowances}
                onChange={onStructureChange}
              />

              <Field
                label="Deductions"
                name="deductions"
                value={structureForm.deductions}
                onChange={onStructureChange}
              />

              <Field
                label="Bonuses"
                name="bonuses"
                value={structureForm.bonuses}
                onChange={onStructureChange}
              />

            </div>

            {}

            <div className="mt-6 rounded-xl border border-purple-100 bg-purple-50/50 p-5">

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  Gross salary
                </span>

                <span className="font-medium tabular-nums text-gray-900">
                  {money(preview.gross)}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  Deductions
                </span>

                <span className="font-medium tabular-nums text-rose-600">
                  - {money(preview.deductions)}
                </span>
              </div>

              <div className="my-4 border-t border-dashed border-purple-100" />

              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">
                  Net salary
                </span>

                <span className="text-xl font-semibold tabular-nums text-purple-700">
                  {money(preview.net)}
                </span>
              </div>

            </div>

            {/* =================================================
                HR ONLY: SAVE STRUCTURE
                ================================================= */}

            {isHr ? (
              <div className="mt-6 flex justify-end">

                <button
                  type="button"
                  className="rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-purple-200 transition hover:bg-purple-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={
                    saveStructureMutation.isPending
                  }
                  onClick={() =>
                    saveStructureMutation.mutate()
                  }
                >
                  {saveStructureMutation.isPending
                    ? 'Saving...'
                    : 'Save salary structure'}
                </button>

              </div>
            ) : (
              <div className="mt-6 rounded-xl border border-purple-100 bg-purple-50/50 px-4 py-3">
                <p className="text-center text-xs text-purple-600">
                  Your salary structure is managed by HR.
                </p>
              </div>
            )}

          </div>

          {/* =================================================
              HR ONLY: GENERATE PAYROLL
              ================================================= */}

          {isHr ? (
            <div className={`${cardClass} p-6`}>

              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-purple-500">
                  Monthly payroll
                </p>

                <h2 className="mt-1 text-xl font-semibold text-gray-900">
                  Generate payroll
                </h2>

                <p className="mt-1 text-sm text-gray-400">
                  Generate the payroll record for the selected
                  month using the saved salary structure.
                </p>
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">

                <div className="rounded-xl border border-purple-100 bg-purple-50/60 p-5">

                  <div className="grid gap-4 sm:grid-cols-3">

                    <div>
                      <p className="text-xs uppercase tracking-wider text-gray-400">
                        Month
                      </p>

                      <p className="mt-1 font-medium text-gray-900">
                        {payrollMonth}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-wider text-gray-400">
                        Gross
                      </p>

                      <p className="mt-1 font-medium tabular-nums text-gray-900">
                        {money(preview.gross)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-wider text-gray-400">
                        Net
                      </p>

                      <p className="mt-1 font-medium tabular-nums text-gray-900">
                        {money(preview.net)}
                      </p>
                    </div>

                  </div>

                </div>

                <button
                  type="button"
                  className="rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-purple-200 transition hover:bg-purple-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={
                    generatePayrollMutation.isPending ||
                    !structure
                  }
                  onClick={() =>
                    generatePayrollMutation.mutate()
                  }
                >
                  {generatePayrollMutation.isPending
                    ? 'Generating...'
                    : 'Generate payroll'}
                </button>

              </div>

            </div>
          ) : null}

          {/* =================================================
              PAYROLL HISTORY / PAYSLIP HISTORY
              ================================================= */}

          <div className={`${cardClass} overflow-hidden`}>

            <div className="flex items-center justify-between gap-3 border-b border-purple-100 p-6">

              <div className="flex items-center gap-2.5">

                <FileText
                  size={16}
                  className="text-purple-500"
                />

                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-purple-500">
                    Records
                  </p>

                  <h2 className="mt-1 text-xl font-semibold text-gray-900">
                    {isHr
                      ? 'Payroll history'
                      : 'My payslip history'}
                  </h2>
                </div>

              </div>

              {!historyLoading && !historyError ? (
                <span className="rounded-full border border-purple-100 bg-purple-50 px-3 py-1 text-xs font-medium text-purple-600">
                  {history.length}{' '}
                  {history.length === 1
                    ? 'record'
                    : 'records'}
                </span>
              ) : null}

            </div>

            {historyLoading ? (
              <div className="p-6">
                <Spinner label="Loading payroll history..." />
              </div>
            ) : historyError ? (
              <div className="p-6">

                <p className="text-sm text-rose-600">
                  Unable to load payroll history.
                </p>

                <button
                  type="button"
                  className="mt-4 rounded-xl border border-purple-100 bg-white px-4 py-2 text-sm font-medium text-purple-700 shadow-sm transition hover:bg-purple-50"
                  onClick={refetchHistory}
                >
                  Retry
                </button>

              </div>
            ) : !history.length ? (
              <div className="p-10 text-center">

                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-purple-100 bg-purple-50">
                  <FileText
                    size={20}
                    className="text-purple-400"
                    strokeWidth={1.75}
                  />
                </div>

                <p className="mt-4 font-medium text-gray-900">
                  No payroll records yet
                </p>

                <p className="mt-2 text-sm text-gray-400">
                  {isHr
                    ? 'Generate payroll for a month to see the record here.'
                    : 'Your generated payslips will appear here.'}
                </p>

              </div>
            ) : (
              <div className="overflow-x-auto">

                <table className="min-w-full divide-y divide-purple-100 text-sm">

                  <thead className="bg-purple-50/60 text-left text-gray-500">

                    <tr>
                      <th className="px-5 py-4 font-medium">
                        Month
                      </th>

                      <th className="px-5 py-4 font-medium">
                        Basic
                      </th>

                      <th className="px-5 py-4 font-medium">
                        Allowances
                      </th>

                      <th className="px-5 py-4 font-medium">
                        Bonuses
                      </th>

                      <th className="px-5 py-4 font-medium">
                        Deductions
                      </th>

                      <th className="px-5 py-4 font-medium">
                        Gross
                      </th>

                      <th className="px-5 py-4 font-medium">
                        Net
                      </th>

                      
                    </tr>

                  </thead>

                  <tbody className="divide-y divide-purple-100">

                    {history.map((payroll) => (
                      <tr
                        key={payroll.id}
                        className="transition-colors duration-150 hover:bg-purple-50/50"
                      >

                        <td className="px-5 py-4 font-medium text-gray-900">
                          {payroll.payrollMonth}
                        </td>

                        <td className="px-5 py-4 tabular-nums text-gray-600">
                          {money(payroll.basicSalary)}
                        </td>

                        <td className="px-5 py-4 tabular-nums text-gray-600">
                          {money(payroll.allowances)}
                        </td>

                        <td className="px-5 py-4 tabular-nums text-gray-600">
                          {money(payroll.bonuses)}
                        </td>

                        <td className="px-5 py-4 tabular-nums text-rose-600">
                          {money(payroll.deductions)}
                        </td>

                        <td className="px-5 py-4 tabular-nums text-gray-700">
                          {money(payroll.grossSalary)}
                        </td>

                        <td className="px-5 py-4 font-semibold tabular-nums text-gray-900">
                          {money(payroll.netSalary)}
                        </td>

                        <td className="px-5 py-4">

                         

                        </td>

                      </tr>
                    ))}

                  </tbody>

                </table>

              </div>
            )}

          </div>
        </>
      ) : null}

    </div>
  );
}