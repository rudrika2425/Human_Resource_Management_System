export default function Spinner({ label = 'Loading...' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-10 text-sm text-gray-500">
      <div className="h-4 w-4 animate-spin rounded-full border-2 border-purple-400 border-t-transparent" />
      <span>{label}</span>
    </div>
  );
}