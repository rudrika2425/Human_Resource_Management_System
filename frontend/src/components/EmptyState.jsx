export default function EmptyState({ title, description }) {
  return (
    <div className="rounded-2xl border border-purple-100 bg-purple-50/60 p-8 text-center">
      <p className="text-lg font-semibold text-gray-900">{title}</p>

      <p className="mt-2 text-sm leading-6 text-gray-500">
        {description}
      </p>
    </div>
  );
}