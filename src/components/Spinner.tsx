interface SpinnerProps {
  label?: string;
  className?: string;
}

/** Decorative spinner. Pair it with visible text; screen readers get `label`. */
export function Spinner({ label = 'Loading', className = 'h-6 w-6' }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={`inline-block animate-spin rounded-full border-2 border-neutral-300 border-t-brand-600 ${className}`}
    />
  );
}
