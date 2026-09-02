interface BarProps {
  className?: string;
}

/** A single shimmering placeholder bar. */
export function SkeletonBar({ className = '' }: BarProps) {
  return (
    <span className={`relative block overflow-hidden rounded bg-neutral-200/70 ${className}`}>
      <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/70 to-transparent animate-shimmer" />
    </span>
  );
}

/** Placeholder that mirrors an <ArrivalRow> while the first fetch is in flight. */
export function ArrivalRowSkeleton({ delayMs = 0 }: { delayMs?: number }) {
  return (
    <div
      className="flex h-20 items-center gap-3 rounded-2xl border border-neutral-200/80 bg-white px-3.5 shadow-card animate-rise"
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <SkeletonBar className="h-8 w-11 rounded-lg" />
      <div className="flex-1 space-y-2">
        <SkeletonBar className="h-3.5 w-2/3" />
        <SkeletonBar className="h-3 w-16 rounded-full" />
      </div>
      <SkeletonBar className="h-6 w-9" />
    </div>
  );
}
