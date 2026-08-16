import clsx from 'clsx';

export default function StatusBadge({ value }) {
  const label = String(value ?? 'Unknown');
  const tone = label.toLowerCase();

  const isPositive = [
    'active',
    'open',
    'present',
    'approved',
    'completed',
    'selected',
    'hires',
    'hired',
    'read',
  ].some((word) => tone.includes(word));

  const isWarning = [
    'pending',
    'screening',
    'shortlisted',
    'late',
    'on_leave',
    'on leave',
    'draft',
    'rescheduled',
  ].some((word) => tone.includes(word));

  const className = clsx(
    'inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide',
    
    isPositive &&
      'border-emerald-100 bg-emerald-50 text-emerald-600',

    isWarning &&
      'border-amber-100 bg-amber-50 text-amber-600',

    !isPositive &&
      !isWarning &&
      'border-purple-100 bg-purple-50 text-purple-600',
  );

  return (
    <span className={className}>
      {label.replaceAll('_', ' ')}
    </span>
  );
}