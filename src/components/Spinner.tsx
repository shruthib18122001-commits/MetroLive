interface SpinnerProps {
  label?: string;
  className?: string;
}

/** Decorative spinner. Pair it with visible text; screen readers get `label`. */
export function Spinner({ label = 'Loading', className = 'h-5 w-5' }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={`inline-block animate-spin rounded-full border-2 border-current/25 border-t-current ${className}`}
    />
  );
}
