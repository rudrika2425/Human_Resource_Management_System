import { useState } from 'react';
import {
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';

import {
  ClipboardList,
  PlusCircle,
  Star,
} from 'lucide-react';

import { api } from '../services/api';
import Spinner from '../components/Spinner';
import ErrorState from '../components/ErrorState';

const cardClass =
  'rounded-2xl border border-purple-100 bg-white shadow-sm shadow-purple-100/50 dark:border-gray-800 dark:bg-gray-900 dark:shadow-black/30';

const inputClass =
  'relative z-[9999] w-full rounded-xl border border-purple-100 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm transition placeholder:text-gray-300 focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-100 cursor-pointer dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-purple-500 dark:focus:ring-purple-500/20';

const primaryButtonClass =
  'rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-purple-200 transition hover:bg-purple-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 dark:shadow-black/30 dark:hover:bg-purple-500';

/* =========================================================
   HELPERS
========================================================= */

function getActualEmployeeId(employee) {
  if (!employee) return null;

  return (
    employee.id ??
    employee.employee?.id ??
    employee.employee?.employeeId ??
    employee.employeeId ??
    employee.employee_id ??
    null
  );
}

function getEmployeeCode(employee) {
  if (!employee) return '—';

  return (
    employee.employeeId ??
    employee.employee_id ??
    '—'
  );
}

function getEmployeeName(employee) {
  if (!employee) return '—';

  const fullName =
    `${employee.firstName || ''} ${employee.lastName || ''}`.trim();

  return (
    employee.employeeName ||
    employee.name ||
    fullName ||
    `Employee #${
      getActualEmployeeId(employee) ?? '—'
    }`
  );
}

/* =========================================================
   MANAGER HELPERS
========================================================= */

/*
 * Get the manager ID assigned to an employee.
 *
 * Different APIs can return this relationship using
 * different property names, so we check all commonly
 * used forms.
 */
function getAssociatedManagerId(employee) {
  if (!employee) return null;

  return (
    employee.managerId ??
    employee.manager_id ??
    employee.reportingManagerId ??
    employee.reporting_manager_id ??
    employee.managerEmployeeId ??
    employee.manager_employee_id ??
    employee.assignedManagerId ??
    employee.assigned_manager_id ??
    employee.manager?.id ??
    employee.manager?.employeeId ??
    employee.manager?.employee_id ??
    employee.reportingManager?.id ??
    employee.reportingManager?.employeeId ??
    employee.reportingManager?.employee_id ??
    employee.managerEmployee?.id ??
    employee.managerEmployee?.employeeId ??
    employee.managerEmployee?.employee_id ??
    employee.employee?.managerId ??
    employee.employee?.manager_id ??
    employee.employee?.manager?.id ??
    employee.employee?.manager?.employeeId ??
    null
  );
}

/*
 * Get the actual manager object.
 *
 * First check whether the employee already contains
 * the manager object.
 *
 * If it only contains managerId, find the manager
 * from managerOptions.
 */
function getAssociatedManager(
  employee,
  managerOptions = []
) {
  if (!employee) return null;

  if (employee.manager) {
    return employee.manager;
  }

  if (employee.managerEmployee) {
    return employee.managerEmployee;
  }

  if (employee.reportingManager) {
    return employee.reportingManager;
  }

  if (employee.assignedManager) {
    return employee.assignedManager;
  }

  const associatedManagerId =
    getAssociatedManagerId(employee);

  if (
    associatedManagerId === null ||
    associatedManagerId === undefined
  ) {
    return null;
  }

  const matchedManager =
    managerOptions.find((manager) => {
      const managerId =
        getActualEmployeeId(manager);

      return (
        String(managerId) ===
        String(associatedManagerId)
      );
    });

  return matchedManager || null;
}

function getManagerName(
  employee,
  managerOptions = []
) {
  const manager = getAssociatedManager(
    employee,
    managerOptions
  );

  if (!manager) {
    const managerId =
      getAssociatedManagerId(employee);

    /*
     * If manager ID exists but manager details
     * were not found in managerOptions, show the
     * ID instead of incorrectly saying that the
     * employee has no manager.
     */
    if (
      managerId !== null &&
      managerId !== undefined
    ) {
      return `Manager #${managerId}`;
    }

    return 'Manager not assigned';
  }

  const fullName =
    `${manager.firstName || ''} ${manager.lastName || ''}`.trim();

  return (
    manager.employeeName ||
    manager.name ||
    fullName ||
    `Manager #${
      getActualEmployeeId(manager) ??
      getAssociatedManagerId(employee) ??
      '—'
    }`
  );
}

function formatDate(date) {
  if (!date) return '—';

  const parsedDate = new Date(
    `${date}T00:00:00`
  );

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return parsedDate.toLocaleDateString(
    'en-IN',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }
  );
}

