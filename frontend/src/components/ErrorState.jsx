export default function ErrorState({
  title = 'Something went wrong',
  description,
  onRetry,
}) {
  return (
    <div className="rounded-2xl border border-purple-100 bg-purple-50/60 p-6">
      <p className="text-lg font-semibold text-gray-900">
        {title}
      </p>

      <p className="mt-2 text-sm text-gray-500">
        {description}
      </p>

      {onRetry ? (
        <button
          className="mt-4 rounded-xl bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-purple-200 transition hover:bg-purple-700"
          onClick={onRetry}
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}