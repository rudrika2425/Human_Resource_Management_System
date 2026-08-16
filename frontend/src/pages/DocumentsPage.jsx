import { useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '../services/api';
import Spinner from '../components/Spinner';
import ErrorState from '../components/ErrorState';
import { useAuth } from '../hooks/useAuth';

const DOCUMENT_CATEGORIES = [
  {
    value: 'PROFILE_IMAGE',
    label: 'Profile Image',
    description: 'Employee profile photograph',
  },
  {
    value: 'RESUME',
    label: 'Resume',
    description: 'CV or resume',
  },
  {
    value: 'CERTIFICATE',
    label: 'Certificate',
    description: 'Educational or professional certificate',
  },
  {
    value: 'OFFER_LETTER',
    label: 'Offer Letter',
    description: 'Offer or appointment letter',
  },
  {
    value: 'EXPERIENCE_LETTER',
    label: 'Experience Letter',
    description: 'Previous employment experience letter',
  },
  {
    value: 'PAYSLIP',
    label: 'Payslip',
    description: 'Salary or payslip document',
  },
  {
    value: 'OTHER',
    label: 'Other',
    description: 'Other employee document',
  },
];

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const ALLOWED_EXTENSIONS = [
  'pdf',
  'png',
  'jpg',
  'jpeg',
  'doc',
  'docx',
];

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

function getEmployeeName(employee) {
  if (!employee) return '—';

  return (
    employee.employeeName ||
    employee.name ||
    `${employee.firstName || ''} ${employee.lastName || ''}`.trim() ||
    `Employee #${employee.id ?? '—'}`
  );
}

function formatDate(value) {
  if (!value) return '—';

  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatFileSize(bytes) {
  if (!bytes) return '0 KB';

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getCategoryLabel(category) {
  return (
    DOCUMENT_CATEGORIES.find(
      (item) => item.value === category
    )?.label ||
    String(category || 'Other').replaceAll('_', ' ')
  );
}

function getFileExtension(filename) {
  if (!filename || !filename.includes('.')) {
    return '';
  }

  return filename
    .split('.')
    .pop()
    .toLowerCase();
}

function CategoryBadge({ category }) {
  return (
    <span className="inline-flex rounded-full border border-purple-100 bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700">
      {getCategoryLabel(category)}
    </span>
  );
}

function DocumentIcon({ category }) {
  const icons = {
    PROFILE_IMAGE: '👤',
    RESUME: '📄',
    CERTIFICATE: '🎓',
    OFFER_LETTER: '✉️',
    EXPERIENCE_LETTER: '💼',
    PAYSLIP: '💰',
    OTHER: '📎',
  };

  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-purple-100 bg-purple-50 text-lg">
      {icons[category] || '📄'}
    </div>
  );
}

function StatCard({ label, value, description }) {
  return (
    <div className="rounded-2xl border border-purple-100 bg-white p-5 shadow-sm shadow-purple-100/50">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-purple-400">
        {label}
      </p>

      <p className="mt-3 text-2xl font-semibold text-gray-900">
        {value}
      </p>

      {description && (
        <p className="mt-1 text-sm text-gray-500">
          {description}
        </p>
      )}
    </div>
  );
}

export default function DocumentsPage() {
  const { user: authUser } = useAuth();
  const queryClient = useQueryClient();

  const fileInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState('documents');

  const [selectedEmployeeId, setSelectedEmployeeId] =
    useState('');

  const [category, setCategory] =
    useState('OTHER');

  const [selectedFile, setSelectedFile] =
    useState(null);

  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  /*
   * Current logged-in user.
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

  const user = meUser || authUser;

  const role = getRole(user);
  const loggedInEmployeeId = getEmployeeId(user);

  const isEmployee = role === 'EMPLOYEE';
  const isManager = role === 'MANAGER';
  const isHr = role === 'HR';

  /*
   * IMPORTANT:
   *
   * Only HR can manage other employees.
   *
   * Manager is intentionally NOT included here.
   *
   * Manager behaves like Employee and can only
   * access/upload his own documents.
   */
  const canManageEmployees = isHr;

  /*
   * Employees list is required only for HR.
   *
   * Manager does NOT load/select employees.
   */
  const {
    data: employeeData,
    isLoading: employeesLoading,
    error: employeesError,
    refetch: refetchEmployees,
  } = useQuery({
    queryKey: ['document-employees'],
    queryFn: async () => {
      const response = await api.get(
        '/api/v1/employees',
        {
          params: {
            page: 0,
            size: 100,
          },
        }
      );

      return response.data?.data;
    },
    enabled: canManageEmployees,
  });

  const employees = useMemo(() => {
    if (Array.isArray(employeeData)) {
      return employeeData;
    }

    return (
      employeeData?.content ||
      employeeData?.data ||
      []
    );
  }, [employeeData]);

  /*
   * EMPLOYEE:
   *   own employee ID
   *
   * MANAGER:
   *   own employee ID
   *
   * HR:
   *   selected employee ID
   */
  const effectiveEmployeeId =
    isEmployee || isManager
      ? loggedInEmployeeId
      : selectedEmployeeId || '';

  /*
   * Documents query.
   *
   * Employee -> own documents
   * Manager  -> own documents
   * HR       -> selected employee / all documents
   */
  const {
    data: documentsResponse,
    isLoading: documentsLoading,
    error: documentsError,
    refetch: refetchDocuments,
  } = useQuery({
    queryKey: [
      'documents',
      role,
      effectiveEmployeeId,
    ],

    queryFn: async () => {
      const params = {};

      if (effectiveEmployeeId) {
        params.employeeId = Number(
          effectiveEmployeeId
        );
      }

      const response = await api.get(
        '/api/v1/documents',
        {
          params,
        }
      );

      return response.data?.data ?? [];
    },

    enabled:
      !!role &&
      (
        isHr
          ? true
          : !!loggedInEmployeeId
      ),
  });

  const documents = Array.isArray(documentsResponse)
    ? documentsResponse
    : [];

  /*
   * Upload mutation.
   *
   * Employee -> can upload own document
   * Manager  -> can upload own document
   * HR       -> can upload selected employee document
   */
  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) {
        throw new Error('Please select a file.');
      }

      if (!effectiveEmployeeId) {
        throw new Error(
          isEmployee || isManager
            ? 'Your employee ID could not be found.'
            : 'Please select an employee.'
        );
      }

      const formData = new FormData();

      formData.append(
        'employeeId',
        String(effectiveEmployeeId)
      );

      formData.append(
        'category',
        category
      );

      formData.append(
        'file',
        selectedFile
      );

      const response = await api.post(
        '/api/v1/documents/upload',
        formData,
        {
          headers: {
            'Content-Type':
              'multipart/form-data',
          },
        }
      );

      return response.data;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['documents'],
      });

      setSelectedFile(null);
      setCategory('OTHER');

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      setMessage(
        'Document uploaded successfully.'
      );

      setErrorMessage('');

      setActiveTab('documents');
    },

    onError: (error) => {
      setMessage('');

      setErrorMessage(
        error?.response?.data?.message ||
          error?.message ||
          'Unable to upload document.'
      );
    },
  });

  /*
   * Delete mutation.
   *
   * HR ONLY.
   */
  const deleteMutation = useMutation({
    mutationFn: async (documentId) => {
      const response = await api.delete(
        `/api/v1/documents/${documentId}`
      );

      return response.data;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['documents'],
      });

      setMessage(
        'Document deleted successfully.'
      );

      setErrorMessage('');
    },

    onError: (error) => {
      setMessage('');

      setErrorMessage(
        error?.response?.data?.message ||
          'Unable to delete document.'
      );
    },
  });

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      setSelectedFile(null);
      return;
    }

    const extension =
      getFileExtension(file.name);

    if (
      !ALLOWED_EXTENSIONS.includes(extension)
    ) {
      setSelectedFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      setErrorMessage(
        'Unsupported file extension. Allowed: PDF, PNG, JPG, JPEG, DOC and DOCX.'
      );

      setMessage('');

      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setSelectedFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      setErrorMessage(
        'File size cannot exceed 10MB.'
      );

      setMessage('');

      return;
    }

    if (
      file.type &&
      !ALLOWED_TYPES.includes(file.type)
    ) {
      setSelectedFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      setErrorMessage(
        'Unsupported file type.'
      );

      setMessage('');

      return;
    }

    setSelectedFile(file);
    setErrorMessage('');
    setMessage('');
  };

  const handleUpload = (event) => {
    event.preventDefault();

    setMessage('');
    setErrorMessage('');

    if (!effectiveEmployeeId) {
      setErrorMessage(
        isEmployee || isManager
          ? 'Your employee ID could not be found.'
          : 'Please select an employee.'
      );

      return;
    }

    if (!selectedFile) {
      setErrorMessage(
        'Please select a document to upload.'
      );

      return;
    }

    uploadMutation.mutate();
  };

  const handleDelete = (documentId) => {
    if (!isHr) {
      return;
    }

    const confirmed = window.confirm(
      'Are you sure you want to delete this document?'
    );

    if (!confirmed) {
      return;
    }

    deleteMutation.mutate(documentId);
  };

  const statistics = useMemo(() => {
    const categories = new Set(
      documents.map(
        (document) => document.category
      )
    );

    const totalSize = documents.reduce(
      (sum, document) =>
        sum + Number(document.fileSize || 0),
      0
    );

    return {
      total: documents.length,
      categories: categories.size,
      totalSize,
    };
  }, [documents]);

  /*
   * Loading / error states.
   */
  if (meLoading) {
    return (
      <Spinner label="Loading user information..." />
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
   * Employee and Manager both require their own
   * employee ID.
   */
  if (
    (isEmployee || isManager) &&
    !loggedInEmployeeId
  ) {
    return (
      <ErrorState
        description="Employee ID was not found for your account."
      />
    );
  }

  /*
   * HR employee loading.
   */
  if (
    canManageEmployees &&
    employeesLoading
  ) {
    return (
      <Spinner label="Loading employees..." />
    );
  }

  if (
    canManageEmployees &&
    employeesError
  ) {
    return (
      <ErrorState
        description="Unable to load employees."
        onRetry={refetchEmployees}
      />
    );
  }

  if (documentsLoading) {
    return (
      <Spinner label="Loading documents..." />
    );
  }

  if (documentsError) {
    return (
      <ErrorState
        description="Unable to load documents."
        onRetry={refetchDocuments}
      />
    );
  }

  return (
    <div className="min-h-screen space-y-6 bg-gradient-to-b from-purple-50 via-[#F8F6FC] to-purple-50 p-4 md:p-6">

      {}
      <div className="flex flex-col justify-between gap-4 border-b border-black/10 pb-5 md:flex-row md:items-end">

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-purple-500">
            Employee Management
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900">
            Documents
          </h1>

          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            {isHr
              ? 'Manage employee documents across the organization.'
              : isManager
                ? 'View and manage your personal employee documents.'
                : 'View and manage your personal employee documents.'}
          </p>
        </div>

        <div className="rounded-xl border border-purple-100 bg-white px-4 py-3 shadow-sm shadow-purple-100/50">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-purple-400">
            Role
          </p>

          <p className="mt-1 text-lg font-semibold text-gray-900">
            {role}
          </p>
        </div>
      </div>

      {}
      {message && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </div>
      )}

      {errorMessage && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errorMessage}
        </div>
      )}

      {/* 
        HR ONLY:
        Keep the employee selector exactly as before.
        
        Employee and Manager DO NOT see this section.
      */}
      {isHr && (
        <div className="rounded-2xl border border-purple-100 bg-white p-5 shadow-sm shadow-purple-100/50">

          <div className="flex flex-col gap-4 md:flex-row md:items-end">

            <div className="flex-1">
              <label className="mb-2 block text-sm font-medium text-gray-600">
                Select Employee
              </label>

              <select
                value={selectedEmployeeId}
                onChange={(event) => {
                  setSelectedEmployeeId(
                    event.target.value
                  );

                  setActiveTab('documents');
                }}
                className="w-full rounded-xl border border-purple-100 bg-purple-50/40 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-purple-300 focus:bg-white"
              >
                <option value="">
                  All employees
                </option>

                {employees.map((employee) => (
                  <option
                    key={employee.id}
                    value={employee.id}
                  >
                    {employee.employeeId ||
                      employee.id}{' '}
                    — {getEmployeeName(employee)}
                  </option>
                ))}
              </select>
            </div>

            {selectedEmployeeId && (
              <button
                type="button"
                onClick={() =>
                  setSelectedEmployeeId('')
                }
                className="rounded-xl border border-purple-100 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-purple-50"
              >
                View All
              </button>
            )}
          </div>
        </div>
      )}

      {}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

        <StatCard
          label="Documents"
          value={statistics.total}
          description={
            isEmployee || isManager
              ? 'Your documents'
              : 'Documents shown'
          }
        />

        <StatCard
          label="Categories"
          value={statistics.categories}
          description="Document categories"
        />

        <StatCard
          label="Storage"
          value={formatFileSize(
            statistics.totalSize
          )}
          description="Total file size"
        />
      </div>

      {}
      <div className="flex gap-2 rounded-2xl border border-purple-100 bg-white p-2 shadow-sm shadow-purple-100/50">

        <button
          type="button"
          onClick={() =>
            setActiveTab('documents')
          }
          className={`rounded-xl px-4 py-2.5 text-sm font-medium transition ${
            activeTab === 'documents'
              ? 'bg-purple-600 text-white'
              : 'text-gray-500 hover:bg-purple-50 hover:text-gray-900'
          }`}
        >
          Documents
        </button>

        <button
          type="button"
          onClick={() =>
            setActiveTab('upload')
          }
          className={`rounded-xl px-4 py-2.5 text-sm font-medium transition ${
            activeTab === 'upload'
              ? 'bg-purple-600 text-white'
              : 'text-gray-500 hover:bg-purple-50 hover:text-gray-900'
          }`}
        >
          Upload Document
        </button>
      </div>

      {}
      {activeTab === 'documents' && (
        <section className="overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-sm shadow-purple-100/50">

          <div className="border-b border-black/10 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-purple-400">
              Document Library
            </p>

            <h2 className="mt-1 text-xl font-semibold text-gray-900">
              {isEmployee || isManager
                ? 'My Documents'
                : selectedEmployeeId
                  ? 'Employee Documents'
                  : 'All Documents'}
            </h2>
          </div>

          {!documents.length ? (
            <div className="p-12 text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-purple-100 bg-purple-50 text-2xl">
                📁
              </div>

              <p className="mt-4 font-medium text-gray-900">
                No documents found
              </p>

              <p className="mt-2 text-sm text-gray-500">
                Upload a document to add it to the employee's document library.
              </p>

              <button
                type="button"
                onClick={() =>
                  setActiveTab('upload')
                }
                className="mt-5 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-purple-200 transition hover:bg-purple-700"
              >
                Upload Document
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="min-w-[1000px] divide-y divide-purple-100 text-sm">

                <thead className="bg-purple-50 text-left text-gray-900">
                  <tr>

                    <th className="px-5 py-4 font-semibold uppercase tracking-[0.1em] text-xs">
                      Document
                    </th>

                    {}
                    {isHr && (
                      <th className="px-5 py-4 font-semibold uppercase tracking-[0.1em] text-xs">
                        Employee
                      </th>
                    )}

                    <th className="px-5 py-4 font-semibold uppercase tracking-[0.1em] text-xs">
                      Category
                    </th>

                    <th className="px-5 py-4 font-semibold uppercase tracking-[0.1em] text-xs">
                      Size
                    </th>

                    <th className="px-5 py-4 font-semibold uppercase tracking-[0.1em] text-xs">
                      Uploaded
                    </th>

                    <th className="px-5 py-4 font-semibold uppercase tracking-[0.1em] text-xs">
                      Action
                    </th>

                  </tr>
                </thead>

                <tbody className="divide-y divide-purple-100">

                  {documents.map((document) => (
                    <tr
                      key={document.id}
                      className="transition hover:bg-purple-50/60"
                    >

                      <td className="px-5 py-4">

                        <div className="flex items-center gap-3">

                          <DocumentIcon
                            category={
                              document.category
                            }
                          />

                          <div className="min-w-0">

                            <p className="max-w-xs truncate font-medium text-gray-900">
                              {
                                document.originalFilename
                              }
                            </p>

                            <p className="mt-1 text-xs uppercase text-gray-400">
                              {
                                document.resourceType ||
                                'file'
                              }
                            </p>

                          </div>
                        </div>
                      </td>

                      {}
                      {isHr && (
                        <td className="px-5 py-4 text-gray-600">

                          {employees.find(
                            (employee) =>
                              Number(employee.id) ===
                              Number(
                                document.employeeId
                              )
                          )
                            ? getEmployeeName(
                                employees.find(
                                  (employee) =>
                                    Number(
                                      employee.id
                                    ) ===
                                    Number(
                                      document.employeeId
                                    )
                                )
                              )
                            : `Employee #${
                                document.employeeId ??
                                '—'
                              }`}

                        </td>
                      )}

                      <td className="px-5 py-4">
                        <CategoryBadge
                          category={
                            document.category
                          }
                        />
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {formatFileSize(
                          document.fileSize
                        )}
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {formatDate(
                          document.createdAt
                        )}
                      </td>

                      <td className="px-5 py-4">

                        <div className="flex items-center gap-2">

                          <a
                            href={
                              document.secureUrl
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-lg border border-purple-100 bg-purple-50 px-3 py-2 text-xs font-medium text-purple-700 transition hover:bg-purple-100"
                          >
                            View
                          </a>

                          {}
                          {isHr && (
                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(
                                  document.id
                                )
                              }
                              disabled={
                                deleteMutation.isPending
                              }
                              className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600 transition hover:bg-rose-100"
                            >
                              Delete
                            </button>
                          )}

                        </div>
                      </td>

                    </tr>
                  ))}

                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {}
      {activeTab === 'upload' && (
        <section className="rounded-2xl border border-purple-100 bg-white shadow-sm shadow-purple-100/50">

          <div className="border-b border-black/10 p-6">

            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-purple-400">
              Document Upload
            </p>

            <h2 className="mt-1 text-xl font-semibold text-gray-900">
              Upload Employee Document
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Maximum file size is 10MB.
            </p>

          </div>

          <form
            onSubmit={handleUpload}
            className="space-y-6 p-6"
          >

            {}

            {isHr ? (
              /*
               * HR:
               * Keep employee selector exactly as before.
               */
              <div>

                <label className="mb-2 block text-sm font-medium text-gray-600">
                  Employee
                </label>

                <select
                  value={selectedEmployeeId}
                  onChange={(event) =>
                    setSelectedEmployeeId(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-purple-100 bg-purple-50/40 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-purple-300 focus:bg-white"
                  required
                >

                  <option value="">
                    Select employee
                  </option>

                  {employees.map((employee) => (
                    <option
                      key={employee.id}
                      value={employee.id}
                    >
                      {employee.employeeId ||
                        employee.id}{' '}
                      — {getEmployeeName(employee)}
                    </option>
                  ))}

                </select>

              </div>
            ) : (
              /*
               * EMPLOYEE + MANAGER:
               *
               * Same personal layout.
               *
               * No employee selector.
               *
               * Manager cannot choose another employee.
               */
              <div>

                <label className="mb-2 block text-sm font-medium text-gray-600">
                  Employee
                </label>

                <div className="rounded-xl border border-purple-100 bg-purple-50/40 px-4 py-3">

                  <p className="text-sm font-medium text-gray-900">
                    {getEmployeeName(user)}
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    Your documents
                  </p>

                </div>

              </div>
            )}

            {}

            <div>

              <label className="mb-2 block text-sm font-medium text-gray-600">
                Document Category
              </label>

              <select
                value={category}
                onChange={(event) =>
                  setCategory(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-purple-100 bg-purple-50/40 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-purple-300 focus:bg-white"
                required
              >

                {DOCUMENT_CATEGORIES.map(
                  (item) => (
                    <option
                      key={item.value}
                      value={item.value}
                    >
                      {item.label}
                    </option>
                  )
                )}

              </select>

              <p className="mt-2 text-xs text-gray-400">
                {
                  DOCUMENT_CATEGORIES.find(
                    (item) =>
                      item.value === category
                  )?.description
                }
              </p>

            </div>

            {}

            <div>

              <label className="mb-2 block text-sm font-medium text-gray-600">
                File
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                onChange={handleFileChange}
                className="block w-full cursor-pointer rounded-xl border border-purple-100 bg-purple-50/40 p-3 text-sm text-gray-600 file:mr-4 file:rounded-lg file:border-0 file:bg-purple-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-purple-700"
                required
              />

              <p className="mt-2 text-xs text-gray-400">
                PDF, PNG, JPG, JPEG, DOC or DOCX • Maximum 10MB
              </p>

            </div>

            {}

            {selectedFile && (
              <div className="rounded-xl border border-purple-100 bg-purple-50/40 p-4">

                <div className="flex items-center justify-between gap-4">

                  <div className="min-w-0">

                    <p className="truncate text-sm font-medium text-gray-900">
                      {selectedFile.name}
                    </p>

                    <p className="mt-1 text-xs text-gray-400">
                      {formatFileSize(
                        selectedFile.size
                      )}
                    </p>

                  </div>

                  <button
                    type="button"
                    onClick={() => {

                      setSelectedFile(null);

                      if (
                        fileInputRef.current
                      ) {
                        fileInputRef.current.value =
                          '';
                      }

                    }}
                    className="text-xs font-medium text-rose-600 hover:text-rose-700"
                  >
                    Remove
                  </button>

                </div>
              </div>
            )}

            {}

            <div className="flex justify-end border-t border-black/10 pt-5">

              <button
                type="submit"
                className="rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-purple-200 transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={
                  uploadMutation.isPending
                }
              >
                {uploadMutation.isPending
                  ? 'Uploading...'
                  : 'Upload Document'}
              </button>

            </div>

          </form>
        </section>
      )}

    </div>
  );
}