/* =========================================================
   RATING
========================================================= */

function RatingPill({ value }) {
  const num = Number(value || 0);

  const tone =
    num >= 8
      ? 'text-emerald-600 dark:text-emerald-400'
      : num >= 5
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-rose-600 dark:text-rose-400';

  return (
    <span
      className={`tabular-nums font-medium ${tone}`}
    >
      {value || 0}
      <span className="text-gray-300 dark:text-gray-600">
        /10
      </span>
    </span>
  );
}

/* =========================================================
   EMPTY FORM
========================================================= */

const getEmptyReview = () => ({
  employeeId: '',
  managerId: '',
  technicalSkills: '',
  communication: '',
  teamwork: '',
  leadership: '',
  problemSolving: '',
  overallRating: '',
  feedback: '',
  reviewDate: new Date()
    .toISOString()
    .slice(0, 10),
});

/* =========================================================
   COMPONENT
========================================================= */

export default function Review({
  mode,
  role,
  isHr,
  isManager,
  isEmployee,
  canManage,
  employeeOptions,
  managerOptions,
  managerTeamEmployeeIds,
  currentEmployee,
  resolvedEmployeeId,
  currentManagerEmployeeId,
  reviews,
  reviewsLoading,
  reviewsError,
  refetchReviews,
  onSuccess,
  onError,
}) {
  const queryClient = useQueryClient();

  const [reviewForm, setReviewForm] =
    useState(getEmptyReview());

  /* =======================================================
     CREATE REVIEW
  ======================================================= */

  const createReviewMutation =
    useMutation({
      mutationFn: async (payload) => {
        console.log(
          'FINAL REVIEW PAYLOAD SENT TO BACKEND:',
          payload
        );

        const response = await api.post(
          '/api/v1/performance-reviews',
          payload
        );

        return response.data;
      },

      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [
            'performance-reviews',
          ],
        });

        setReviewForm(
          getEmptyReview()
        );

        onSuccess(
          'Performance review saved successfully.'
        );
      },

      onError: (error) => {
        console.error(
          'CREATE REVIEW ERROR:',
          error?.response?.data || error
        );

        onError(
          error?.response?.data?.message ||
            error?.response?.data?.error ||
            'Unable to save performance review.'
        );
      },
    });

  /* =======================================================
     SUBMIT
  ======================================================= */

  const handleReviewSubmit = (event) => {
    event.preventDefault();

    if (!canManage) return;

    const ratingFields = [
      'technicalSkills',
      'communication',
      'teamwork',
      'leadership',
      'problemSolving',
      'overallRating',
    ];

    if (
      !reviewForm.employeeId ||
      !reviewForm.reviewDate
    ) {
      onError(
        'Please select an employee and review date.'
      );

      return;
    }

    const employeeIdNum = Number(
      reviewForm.employeeId
    );

    if (
      !Number.isInteger(employeeIdNum) ||
      employeeIdNum <= 0
    ) {
      onError(
        'Please select a valid employee.'
      );

      return;
    }

    /* =====================================================
       MANAGER CAN ONLY REVIEW TEAM MEMBERS
    ===================================================== */

    if (isManager) {
      const selectedEmployeeIsInTeam =
        managerTeamEmployeeIds.has(
          String(employeeIdNum)
        );

      if (!selectedEmployeeIsInTeam) {
        onError(
          'You can create reviews only for employees in your team.'
        );

        return;
      }

      if (!currentManagerEmployeeId) {
        onError(
          'Unable to determine your manager employee ID.'
        );

        return;
      }
    }

    /* =====================================================
       MANAGER ID
    ===================================================== */

    const selectedEmployee =
      employeeOptions.find(
        (employee) =>
          String(
            getActualEmployeeId(employee)
          ) ===
          String(employeeIdNum)
      );

    /*
     * For HR, ALWAYS use the manager assigned
     * to the selected employee.
     *
     * This prevents HR from manually selecting
     * the wrong manager.
     */
    const associatedManagerId =
      isHr
        ? getAssociatedManagerId(
            selectedEmployee
          )
        : null;

    const managerIdValue = isManager
      ? currentManagerEmployeeId
      : isHr
        ? associatedManagerId ||
          reviewForm.managerId
        : reviewForm.managerId;

    const managerIdNum = Number(
      managerIdValue
    );

    if (
      !Number.isInteger(managerIdNum) ||
      managerIdNum <= 0
    ) {
      onError(
        'Unable to determine the manager associated with the selected employee.'
      );

      return;
    }

    /* =====================================================
       RATINGS
    ===================================================== */

    const invalidRating =
      ratingFields.some((field) => {
        const value = Number(
          reviewForm[field]
        );

        return (
          !reviewForm[field] ||
          Number.isNaN(value) ||
          value < 1 ||
          value > 10
        );
      });

    if (invalidRating) {
      onError(
        'All performance ratings must be between 1 and 10.'
      );

      return;
    }

    /* =====================================================
       PAYLOAD
    ===================================================== */

    const payload = {
      employeeId: employeeIdNum,

      managerId: managerIdNum,

      technicalSkills: Number(
        reviewForm.technicalSkills
      ),

      communication: Number(
        reviewForm.communication
      ),

      teamwork: Number(
        reviewForm.teamwork
      ),

      leadership: Number(
        reviewForm.leadership
      ),

      problemSolving: Number(
        reviewForm.problemSolving
      ),

      overallRating: Number(
        reviewForm.overallRating
      ),

      feedback:
        reviewForm.feedback.trim() ||
        null,

      reviewDate:
        reviewForm.reviewDate,
    };

    console.log(
      'FINAL REVIEW PAYLOAD:',
      payload
    );

    createReviewMutation.mutate(
      payload
    );
  };

  /* =======================================================
     ADD REVIEW
  ======================================================= */

  if (mode === 'create-review') {
    return (
      <section className={cardClass}>

        <div className="flex items-center gap-2.5 border-b border-purple-100 px-5 py-5 dark:border-gray-800">

          <PlusCircle
            size={16}
            className="text-purple-500 dark:text-purple-400"
          />

          <div>

            <p className="text-xs font-medium uppercase tracking-[0.16em] text-gray-400 dark:text-gray-500">
              Evaluation
            </p>

            <h2 className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
              Add Performance Review
            </h2>

            <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
              {isManager
                ? 'Review an employee who reports to you.'
                : 'Record employee performance ratings and feedback.'}
            </p>

          </div>

        </div>

        <form
          onSubmit={handleReviewSubmit}
          className="space-y-6 p-4 sm:p-5"
        >

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

            {}

            <div>

              <label className="mb-2 block text-sm text-gray-600 dark:text-gray-400">
                {isManager
                  ? 'Team Employee'
                  : 'Employee'}
              </label>

              <select
                value={
                  reviewForm.employeeId
                }
                onChange={(event) => {
                  const selectedEmployeeId =
                    event.target.value;

                  const selectedEmployee =
                    employeeOptions.find(
                      (employee) =>
                        String(
                          getActualEmployeeId(
                            employee
                          )
                        ) ===
                        String(
                          selectedEmployeeId
                        )
                    );

                  /*
                   * HR:
                   * Automatically determine the
                   * manager assigned to the selected
                   * employee.
                   */
                  if (isHr) {
                    const associatedManagerId =
                      getAssociatedManagerId(
                        selectedEmployee
                      );

                    console.log(
                      'SELECTED EMPLOYEE:',
                      selectedEmployee
                    );

                    console.log(
                      'ASSIGNED MANAGER ID:',
                      associatedManagerId
                    );

                    console.log(
                      'ASSIGNED MANAGER:',
                      getAssociatedManager(
                        selectedEmployee,
                        managerOptions
                      )
                    );

                    setReviewForm(
                      (current) => ({
                        ...current,
                        employeeId:
                          selectedEmployeeId,
                        managerId:
                          associatedManagerId
                            ? String(
                                associatedManagerId
                              )
                            : '',
                      })
                    );

                    return;
                  }

                  setReviewForm(
                    (current) => ({
                      ...current,
                      employeeId:
                        selectedEmployeeId,
                    })
                  );
                }}
                className={inputClass}
                required
              >

                <option value="">
                  Select employee
                </option>

                {employeeOptions.map(
                  (employee) => {
                    const employeeId =
                      getActualEmployeeId(
                        employee
                      );

                    if (
                      employeeId === null ||
                      employeeId === undefined
                    ) {
                      return null;
                    }

                    return (
                      <option
                        key={String(
                          employeeId
                        )}
                        value={String(
                          employeeId
                        )}
                      >
                        {getEmployeeCode(
                          employee
                        )}{' '}
                        —{' '}
                        {getEmployeeName(
                          employee
                        )}
                      </option>
                    );
                  }
                )}

              </select>

              {employeeOptions.length ===
                0 && (
                <p className="mt-1.5 text-xs text-rose-500 dark:text-rose-400">
                  {isManager
                    ? 'No employees are currently assigned to your team.'
                    : 'No employees with EMPLOYEE role found.'}
                </p>
              )}

              {isManager &&
                employeeOptions.length >
                  0 && (
                  <p className="mt-1.5 text-xs text-purple-500 dark:text-purple-400">
                    Only your team members are available.
                  </p>
                )}

            </div>

            {}

            <div>

              <label className="mb-2 block text-sm text-gray-600 dark:text-gray-400">
                Manager
              </label>

              {isManager ? (

                <input
                  type="text"
                  value="Current Manager"
                  className={`${inputClass} bg-gray-50 dark:bg-gray-800`}
                  readOnly
                />

              ) : isHr ? (

                /*
                 * HR DOES NOT GET A DROPDOWN.
                 *
                 * Manager is automatically found
                 * from the selected employee's
                 * managerId and managerOptions.
                 */

                <input
                  type="text"
                  value={
                    reviewForm.employeeId
                      ? getManagerName(
                          employeeOptions.find(
                            (employee) =>
                              String(
                                getActualEmployeeId(
                                  employee
                                )
                              ) ===
                              String(
                                reviewForm.employeeId
                              )
                          ),
                          managerOptions
                        )
                      : ''
                  }
                  placeholder="Manager will be selected automatically"
                  className={`${inputClass} bg-gray-50 cursor-default dark:bg-gray-800`}
                  readOnly
                />

              ) : (

                <select
                  value={
                    reviewForm.managerId
                  }
                  onChange={(event) =>
                    setReviewForm(
                      (current) => ({
                        ...current,
                        managerId:
                          event.target.value,
                      })
                    )
                  }
                  className={inputClass}
                  required
                >

                  <option value="">
                    Select manager
                  </option>

                  {managerOptions.map(
                    (manager) => {
                      const managerId =
                        getActualEmployeeId(
                          manager
                        );

                      if (
                        managerId === null ||
                        managerId === undefined
                      ) {
                        return null;
                      }

                      return (
                        <option
                          key={String(
                            managerId
                          )}
                          value={String(
                            managerId
                          )}
                        >
                          {getEmployeeCode(
                            manager
                          )}{' '}
                          —{' '}
                          {getEmployeeName(
                            manager
                          )}
                        </option>
                      );
                    }
                  )}

                </select>

              )}

              {isHr &&
                reviewForm.employeeId && (
                  <p className="mt-1.5 text-xs text-purple-500 dark:text-purple-400">
                    Manager is automatically assigned from the selected employee.
                  </p>
                )}

            </div>

            {}

            {[
              [
                'technicalSkills',
                'Technical Skills',
              ],
              [
                'communication',
                'Communication',
              ],
              [
                'teamwork',
                'Teamwork',
              ],
              [
                'leadership',
                'Leadership',
              ],
              [
                'problemSolving',
                'Problem Solving',
              ],
              [
                'overallRating',
                'Overall Rating',
              ],
            ].map(
              ([name, label]) => (
                <div key={name}>

                  <label className="mb-2 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">

                    <span>
                      {label}
                    </span>

                    <span className="text-xs text-gray-300 dark:text-gray-600">
                      1–10
                    </span>

                  </label>

                  <input
                    type="number"
                    min="1"
                    max="10"
                    step="1"
                    value={
                      reviewForm[name]
                    }
                    onChange={(event) =>
                      setReviewForm(
                        (current) => ({
                          ...current,
                          [name]:
                            event.target
                              .value,
                        })
                      )
                    }
                    className={`${inputClass} tabular-nums`}
                    required
                  />

                </div>
              )
            )}

            {}

            <div>

              <label className="mb-2 block text-sm text-gray-600 dark:text-gray-400">
                Review Date
              </label>

              <input
                type="date"
                value={
                  reviewForm.reviewDate
                }
                onChange={(event) =>
                  setReviewForm(
                    (current) => ({
                      ...current,
                      reviewDate:
                        event.target.value,
                    })
                  )
                }
                className="w-full rounded-xl border border-purple-100 bg-purple-50/40 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-purple-300 focus:bg-white focus:ring-2 focus:ring-purple-100 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-100 dark:focus:border-purple-500 dark:focus:bg-gray-800 dark:focus:ring-purple-500/20"
                required
              />

            </div>

            {}

            <div className="md:col-span-2">

              <label className="mb-2 block text-sm text-gray-600 dark:text-gray-400">
                Feedback
              </label>

              <textarea
                rows={5}
                value={
                  reviewForm.feedback
                }
                onChange={(event) =>
                  setReviewForm(
                    (current) => ({
                      ...current,
                      feedback:
                        event.target.value,
                    })
                  )
                }
                className={`${inputClass} resize-none`}
                placeholder="Enter performance feedback..."
              />

            </div>

          </div>

          <div className="flex justify-end">

            <button
              type="submit"
              className={`w-full sm:w-auto ${primaryButtonClass}`}
              disabled={
                createReviewMutation.isPending ||
                employeeOptions.length === 0 ||
                !reviewForm.employeeId ||
                (!isManager &&
                  !reviewForm.managerId)
              }
            >
              {createReviewMutation.isPending
                ? 'Saving...'
                : 'Save Performance Review'}
            </button>

          </div>

        </form>

      </section>
    );
  }

  /* =======================================================
     REVIEWS TABLE
  ======================================================= */

  return (
    <section
      className={`${cardClass} overflow-hidden`}
    >

      <div className="flex items-center gap-2.5 border-b border-purple-100 p-4 sm:p-6 dark:border-gray-800">

        <ClipboardList
          size={16}
          className="text-purple-500 dark:text-purple-400"
        />

        <div>

          <p className="text-xs uppercase tracking-[0.2em] text-purple-500 dark:text-purple-400">
            Evaluations
          </p>

          <h2 className="mt-1 text-xl font-semibold text-gray-900 dark:text-gray-100">

            {isEmployee
              ? 'My Performance Reviews'
              : isManager
                ? 'My & Team Reviews'
                : 'Performance Reviews'}

          </h2>

        </div>

      </div>

      {reviewsLoading ? (
        <div className="p-8">
          <Spinner label="Loading performance reviews..." />
        </div>
      ) : reviewsError ? (
        <div className="p-8">
          <ErrorState
            description="Unable to load performance reviews."
            onRetry={refetchReviews}
          />
        </div>
      ) : !reviews.length ? (
        <div className="p-10 text-center">

          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-purple-100 bg-purple-50 dark:border-gray-700 dark:bg-gray-800">

            <ClipboardList
              size={20}
              className="text-purple-400 dark:text-purple-400"
              strokeWidth={1.75}
            />

          </div>

          <p className="mt-4 font-medium text-gray-900 dark:text-gray-100">
            No performance reviews yet
          </p>

          <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">

            {isEmployee
              ? 'No performance reviews have been assigned to you yet.'
              : isManager
                ? 'No reviews are available for you or your team members.'
                : 'Create a review to start evaluating employee performance.'}

          </p>

        </div>
      ) : (
        <div className="overflow-x-auto">

          <table className="min-w-[1200px] divide-y divide-purple-100 text-sm dark:divide-gray-800">

            <thead className="bg-purple-50/60 text-left text-gray-500 dark:bg-gray-800/60 dark:text-gray-400">

              <tr>

                <th className="px-5 py-4 font-medium">
                  Employee
                </th>

                <th className="px-5 py-4 font-medium">
                  Manager
                </th>

                <th className="px-5 py-4 font-medium">
                  Technical
                </th>

                <th className="px-5 py-4 font-medium">
                  Communication
                </th>

                <th className="px-5 py-4 font-medium">
                  Teamwork
                </th>

                <th className="px-5 py-4 font-medium">
                  Leadership
                </th>

                <th className="px-5 py-4 font-medium">
                  Problem Solving
                </th>

                <th className="px-5 py-4 font-medium">
                  Overall
                </th>

                <th className="px-5 py-4 font-medium">
                  Review Date
                </th>

              </tr>

            </thead>

            <tbody className="divide-y divide-purple-100 dark:divide-gray-800">

              {reviews.map(
                (review) => (
                  <tr
                    key={review.id}
                    className="transition-colors duration-150 hover:bg-purple-50/50 dark:hover:bg-gray-800/50"
                  >

                    <td className="px-5 py-4 font-medium text-gray-900 dark:text-gray-100">
                      {review.employeeName ||
                        review.employee?.name ||
                        `${review.employee?.firstName || ''} ${
                          review.employee?.lastName || ''
                        }`.trim() ||
                        '—'}
                    </td>

                    <td className="px-5 py-4 text-gray-600 dark:text-gray-400">
                      {review.managerName ||
                        review.manager?.name ||
                        `${review.manager?.firstName || ''} ${
                          review.manager?.lastName || ''
                        }`.trim() ||
                        '—'}
                    </td>

                    <td className="px-5 py-4">
                      <RatingPill
                        value={
                          review.technicalSkills
                        }
                      />
                    </td>

                    <td className="px-5 py-4">
                      <RatingPill
                        value={
                          review.communication
                        }
                      />
                    </td>

                    <td className="px-5 py-4">
                      <RatingPill
                        value={
                          review.teamwork
                        }
                      />
                    </td>

                    <td className="px-5 py-4">
                      <RatingPill
                        value={
                          review.leadership
                        }
                      />
                    </td>

                    <td className="px-5 py-4">
                      <RatingPill
                        value={
                          review.problemSolving
                        }
                      />
                    </td>

                    <td className="px-5 py-4">

                      <span className="inline-flex items-center gap-1.5">

                        <Star
                          size={13}
                          className="text-amber-400"
                          fill="currentColor"
                          strokeWidth={0}
                        />

                        <RatingPill
                          value={
                            review.overallRating
                          }
                        />

                      </span>

                    </td>

                    <td className="px-5 py-4 text-gray-500 dark:text-gray-400">
                      {formatDate(
                        review.reviewDate
                      )}
                    </td>

                  </tr>
                )
              )}

            </tbody>

          </table>

        </div>
      )}

    </section>
  );
}